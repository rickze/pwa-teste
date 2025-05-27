document.addEventListener('DOMContentLoaded', () => {
  let db;
  let html5QrCode;
  const utilizadorAtual = localStorage.getItem("utilizador");

  const btnQr = document.getElementById("btn-qr");
  const btnExportar = document.getElementById("btn-exportar");

  btnQr.disabled = !utilizadorAtual;
  btnExportar.disabled = true;

  if (!utilizadorAtual) {
    console.warn("Utilizador não autenticado. Interface bloqueada.");
    return;
  }

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

  btnQr.addEventListener("click", () => {
    const qrContainer = document.getElementById("leitor-qr");

    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        qrContainer.innerHTML = "";
        html5QrCode = null;
        btnQr.textContent = "Ler QR Code";
      });
      return;
    }

    html5QrCode = new Html5Qrcode("leitor-qr");
    const config = { fps: 10, qrbox: 250 };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        html5QrCode.stop().then(() => {
          qrContainer.innerHTML = "";
          html5QrCode = null;
          btnQr.textContent = "Ler QR Code";
          guardarDado(decodedText);
        });
      }
    ).then(() => {
      btnQr.textContent = "Parar Leitura";
    }).catch(err => {
      console.error("Erro ao iniciar câmara:", err);
      alert("Erro ao iniciar a câmara.");
      html5QrCode = null;
    });
  });

  function guardarDado(valor) {
    if (!utilizadorAtual) {
      alert("Utilizador não definido.");
      return;
    }

    const limpo = valor.replace(/^\[QR\]\s*/i, "");
    const partes = limpo.split("|").map(p => p.trim());

    if (partes.length !== 4) {
      alert("Formato inválido. Esperado: Nº | Descrição | Tipo | Empresa");
      return;
    }

    const numero = partes[0];

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
        const dado = {
          numero: partes[0],
          descricao: partes[1],
          tipo: partes[2],
          empresa: partes[3],
          timestamp: new Date().toISOString(),
          utilizador: utilizadorAtual
        };

        const tx = db.transaction("dados", "readwrite");
        const store = tx.objectStore("dados");
        store.add(dado);
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
    let encontrouDados = false;

    request.onsuccess = (event) => {
      const cursor = event.target.result;

      if (cursor) {
        const item = cursor.value;
        if (item.utilizador === utilizadorAtual) {
          encontrouDados = true;

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
        }
        cursor.continue();
      } else {
        btnExportar.disabled = !encontrouDados;
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

  btnExportar.addEventListener("click", () => {
    const tx = db.transaction("dados", "readonly");
    const store = tx.objectStore("dados");
    const request = store.getAll();

    request.onsuccess = () => {
      const dados = request.result.filter(d => d.utilizador === utilizadorAtual);
      if (!dados.length) {
        alert("Não existem dados para exportar.");
        return;
      }

      const linhas = [
        ["numero", "descricao", "tipo", "empresa", "utilizador", "timestamp"].join(";")
      ];

      dados.forEach(item => {
        const linha = [
          item.numero || "",
          item.descricao || "",
          item.tipo || "",
          item.empresa || "",
          item.utilizador || "-",
          item.timestamp || ""
        ];
        linhas.push(linha.join(";"));
      });

      const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "registos_qr.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  });

});