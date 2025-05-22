const formulario = document.getElementById('formulario');
const input = document.getElementById('dado');
const lista = document.getElementById('lista-dados');

let dadosGuardados = JSON.parse(localStorage.getItem('dados')) || [];

function atualizarLista() {
  lista.innerHTML = '';
  dadosGuardados.forEach((item, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}: ${item}`;
    lista.appendChild(li);
  });
}

formulario.addEventListener('submit', (e) => {
  e.preventDefault();
  const valor = input.value.trim();
  if (valor) {
    dadosGuardados.push(valor);
    localStorage.setItem('dados', JSON.stringify(dadosGuardados));
    input.value = '';
    atualizarLista();
  }
});

atualizarLista();