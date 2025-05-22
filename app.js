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
  // Remove prefixo [QR] (com ou sem espaços)
  const limpo = valor.replace(/^\[QR\]\s*/i, "");
  const partes = limpo.split("|").map(p => p.trim());

  if (partes.length !== 4) {
    console.warn("QR com formato incorreto:", valor);
    alert("Formato inválido. Esperado: Nº | Descrição | Tipo | Empresa");
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
      const id = cursor.key;

      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${i++}</strong> |
        Nº: ${item.numero} |
        Desc: ${item.descricao} |
        Tipo: ${item.tipo} |
        Empresa: ${item.empresa} |
        <button data-id="${id}" class="btn-eliminar">🗑️</button>
      `;
      lista.appendChild(li);
      cursor.continue();
    }
  };
}
document.addEventListener("click", (event) => {
  if (event.target.classList.contains("btn-eliminar")) {
    const id = Number(event.target.getAttribute("data-id"));
    if (confirm("Eliminar este registo?")) {
      const tx = db.transaction("dados", "readwrite");
      const store = tx.objectStore("dados");
      store.delete(id);
      tx.oncomplete = () => atualizarLista();
    }
  }
});

// Submissão manual via formulário
document.getElementById("formulario").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("dado");
  const valor = input.value.trim();
  if (valor) {
    guardarDado(valor);
    input.value = "";
  }
});

// Leitura de QR code
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
        guardarDado(decodedText); // Já removeste o prefixo [QR], mantemos limpo
      });
    },
    (errorMessage) => {
      // Ignorar erros normais de leitura
    }
  ).catch((err) => {
    console.error("Erro ao iniciar câmara:", err);
  });
});

// Exportação para CSV
document.getElementById("btn-exportar").addEventListener("click", () => {
  const tx = db.transaction("dados", "readonly");
  const store = tx.objectStore("dados");
  const request = store.getAll();

  request.onsuccess = () => {
    const dados = request.result;

    if (!dados.length) {
      alert("Não existem dados para exportar.");
      return;
    }

    const cabecalhos = ["numero", "descricao", "tipo", "empresa", "timestamp"];
    const linhas = [cabecalhos.join(";")];

    dados.forEach(item => {
      const linha = [
        item.numero || "",
        item.descricao || "",
        item.tipo || "",
        item.empresa || "",
        item.timestamp || ""
      ];
      linhas.push(linha.join(";"));
    });

    const csvContent = linhas.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "dados_exportados.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
});
