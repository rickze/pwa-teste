document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById("login-screen");
  const alterarPwScreen = document.getElementById("alterar-password-screen");
  const app = document.getElementById("app");

  const loginBtn = document.getElementById("login-btn");
  const guardarNovaPwBtn = document.getElementById("guardar-nova-password");

  let utilizadorAtual = null;

  loginBtn.addEventListener("click", () => {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();
    
    fetch(`${supabaseUrl}/rest/v1/utilizadores?user=eq.${encodeURIComponent(username)}&select=*`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    })
    .then(res => res.json())
    .then(users => {
      console.log("Utilizadores encontrados:", users);
      console.log("Password digitada:", password);
    
      if (!users.length) {
        alert("Utilizador não encontrado.");
        return;
      }
    
      const user = users[0];
    
      if (user.pass !== password) {
        alert("Password incorreta.");
        return;
      }
    
      // OK: login válido
      localStorage.setItem("utilizador", user.user);
    
      if (user.primeiro_login) {
        // Mostrar alteração de password
      } else {
        // Mostrar app
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

    fetch("https://nyscrldksholckwexdsc.supabase.co/rest/v1/utilizadores?id=eq." + encodeURIComponent(utilizadorAtual.id), {
      method: "PATCH",
      headers: {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTQ3MDMsImV4cCI6MjA2MzkzMDcwM30.UyF6P7j2b7tdRanWWj6T58haubt2IYiLhmx6xnwYXpE",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTQ3MDMsImV4cCI6MjA2MzkzMDcwM30.UyF6P7j2b7tdRanWWj6T58haubt2IYiLhmx6xnwYXpE",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pass: novaPw,
        primeiro_login: false
      })
    })
    .then(res => {
      if (!res.ok) throw new Error("Erro ao atualizar password.");
      localStorage.setItem("utilizador", utilizadorAtual.user);
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
    const btnQr = document.getElementById("btn-qr");
    btnQr.disabled = false;
  }
});
