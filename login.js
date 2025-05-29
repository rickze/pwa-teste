// login_supabase.js (com hashing SHA-256 integrado)
document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById("login-screen");
  const alterarPwScreen = document.getElementById("alterar-password-screen");
  const app = document.getElementById("app");

  const loginBtn = document.getElementById("login-btn");
  const guardarNovaPwBtn = document.getElementById("guardar-nova-password");
  const SUPABASE_URL = "https://nyscrldksholckwexdsc.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTQ3MDMsImV4cCI6MjA2MzkzMDcwM30.UyF6P7j2b7tdRanWWj6T58haubt2IYiLhmx6xnwYXpE";


  let utilizadorAtual = null;

  loginBtn.addEventListener("click", async () => {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const hashed = await hashPassword(password);

    console.log("Username a procurar:", username);
    fetch(`${SUPABASE_URL}/rest/v1/utilizadores?user=eq.${encodeURIComponent(username)}&select=*`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
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
        mostrarApp(user.user);
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
        "Authorization": `Bearer ${SUPABASE_KEY}`,
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

// document.addEventListener('DOMContentLoaded', () => {
//   const loginScreen = document.getElementById("login-screen");
//   const alterarPwScreen = document.getElementById("alterar-password-screen");
//   const app = document.getElementById("app");

//   const loginBtn = document.getElementById("login-btn");
//   const guardarNovaPwBtn = document.getElementById("guardar-nova-password");

//   const SUPABASE_AUT = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM1NDcwMywiZXhwIjoyMDYzOTMwNzAzfQ.nd9SNwTR8v-jkkEy3uCobiBF0srzo2_ndv71PG7qL5M";
//   const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55c2NybGRrc2hvbGNrd2V4ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTQ3MDMsImV4cCI6MjA2MzkzMDcwM30.UyF6P7j2b7tdRanWWj6T58haubt2IYiLhmx6xnwYXpE";

//   let utilizadorAtual = null;

//   loginBtn.addEventListener("click", () => {
//     const username = document.getElementById("login-username").value.trim();
//     const password = document.getElementById("login-password").value.trim();
  
//     fetch("https://nyscrldksholckwexdsc.supabase.co/rest/v1/utilizadores?user=eq." + encodeURIComponent(username) + "&select=*", {
//       headers: {
//         "apikey": SUPABASE_KEY,
//         "Authorization": SUPABASE_AUT
//       }
//     })
//     .then(res => res.json())
//     .then(users => {
//       console.log("Utilizadores encontrados:", users);
//       console.log("Password digitada:", password);
  
//       if (!users.length) {
//         alert("Utilizador não encontrado.");
//         return;
//       }
  
//       const user = users[0];
  
//       if (user.pass !== password) {
//         alert("Password incorreta.");
//         return;
//       }
  
//       // OK: login válido
//       utilizadorAtual = user;
//       localStorage.setItem("utilizador", user.user);
  
//       if (user.primeiro_login) {
//         loginScreen.style.display = "none";
//         alterarPwScreen.style.display = "block";
//         document.getElementById("user-display").innerText = `Utilizador: ${user.user}`;
//       } else {
//         mostrarApp(user.user);
//       }
//     });
//   });


//   guardarNovaPwBtn.addEventListener("click", () => {
//     const novaPw = document.getElementById("nova-password").value.trim();
//     const confirmarPw = document.getElementById("confirmar-password").value.trim();

//     if (!novaPw || novaPw.length < 4) {
//       alert("A nova palavra-passe deve ter pelo menos 4 caracteres.");
//       return;
//     }

//     if (novaPw !== confirmarPw) {
//       alert("As palavras-passe não coincidem.");
//       return;
//     }

//     fetch("https://nyscrldksholckwexdsc.supabase.co/rest/v1/utilizadores?id=eq." + encodeURIComponent(utilizadorAtual.id), {
//       method: "PATCH",
//       headers: {
//         "apikey": SUPABASE_KEY,
//         "Authorization": SUPABASE_AUT,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         pass: novaPw,
//         primeiro_login: false
//       })
//     })
//     .then(res => {
//       if (!res.ok) throw new Error("Erro ao atualizar password.");
//       localStorage.setItem("utilizador", utilizadorAtual.user);
//       alert("Palavra-passe atualizada.");
//       alterarPwScreen.style.display = "none";
//       mostrarApp(utilizadorAtual.user);
//     })
//     .catch(err => {
//       console.error(err);
//       alert("Não foi possível guardar a nova palavra-passe.");
//     });
//   });

//   function mostrarApp(username) {
//     loginScreen.style.display = "none";
//     alterarPwScreen.style.display = "none";
//     app.style.display = "block";
  
//     document.getElementById("utilizador-logado").innerText = `Utilizador: ${username}`;
  
//     const btnQr = document.getElementById("btn-qr");
//     btnQr.disabled = false;
  
//     document.getElementById("btn-logout").addEventListener("click", () => {
//       if (confirm("Deseja terminar sessão?")) {
//         localStorage.removeItem("utilizador");
//         location.reload();
//       }
//     });
//   }
// });
