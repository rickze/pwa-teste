
export function getUtilizador() {
  const utilizador = localStorage.getItem("utilizador");
  return utilizador ? JSON.parse(utilizador) : null;
}
export function getEmpresa() {  
  const empresa = localStorage.getItem("empresa");
  return empresa ? JSON.parse(empresa) : null;
}
export function setUtilizador(utilizador) {
  if (utilizador) {
    localStorage.setItem("utilizador", JSON.stringify(utilizador));
  } else {
    localStorage.removeItem("utilizador");
  }
}
export function setEmpresa(empresa) {
  if (empresa) {
    localStorage.setItem("empresa", JSON.stringify(empresa));
  } else {
    localStorage.removeItem("empresa");
  }
}
// shared.js
export function isLoggedIn() {
  return !!getUtilizador();
}
export function isEmpresaSet() {
  return !!getEmpresa();
}
export function getApiKey() {
  const empresa = getEmpresa();
  return empresa ? empresa.apikey : null;
}
export function getAuthHeader() {
  const empresa = getEmpresa();
  return empresa ? `Bearer ${empresa.autorizacao}` : null;
}
export function getHeaders() {
  const apiKey = getApiKey();
  const authHeader = getAuthHeader();
  return {
    "apikey": apiKey,
    "Authorization": authHeader,
    "Content-Type": "application/json"
  };
}
export function getSupabaseUrl() {
  const empresa = getEmpresa();
  return empresa ? empresa.supabase_url : null;
}
export function getSupabaseKey() {
  const empresa = getEmpresa();
  return empresa ? empresa.supabase_key : null;
}
// shared.js
export function getSupabaseHeaders() {
  const apiKey = getSupabaseKey();
  const authHeader = getAuthHeader(); 
  return {
    "apikey": apiKey,
    "Authorization": authHeader,
    "Content-Type": "application/json"
  };

}
// shared.js
export function getSupabaseUrlWithPath(path) {
  const url = getSupabaseUrl();
  return url ? `${url}${path}` : null;
}
// shared.js
export function getSupabaseUrlWithTable(table) {
  const url = getSupabaseUrl();
  return url ? `${url}/rest/v1/${table}` : null;
}
// shared.js
export function getSupabaseUrlWithTableAndId(table, id) {
  const url = getSupabaseUrlWithTable(table);
  return url ? `${url}?id=eq.${id}` : null;
}
// shared.js
export function getSupabaseUrlWithTableAndUser(table, user) {
  const url = getSupabaseUrlWithTable(table);
  return url ? `${url}?user=eq.${encodeURIComponent(user)}` : null;
}
// shared.js
export function getSupabaseUrlWithTableAndUserLike(table, user) {
  const url = getSupabaseUrlWithTable(table);
  return url ? `${url}?user=ilike.${encodeURIComponent(user)}` : null;
}
// shared.js
export function getSupabaseUrlWithTableAndUserLikeSelect(table, user, select) {
  const url = getSupabaseUrlWithTableAndUserLike(table, user);
  return url ? `${url}&select=${encodeURIComponent(select)}` : null;
} 
// shared.js
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export function logout() {
  localStorage.removeItem("utilizador");
  localStorage.removeItem("empresa");
  location.reload();
}
