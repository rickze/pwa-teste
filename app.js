document.addEventListener('DOMContentLoaded', () => {
  const SUPABASE_AUT = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM1NDcwMywiZXhwIjoyMDYzOTMwNzAzfQ.nd9SNwTR8v-jkkEy3uCobiBF0srzo2_ndv71PG7qL5M";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTQ3MDMsImV4cCI6MjA2MzkzMDcwM30.UyF6P7j2b7tdRanWWj6T58haubt2IYiLhmx6xnwYXpE";

  const usernameGuardado = localStorage.getItem("utilizador");
  const empresaGuardada = localStorage.getItem("empresa");

  if (usernameGuardado) {
    // só agora que o DOM está pronto, chamamos mostrarApp
    mostrarApp(usernameGuardado, empresaGuardada);
  } else {
    // mostra o login
    document.getElementById("login-screen").style.display = "block";
  }

  mostrarApp(usernameGuardado, empresaGuardada);

  function mostrarApp(utilizadorAtual, empresaInicial) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app").style.display = "block";
    document.getElementById("utilizador-logado").innerText = `Utilizador: ${utilizadorAtual}`;

    const btnQr = document.getElementById("btn-qr");
    const btnExportar = document.getElementById("btn-exportar");
    const lista = document.getElementById("lista-dados");
    const empresaSelect = document.getElementById("empresa-select");
    let html5QrCode;
    let empresaAtual = empresaInicial || "";

    // Preencher dropdown de empresas
    fetch("https://nyscrldksholckwexdsc.supabase.co/rest/v1/empresas?select=empresa,nome_empresa", {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": SUPABASE_AUT
      }
    })
    .then(res => res.json())
    .then(empresas => {
      empresaSelect.innerHTML = '<option value="">-- Selecione a empresa --</option>';
      empresas.forEach(e => {
        const option = document.createElement("option");
        option.value = e.empresa;
        option.textContent = e.nome_empresa;
        empresaSelect.appendChild(option);
      });

      if (empresaAtual) {
        empresaSelect.value = empresaAtual;
      }

      empresaSelect.addEventListener("change", (e) => {
        empresaAtual = e.target.value;
        localStorage.setItem("empresa", empresaAtual);
      });
    });

    btnQr.disabled = !utilizadorAtual;
    btnExportar.disabled = true;

    // Carregar lista inicial
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
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
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

    document.getElementById("btn-logout").addEventListener("click", () => {
      if (confirm("Deseja terminar sessão?")) {
        localStorage.removeItem("utilizador");
        localStorage.removeItem("empresa");
        location.reload();
      }
    });

    function guardarDado(valor) {
      if (!utilizadorAtual || !empresaAtual) {
        alert("Utilizador ou empresa não definidos.");
        return;
      }

      const partes = valor.replace(/^\[QR\]\s*/i, "").split("|").map(p => p.trim());
      if (partes.length !== 4) {
        alert("Formato inválido. Esperado: Nº | Descrição | Tipo | Empresa");
        return;
      }
      if (partes[3] !== empresaAtual) {
        alert(`O QR code pertence à empresa "${partes[3]}", mas selecionaste "${empresaAtual}".`);
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

      fetch(`https://nyscrldksholckwexdsc.supabase.co/rest/v1/dados?numero=eq.${encodeURIComponent(dado.numero)}&utilizador=eq.${encodeURIComponent(dado.utilizador)}`, {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": SUPABASE_AUT
        }
      })
      .then(res => res.json())
      .then(registos => {
        if (registos.length > 0) {
          alert(`O número "${dado.numero}" já existe para este utilizador.`);
          return;
        }

        fetch("https://nyscrldksholckwexdsc.supabase.co/rest/v1/dados", {
          method: "POST",
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": SUPABASE_AUT,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify(dado)
        })
        .then(() => atualizarLista())
        .catch(err => {
          console.error("Erro ao guardar:", err);
          alert("Erro ao guardar o registo.");
        });
      });
    }

    function atualizarLista() {
      lista.innerHTML = "";

      fetch("https://nyscrldksholckwexdsc.supabase.co/rest/v1/dados?utilizador=eq." + encodeURIComponent(utilizadorAtual), {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": SUPABASE_AUT
        }
      })
      .then(res => res.json())
      .then(dados => {
        if (!dados.length) {
          btnExportar.disabled = true;
          return;
        }

        btnExportar.disabled = false;
        dados.forEach((item, i) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <strong>${i + 1}</strong><br />
            Nº: ${item.numero}<br />
            Desc: ${item.descricao}<br />
            Tipo: ${item.tipo}<br />
            Empresa: ${item.empresa}<br />
            Utilizador: ${item.utilizador || "-"}<br />
            <button data-id="${item.id}" class="btn-eliminar">🗑️ Eliminar</button>
            <hr />
          `;
          lista.appendChild(li);
        });
      });
    }

    btnExportar.addEventListener("click", () => {
      fetch("https://nyscrldksholckwexdsc.supabase.co/rest/v1/dados?utilizador=eq." + encodeURIComponent(utilizadorAtual), {
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": SUPABASE_AUT
        }
      })
      .then(res => res.json())
      .then(dados => {
        if (!dados.length) {
          alert("Não existem dados para exportar.");
          return;
        }

        const linhas = [["numero", "descricao", "tipo", "empresa", "utilizador", "timestamp"].join(";")];
        dados.forEach(item => {
          linhas.push([
            item.numero || "",
            item.descricao || "",
            item.tipo || "",
            item.empresa || "",
            item.utilizador || "-",
            item.timestamp || ""
          ].join(";"));
        });

        const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "registos_qr.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    });

    document.addEventListener("click", (event) => {
      if (event.target.classList.contains("btn-eliminar")) {
        const id = event.target.getAttribute("data-id");
        if (confirm("Eliminar este registo?")) {
          fetch(`https://nyscrldksholckwexdsc.supabase.co/rest/v1/dados?id=eq.${id}`, {
            method: "DELETE",
            headers: {
              "apikey": SUPABASE_KEY,
              "Authorization": SUPABASE_AUT
            }
          })
          .then(() => atualizarLista())
          .catch(err => {
            console.error("Erro ao eliminar:", err);
            alert("Erro ao eliminar o registo.");
          });
        }
      }
    });
  }
});
