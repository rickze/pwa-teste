let db;
let utilizadorAtual = "";
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
  if (!utilizadorAtual) {
    alert("Utilizador não definido. Por favor, preenche e confirma antes de registar dados.");
    return;
  }

  const limpo = valor.replace(/^\[QR\]\s*/i, "");
  const partes = limpo.split("|").map(p => p.trim());

  if (partes.length !== 4) {
    console.warn("QR com formato incorreto:", valor);
    alert("Formato inválido. Esperado: Nº | Descrição | Tipo | Empresa");
    return;
  }

  const numero = partes[0];

  // Verificar duplicado
  const txCheck = db.transaction("dados", "readonly");
  const storeCheck = txCheck.objectStore("dados");
  const indexRequest = storeCheck.openCursor();
  let duplicado = false;

  indexRequest.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      if (cursor.value.numero === numero) {
        duplicado = true;
        alert(`O registo com número "${numero}" já existe.`);
        return;
      }
      cursor.continue();
    } else if (!duplicado) {
      const dadoEstruturado = {
        numero: partes[0],
        descricao: partes[1],
        tipo: partes[2],
        empresa: partes[3],
        timestamp: new Date().toISOString(),
        utilizador: utilizadorAtual
      };

      const tx = db.transaction("dados", "readwrite");
      const store = tx.objectStore("dados");
      store.add(dadoEstruturado);
      tx.oncomplete = () => atualizarLista();
    }
  };
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
        Utilizador: ${item.utilizador || "-"} |
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
document.getElementById("confirmar-utilizador").addEventListener("click", () => {
  const input = document.getElementById("utilizador");
  const nome = input.value.trim();

  if (!nome) {
    alert("Por favor, introduz o nome do utilizador.");
    return;
  }

  utilizadorAtual = nome;
  input.disabled = true;
  document.getElementById("confirmar-utilizador").disabled = true;

  alert(`Utilizador definido: ${utilizadorAtual}`);
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
