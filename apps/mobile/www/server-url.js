// @ts-check
/** Same rules as the desktop app: https required, plain http only for local development. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "10.0.2.2"]);

/**
 * @param {string} input
 * @returns {{ ok: true, origin: string } | { ok: false, error: string }}
 */
export function normalizeServerUrl(input) {
  let raw = String(input || "").trim();
  if (!raw) return { ok: false, error: "Digite o endereço do servidor." };
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;
  /** @type {URL} */
  let url;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: "Endereço inválido." };
  }
  if (url.username || url.password) return { ok: false, error: "O endereço não pode conter usuário ou senha." };
  const local = LOCAL_HOSTS.has(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    return { ok: false, error: "Use um endereço https:// (http só é aceito para testes locais)." };
  }
  // The app's own local origin is not a server.
  if (url.hostname === "localhost" && url.protocol === "https:" && !url.port) {
    return { ok: false, error: "Endereço inválido." };
  }
  return { ok: true, origin: url.origin };
}
