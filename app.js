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
  const partes = valor.split("|").map(p => p.trim());

  if (partes.length !== 4) {
    console.warn("Formato de QR inválido:", valor);
    return;
  }

  const dadoEstruturado = {
    numero: partes[0],
    descricao: partes[1],
    tipo: partes[2],
    empresa: partes[3],
    timestamp: new Date().toISOString()
  };

  const tx = db.transaction("dados", "readwrite");
  const store = tx.objectStore("dados");
  store.add(dadoEstruturado);
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
      const item = cursor.value;
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${i++}</strong> |
        Nº: ${item.numero} |
        Desc: ${item.descricao} |
        Tipo: ${item.tipo} |
        Empresa: ${item.empresa}
      `;
      lista.appendChild(li);
      cursor.continue();
    }
  };
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
const btnQr = document.getElementById("btn-qr");
btnQr.addEventListener("click", () => {
  const html5QrCode = new Html5Qrcode("leitor-qr");
  const config = { fps: 10, qrbox: 250 };

  html5QrCode.start(
    { facingMode: "environment" },
    config,
    (decodedText, decodedResult) => {
      console.log("QR lido:", decodedText);
      html5QrCode.stop().then(() => {
        document.getElementById("leitor-qr").innerHTML = "";
        guardarDado(`[QR] ${decodedText}`);
      });
    },
    (errorMessage) => {
      // Ignorar erros normais de leitura
    }
  ).catch((err) => {
    console.error("Erro ao iniciar câmara:", err);
  });
});
