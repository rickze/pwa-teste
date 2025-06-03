// ui.js: só manipula DOM, não tem lógica de negócio.

// Mostra o ecrã de login e esconde a app
export function mostrarLogin() {
  document.getElementById("login-screen").style.display = "block";
  document.getElementById("app").style.display = "none";
}

// Mostra a app e esconde o ecrã de login
export function mostrarApp(username) {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app").style.display = "block";
  document.getElementById("utilizador-logado").innerText = `Utilizador: ${username}`;
}

// Atualiza a lista de dados no DOM
export function atualizarLista(lista, dados) {
  lista.innerHTML = "";
  dados.forEach((item, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${i + 1}</strong><br />
      Nº: ${item.numero}<br />
      Desc: ${item.descricao}<br />
      Tipo: ${item.tipo}<br />
      Empresa: ${item.empresa}<br />
      Utilizador: ${item.utilizador}<br />
      <button class="btn-eliminar" data-id="${item.id}" aria-label="Eliminar registo ${item.numero}">🗑️ Eliminar</button>
    `;
    lista.appendChild(li);
  });
}

// Mostra uma mensagem ao utilizador (podes trocar por modal/snackbar)
export function mostrarMensagem(msg) {
  alert(msg);
}

// Mostra uma mensagem de estado (ex: exportação)
export function mostrarStatus(msg) {
  const statusDiv = document.getElementById("status");
  if (statusDiv) {
    statusDiv.textContent = msg;
  }
}

// Limpa a mensagem de estado após X ms
export function limparStatus(delay = 2000) {
  const statusDiv = document.getElementById("status");
  if (statusDiv) {
    setTimeout(() => statusDiv.textContent = "", delay);
  }
}

// Preenche o datalist de empresas
export function preencherEmpresasDatalist(empresas, datalistElement) {
  datalistElement.innerHTML = "";
  empresas.forEach(e => {
    const option = document.createElement("option");
    option.value = e.nome_empresa;
    datalistElement.appendChild(option);
  });
}

// Seleciona o nome da empresa no input, se existir
export function selecionarEmpresaInput(empresaAtual, empresas, empresaInput) {
  if (empresaAtual) {
    empresaInput.value = empresas.find(e => e.empresa === empresaAtual)?.nome_empresa || "";
  }
}