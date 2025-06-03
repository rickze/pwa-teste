const DB_NAME = "qr_app_db";
const STORE_NAME = "offline_registos";
let db = null;

export function initIndexedDB() {
  const request = indexedDB.open(DB_NAME, 1);

  request.onerror = (event) => {
    console.error("❌ Erro ao abrir IndexedDB:", event);
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    console.log("✅ IndexedDB pronta");

    if (navigator.onLine) {
      sincronizarLocalParaSupabase();
    }
  };

  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { autoIncrement: true });
    }
  };

  window.addEventListener("online", sincronizarLocalParaSupabase);
}

export function guardarLocal(dado) {
  if (!db) {
    console.warn("IndexedDB ainda não está disponível.");
    return;
  }

  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.add(dado);
  console.log("📥 Guardado localmente:", dado);
}

export function sincronizarLocalParaSupabase() {
  if (!db) {
    console.warn("IndexedDB não disponível para sincronizar.");
    return;
  }

  const SUPABASE_URL = "https://nyscrldksholckwexdsc.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTQ3MDMsImV4cCI6MjA2MzkzMDcwM30.UyF6P7j2b7tdRanWWj6T58haubt2IYiLhmx6xnwYXpE";
  const SUPABASE_AUT = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM1NDcwMywiZXhwIjoyMDYzOTMwNzAzfQ.nd9SNwTR8v-jkkEy3uCobiBF0srzo2_ndv71PG7qL5M";

  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const req = store.getAll();

  req.onsuccess = async () => {
    const dados = req.result;

    if (!dados.length) {
      console.log("📭 Nada a sincronizar");
      return;
    }

    console.log(`📡 A sincronizar ${dados.length} registos...`);

    const deleteTx = db.transaction(STORE_NAME, "readwrite");
    const deleteStore = deleteTx.objectStore(STORE_NAME);

    for (let i = 0; i < dados.length; i++) {
      const dado = dados[i];

      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/dados`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: SUPABASE_AUT,
            "Content-Type": "application/json",
            Prefer: "return=representation"
          },
          body: JSON.stringify(dado)
        });

        if (res.ok) {
          console.log(`✅ Sincronizado: ${dado.numero}`);
          deleteStore.delete(i + 1); // assumindo que autoIncrement começa em 1
        } else {
          console.error("❌ Erro Supabase:", await res.text());
        }
      } catch (err) {
        console.error("❌ Erro de rede:", err);
      }
    }
  };

  req.onerror = (event) => {
    console.error("❌ Erro ao ler dados offline:", event);
  };
}