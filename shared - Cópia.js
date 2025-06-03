
import { SUPABASE_URL, SUPABASE_KEY, SUPABASE_AUT } from './config.js';

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
