document.addEventListener('DOMContentLoaded', () => {
  const utilizadorAtual = localStorage.getItem("utilizador");
  const btnQr = document.getElementById("btn-qr");
  const btnExportar = document.getElementById("btn-exportar");
  const lista = document.getElementById("lista-dados");
  let html5QrCode;

  btnQr.disabled = !utilizadorAtual;
  btnExportar.disabled = true;

  if (!utilizadorAtual) {
    console.warn("Utilizador não autenticado.");
    return;
  }

  atualizarLista();

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

    const dado = {
      numero: partes[0],
      descricao: partes[1],
      tipo: partes[2],
      empresa: partes[3],
      utilizador: utilizadorAtual,
      timestamp: new Date().toISOString()
    };

    fetch("https://nyscrldksholckwexdsc.supabase.co/rest/v1/dados", {
      method: "POST",
      headers: {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTQ3MDMsImV4cCI6MjA2MzkzMDcwM30.UyF6P7j2b7tdRanWWj6T58haubt2IYiLhmx6xnwYXpE",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTQ3MDMsImV4cCI6MjA2MzkzMDcwM30.UyF6P7j2b7tdRanWWj6T58haubt2IYiLhmx6xnwYXpE",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(dado)
    })
    .then(res => res.json())
    .then(() => atualizarLista())
    .catch(err => {
      console.error("Erro ao guardar:", err);
      alert("Erro ao guardar o registo.");
    });
  }

  function atualizarLista() {
    lista.innerHTML = "";

    fetch("https://nyscrldksholckwexdsc.supabase.co/rest/v1/dados?utilizador=eq." + encodeURIComponent(utilizadorAtual), {
      headers: {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTQ3MDMsImV4cCI6MjA2MzkzMDcwM30.UyF6P7j2b7tdRanWWj6T58haubt2IYiLhmx6xnwYXpE",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTQ3MDMsImV4cCI6MjA2MzkzMDcwM30.UyF6P7j2b7tdRanWWj6T58haubt2IYiLhmx6xnwYXpE"
      }
    })
    .then(res => res.json())
    .then(data => {
      if (!data.length) {
        btnExportar.disabled = true;
        return;
      }

      btnExportar.disabled = false;
      data.forEach((item, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${i + 1}</strong> |
          Nº: ${item.numero} |
          Desc: ${item.descricao} |
          Tipo: ${item.tipo} |
          Empresa: ${item.empresa} |
          Utilizador: ${item.utilizador || "-"}
        `;
        lista.appendChild(li);
      });
    });
  }

  btnExportar.addEventListener("click", () => {
    fetch("https://nyscrldksholckwexdsc.supabase.co/rest/v1/dados?utilizador=eq." + encodeURIComponent(utilizadorAtual), {
      headers: {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTQ3MDMsImV4cCI6MjA2MzkzMDcwM30.UyF6P7j2b7tdRanWWj6T58haubt2IYiLhmx6xnwYXpE",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTQ3MDMsImV4cCI6MjA2MzkzMDcwM30.UyF6P7j2b7tdRanWWj6T58haubt2IYiLhmx6xnwYXpE"
      }
    })
    .then(res => res.json())
    .then(dados => {
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
    });
  });
});
