/**
 * Validates the HoneyMoney server address typed on first launch.
 * https is required, except for local development (localhost / 127.0.0.1).
 */
export type ServerUrlResult = { ok: true; origin: string } | { ok: false; error: string };

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function normalizeServerUrl(input: string): ServerUrlResult {
  let raw = input.trim();
  if (!raw) return { ok: false, error: "Digite o endereço do servidor." };
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: "Endereço inválido." };
  }
  if (url.username || url.password) return { ok: false, error: "O endereço não pode conter usuário ou senha." };
  const local = LOCAL_HOSTS.has(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    return { ok: false, error: "Use um endereço https:// (http só é aceito para localhost)." };
  }
  return { ok: true, origin: url.origin };
}

/** Navigation inside the app window is limited to the configured server. */
export function isSameOrigin(target: string, origin: string): boolean {
  try {
    return new URL(target).origin === origin;
  } catch {
    return false;
  }
}

/** Links that leave the server open in the system browser, but only for web URLs. */
export function isExternalWebUrl(target: string): boolean {
  try {
    const { protocol } = new URL(target);
    return protocol === "https:" || protocol === "http:" || protocol === "mailto:";
  } catch {
    return false;
  }
}
