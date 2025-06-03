// login_supabase.js (com hashing SHA-256 integrado)
import { SUPABASE_URL, SUPABASE_KEY, SUPABASE_AUT } from './config.js';
document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById("login-screen");
  const alterarPwScreen = document.getElementById("alterar-password-screen");
  const app = document.getElementById("app");

  const loginBtn = document.getElementById("login-btn");
  const guardarNovaPwBtn = document.getElementById("guardar-nova-password");
 
  let utilizadorAtual = null;

  loginBtn.addEventListener("click", async () => {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const hashed = await hashPassword(password);

    fetch(`${SUPABASE_URL}/rest/v1/utilizadores?user=ilike.${encodeURIComponent(username)}&select=*`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": SUPABASE_AUT
      }
    })
    .then(res => res.json())
    .then(async users => {
      if (!users.length) {
        alert("Utilizador não encontrado.");
        return;
      }

      const user = users[0];

      if (user.pass !== hashed) {
        alert("Password incorreta.");
        return;
      }

      localStorage.setItem("utilizador", user.user);
      utilizadorAtual = user;

      if (user.primeiro_login) {
        loginScreen.style.display = "none";
        alterarPwScreen.style.display = "block";
      } else {
         location.reload(); // Força o carregamento completo da app com os dados
      }
    });
  });

  guardarNovaPwBtn.addEventListener("click", async () => {
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

    const novaHash = await hashPassword(novaPw);

    fetch(`${SUPABASE_URL}/rest/v1/utilizadores?user=eq.${encodeURIComponent(utilizadorAtual.user)}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": SUPABASE_AUT,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pass: novaHash,
        primeiro_login: false
      })
    })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao atualizar password.");
      alert("Palavra-passe atualizada.");
      alterarPwScreen.style.display = "none";
      mostrarApp(utilizadorAtual.user);
    })
    .catch(err => {
      console.error(err);
      alert("Não foi possível guardar a nova palavra-passe.");
    });
  });

  function mostrarApp(username) {
    loginScreen.style.display = "none";
    alterarPwScreen.style.display = "none";
    app.style.display = "block";
    document.getElementById("utilizador-logado").innerText = `Utilizador: ${username}`;
    document.getElementById("btn-qr").disabled = false;
  }

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }
});