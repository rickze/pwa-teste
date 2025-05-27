document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById("login-screen");
  const alterarPwScreen = document.getElementById("alterar-password-screen");
  const app = document.getElementById("app");

  const loginBtn = document.getElementById("login-btn");
  const guardarNovaPwBtn = document.getElementById("guardar-nova-password");

  let utilizadores = [];
  let utilizadorAtual = null;

  fetch("users.json")
    .then(res => res.json())
    .then(data => {
      utilizadores = data;

      const usernameGuardado = localStorage.getItem("utilizador");
      if (usernameGuardado) {
        utilizadorAtual = utilizadores.find(u => u.username === usernameGuardado);
        if (utilizadorAtual && !utilizadorAtual.primeiro_login) {
          mostrarApp(utilizadorAtual.username);
        }
      }
    });

  loginBtn.addEventListener("click", () => {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    const user = utilizadores.find(u => u.username === username && u.password === password);

    if (!user) {
      alert("Credenciais inválidas.");
      return;
    }

    utilizadorAtual = user;

    if (user.primeiro_login) {
      loginScreen.style.display = "none";
      alterarPwScreen.style.display = "block";
      document.getElementById("user-display").innerText = `Utilizador: ${user.username}`;
    } else {
      localStorage.setItem("utilizador", user.username);
      mostrarApp(user.username);
    }
  });

  guardarNovaPwBtn.addEventListener("click", () => {
		const novaPw = document.getElementById("nova-password").value.trim();
		const confirmarPw = document.getElementById("confirmar-password").value.trim();

		if (!novaPw || novaPw.length < 4) {
			alert("A nova palavra-passe deve ter pelo menos 4 caracteres.");
			return;
		}

		if (novaPw !== confirmarPw) {
			alert("As palavras-passe não coincidem.");
			return;
		}

		utilizadorAtual.password = novaPw;
		utilizadorAtual.primeiro_login = false;

		// Atualizar lista completa
		const index = utilizadores.findIndex(u => u.username === utilizadorAtual.username);
		if (index !== -1) {
			utilizadores[index] = utilizadorAtual;
			localStorage.setItem("users", JSON.stringify(utilizadores));
		}

		localStorage.setItem("utilizador", utilizadorAtual.username);

		alert("Palavra-passe atualizada.");
		alterarPwScreen.style.display = "none";
		mostrarApp(utilizadorAtual.username);
});


  function mostrarApp(username) {
    loginScreen.style.display = "none";
    alterarPwScreen.style.display = "none";
    app.style.display = "block";

    document.getElementById("utilizador-logado").innerText = `Utilizador: ${username}`;
    // app.js pode agora usar localStorage.getItem("utilizador") para continuar
		// ⚠️ Ativar botão QR após login
		const btnQr = document.getElementById("btn-qr");
		btnQr.disabled = false;
  }
});