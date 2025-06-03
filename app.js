import { guardarLocal, initIndexedDB } from './sync.js';
import { SUPABASE_URL, SUPABASE_KEY, SUPABASE_AUT } from './config.js';
document.addEventListener('DOMContentLoaded', () => {
  //const SUPABASE_URL = "https://nyscrldksholckwexdsc.supabase.co";
  //const SUPABASE_AUT = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM1NDcwMywiZXhwIjoyMDYzOTMwNzAzfQ.nd9SNwTR8v-jkkEy3uCobiBF0srzo2_ndv71PG7qL5M";
  //const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTQ3MDMsImV4cCI6MjA2MzkzMDcwM30.UyF6P7j2b7tdRanWWj6T58haubt2IYiLhmx6xnwYXpE";

  const utilizadorAtual = localStorage.getItem("utilizador");
  const empresaAtual = localStorage.getItem("empresa");
  
  //import { guardarLocal, initIndexedDB } from "./sync.js";
  //import { guardarLocal, initIndexedDB } from "./sync.js";
	
  if (!utilizadorAtual) {
    document.getElementById("login-screen").style.display = "block";
    return;
  }
	
  mostrarApp(utilizadorAtual, empresaAtual);

  function mostrarApp(username, empresaGuardada) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app").style.display = "block";
    document.getElementById("utilizador-logado").innerText = `Utilizador: ${username}`;

    const btnQr = document.getElementById("btn-qr");
    const btnExportar = document.getElementById("btn-exportar");
    const lista = document.getElementById("lista-dados");
    const empresaInput = document.getElementById("empresa-select"); // agora é input
    const empresasDatalist = document.getElementById("empresas-list");

    let html5QrCode;
    let empresaAtual = empresaGuardada || "";
    let empresasArray = [];

    btnQr.disabled = false;
    btnExportar.disabled = true;

    initIndexedDB();

    // Carregar empresas
    fetch(`${SUPABASE_URL}/rest/v1/empresas?select=empresa,nome_empresa`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: SUPABASE_AUT
      }
    })
    .then(res => res.json())
    .then(empresas => {
      empresas.sort((a, b) => a.nome_empresa.localeCompare(b.nome_empresa));
      empresasArray = empresas;
      empresasDatalist.innerHTML = "";
      empresas.forEach(e => {
        const option = document.createElement("option");
        option.value = e.nome_empresa;
        empresasDatalist.appendChild(option);
      });
      if (empresaAtual) empresaInput.value = empresas.find(e => e.empresa === empresaAtual)?.nome_empresa || "";
    });

    empresaInput.addEventListener("change", (e) => {
      // Procurar o código da empresa pelo nome
      const empresaObj = empresasArray.find(emp => emp.nome_empresa === e.target.value);
      empresaAtual = empresaObj ? empresaObj.empresa : "";
      localStorage.setItem("empresa", empresaAtual);
    });

    btnQr.addEventListener("click", () => {
      const qrContainer = document.getElementById("leitor-qr");

      // Mostra feedback visual ao iniciar/parar leitura
      btnQr.disabled = true;
      btnQr.textContent = html5QrCode ? "A parar..." : "A iniciar...";

      if (html5QrCode) {
        html5QrCode.stop().then(() => {
          qrContainer.innerHTML = "";
          html5QrCode = null;
          btnQr.textContent = "Ler QR Code";
          btnQr.disabled = false;
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
            btnQr.disabled = false;
            guardarDado(decodedText);
          });
        }
      ).then(() => {
        btnQr.textContent = "Parar Leitura";
        btnQr.disabled = false;
      }).catch(err => {
        console.error("Erro ao iniciar câmara:", err);
        alert("Erro ao iniciar a câmara.");
        html5QrCode = null;
        btnQr.textContent = "Ler QR Code";
        btnQr.disabled = false;
      });
    });

    document.getElementById("btn-logout").addEventListener("click", () => {
      if (confirm("Deseja terminar sessão?")) {
        localStorage.removeItem("utilizador");
        localStorage.removeItem("empresa");
        location.reload();
      }
    });
		function guardarDado(decodedText) {
			if (!utilizadorAtual) {
				alert("Utilizador não definido.");
				return;
			}

			const partes = decodedText.replace(/^\[QR\]\s*/i, "").split("|").map(p => p.trim());

			if (partes.length !== 4) {
				alert("Formato inválido. Esperado: Nº | Descrição | Tipo | Empresa");
				return;
			}

			if (!empresaAtual) {
				alert("Por favor, selecione uma empresa.");
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

			// ✅ Verifica ligação antes de tentar guardar no Supabase
			if (!navigator.onLine) {
				guardarLocal(dado); // Esta função vem de sync.js
				alert("Sem ligação. Dado guardado localmente.");
				return;
			}

			// Caso contrário, segue com verificação e gravação normal
			fetch(`${SUPABASE_URL}/rest/v1/dados?numero=eq.${encodeURIComponent(dado.numero)}&utilizador=eq.${encodeURIComponent(dado.utilizador)}`, {
				headers: {
					apikey: SUPABASE_KEY,
					Authorization: SUPABASE_AUT
				}
			})
			.then(res => res.json())
			.then(registos => {
				if (registos.length > 0) {
					alert(`O número "${dado.numero}" já existe para este utilizador.`);
					return;
				}

        fetch(`${SUPABASE_URL}/rest/v1/dados`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: SUPABASE_AUT,
            "Content-Type": "application/json",
            Prefer: "return=representation"
          },
          body: JSON.stringify(dado)
        })
        .then(res => res.json())
        .then(() => atualizarLista())
        .catch(err => {
          console.error("Erro ao guardar:", err);
          alert("Erro ao guardar o registo.");
        });
      });
		}
		
    function atualizarLista() {
      const btnEliminarSelecionados = document.getElementById("btn-eliminar-selecionados");
      lista.innerHTML = "";

      const tabela = document.createElement("table");
      tabela.className = "tabela-dados";
      tabela.innerHTML = `
        <thead>
          <tr>
            <th><input 
              type="checkbox" 
              id="check-todos" 
              name="check-todos" 
              aria-label="Selecionar todos"></th>
            <th>Número</th>
            <th>Descrição</th>
            <th>Tipo</th>
            <th>Empresa</th>
            <th>Utilizador</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      btnEliminarSelecionados.disabled = true; // Inicialmente desativado

      fetch(`${SUPABASE_URL}/rest/v1/dados?utilizador=eq.${encodeURIComponent(username)}`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: SUPABASE_AUT
        }
      })
      .then(res => res.json())
      .then(dados => {
        if (!dados.length) {
          btnExportar.disabled = true;
          lista.appendChild(tabela);
          return;
        }

        dados = dados.filter(item => item.timestamp && !isNaN(new Date(item.timestamp)));
        dados.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        btnExportar.disabled = false;
        const tbody = tabela.querySelector("tbody");
        dados.forEach(item => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>
              <input 
                type="checkbox" 
                name="check-registo"
                id="check-registo-${item.id}"
                class="check-registo" 
                data-id="${item.id}" aria-label="Selecionar registo">
            </td>
            <td>${item.numero}</td>
            <td>${item.descricao}</td>
            <td>${item.tipo}</td>
            <td>${item.empresa}</td>
            <td>${item.utilizador}</td>
            <td>${new Date(item.timestamp).toLocaleString()}</td>
          `;
          tbody.appendChild(tr);
        });
        lista.appendChild(tabela);

        // Só aqui, depois de criar os checkboxes, regista os listeners:
        function atualizarEstadoBotaoEliminar() {
          const algumSelecionado = tabela.querySelectorAll(".check-registo:checked").length > 0;
          btnEliminarSelecionados.disabled = !algumSelecionado;
        }

        tabela.querySelectorAll(".check-registo").forEach(cb => {
          cb.addEventListener("change", atualizarEstadoBotaoEliminar);
        });

        const checkTodos = tabela.querySelector("#check-todos");
        checkTodos.addEventListener("change", function() {
          tabela.querySelectorAll(".check-registo").forEach(cb => cb.checked = this.checked);
          atualizarEstadoBotaoEliminar();
        });
      });
    }

    atualizarLista();

    btnExportar.addEventListener("click", () => {
      const statusDiv = document.getElementById("status");
      statusDiv.textContent = "A exportar dados...";
      fetch(`${SUPABASE_URL}/rest/v1/dados?utilizador=eq.${encodeURIComponent(username)}`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: SUPABASE_AUT
        }
      })
      .then(res => res.json())
      .then(dados => {
        if (!dados.length) {
          statusDiv.textContent = "";
          alert("Sem dados para exportar.");
          return;
        }

        const linhas = [["numero", "descricao", "tipo", "empresa", "utilizador", "timestamp"].join(";")];
        dados.forEach(item => {
          linhas.push([
            item.numero, item.descricao, item.tipo, item.empresa, item.utilizador, item.timestamp
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

        statusDiv.textContent = "Exportação concluída!";
        setTimeout(() => statusDiv.textContent = "", 2000);
      })
      .catch(() => {
        statusDiv.textContent = "";
        alert("Erro ao exportar dados.");
      });
    });

    document.getElementById("btn-eliminar-selecionados").addEventListener("click", () => {
      const tabela = document.querySelector("#lista-dados table");
      if (!tabela) return;
      const selecionados = Array.from(tabela.querySelectorAll(".check-registo:checked"));
      if (!selecionados.length) {
        alert("Selecione pelo menos um registo para eliminar.");
        return;
      }
      if (!confirm(`Eliminar ${selecionados.length} registo(s)?`)) return;

      const statusDiv = document.getElementById("status");
      statusDiv.textContent = "A eliminar registos...";

      Promise.all(selecionados.map(cb =>
        fetch(`${SUPABASE_URL}/rest/v1/dados?id=eq.${cb.dataset.id}`, {
          method: "DELETE",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: SUPABASE_AUT
          }
        })
      )).then(() => {
        statusDiv.textContent = "Registos eliminados!";
        setTimeout(() => statusDiv.textContent = "", 2000);
        atualizarLista();
      }).catch(() => {
        statusDiv.textContent = "";
        alert("Erro ao eliminar registos.");
      });
    });

  }
});