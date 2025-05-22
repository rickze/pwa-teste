let db;
const request = indexedDB.open("PWA_DB", 1);

request.onerror = () => {
  console.error("❌ Erro ao abrir IndexedDB");
};

request.onsuccess = (event) => {
  db = event.target.result;
  atualizarLista();
};

request.onupgradeneeded = (event) => {
  db = event.target.result;
  if (!db.objectStoreNames.contains("dados")) {
    db.createObjectStore("dados", { autoIncrement: true });
  }
};

function guardarDado(valor) {
  const tx = db.transaction("dados", "readwrite");
  const store = tx.objectStore("dados");
  store.add(valor);
  tx.oncomplete = () => atualizarLista();
}

function atualizarLista() {
  const lista = document.getElementById("lista-dados");
  lista.innerHTML = "";

  const tx = db.transaction("dados", "readonly");
  const store = tx.objectStore("dados");
  const request = store.openCursor();

  let i = 1;
  request.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const li = document.createElement("li");
      li.textContent = `${i++}: ${cursor.value}`;
      lista.appendChild(li);
      cursor.continue();
    }
  };
}

document.getElementById("formulario").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("dado");
  const valor = input.value.trim();
  if (valor) {
    guardarDado(valor);
    input.value = "";
  }
});
