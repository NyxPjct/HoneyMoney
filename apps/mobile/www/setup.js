// @ts-check
import { normalizeServerUrl } from "./server-url.js";

const KEY = "hm-server";

/** @returns {string | null} */
function readSaved() {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** @param {string} value */
function save(value) {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // Without storage the user simply types the address again next time.
  }
}

/** @param {string} origin */
function open(origin) {
  window.location.replace(`${origin}/app`);
}

const params = new URLSearchParams(window.location.search);
const changing = params.has("change");
const preset = /** @type {any} */ (window).HONEYMONEY_PRESET_SERVER || "";
const saved = readSaved() || preset;
const parsedSaved = saved ? normalizeServerUrl(saved) : null;

if (!changing && parsedSaved && parsedSaved.ok) {
  open(parsedSaved.origin);
} else {
  const form = /** @type {HTMLFormElement} */ (document.getElementById("form"));
  const input = /** @type {HTMLInputElement} */ (document.getElementById("server"));
  const errorBox = /** @type {HTMLElement} */ (document.getElementById("error"));
  document.body.classList.add("ready");
  if (saved) input.value = saved;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = normalizeServerUrl(input.value);
    if (!result.ok) {
      errorBox.textContent = result.error;
      errorBox.hidden = false;
      return;
    }
    save(result.origin);
    open(result.origin);
  });
}
