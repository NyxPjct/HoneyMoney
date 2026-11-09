import { app, BrowserWindow, ipcMain, Menu, type MenuItemConstructorOptions, shell } from "electron";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { isExternalWebUrl, isSameOrigin, normalizeServerUrl } from "./server-url";

type Config = { server?: string };

const SETUP_FILE = join(__dirname, "..", "setup", "index.html");
const SETUP_URL = pathToFileURL(SETUP_FILE).toString();
const configPath = () => join(app.getPath("userData"), "config.json");

function readConfig(): Config {
  try {
    return JSON.parse(readFileSync(configPath(), "utf8")) as Config;
  } catch {
    return {};
  }
}

function writeConfig(config: Config): void {
  const file = configPath();
  if (!existsSync(dirname(file))) mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(config, null, 2));
}

/** A server can also be preset at build/launch time (e.g. an official instance). */
function configuredServer(): string | null {
  const fromEnv = process.env.HONEYMONEY_SERVER_URL;
  const candidate = readConfig().server ?? fromEnv;
  if (!candidate) return null;
  const parsed = normalizeServerUrl(candidate);
  return parsed.ok ? parsed.origin : null;
}

let win: BrowserWindow | null = null;

function showSetup(error?: string): void {
  if (!win) return;
  void win.loadFile(SETUP_FILE, error ? { query: { error } } : undefined);
}

function openServer(origin: string): void {
  if (!win) return;
  void win.loadURL(`${origin}/app`);
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 380,
    minHeight: 600,
    title: "HoneyMoney",
    backgroundColor: "#fffdf7",
    autoHideMenuBar: process.platform !== "darwin",
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: true,
    },
  });

  const contents = win.webContents;

  // Only the configured server (and the local setup screen) may load in the window.
  contents.on("will-navigate", (event, target) => {
    const server = configuredServer();
    if (target.startsWith("file:") && target.split("?")[0] === SETUP_URL) return;
    if (server && isSameOrigin(target, server)) return;
    event.preventDefault();
    if (isExternalWebUrl(target)) void shell.openExternal(target);
  });

  // New windows (target=_blank, published pages, docs) open in the system browser.
  contents.setWindowOpenHandler(({ url }) => {
    if (isExternalWebUrl(url)) void shell.openExternal(url);
    return { action: "deny" };
  });

  contents.on("did-fail-load", (_event, code, description, url, isMainFrame) => {
    if (!isMainFrame || code === -3 /* aborted by a redirect */) return;
    if (url.startsWith("file:")) return;
    showSetup(`Não foi possível abrir ${new URL(url).host} (${description}). Confira o endereço e a conexão.`);
  });

  const server = configuredServer();
  if (server) openServer(server);
  else showSetup();
}

function buildMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    ...(process.platform === "darwin" ? [{ role: "appMenu" as const }] : []),
    {
      label: "HoneyMoney",
      submenu: [
        {
          label: "Trocar servidor…",
          click: () => {
            writeConfig({});
            showSetup();
          },
        },
        {
          label: "Abrir no navegador",
          click: () => {
            const server = configuredServer();
            if (server) void shell.openExternal(`${server}/app`);
          },
        },
        { type: "separator" },
        { role: "reload", label: "Recarregar" },
        ...(app.isPackaged ? [] : [{ role: "toggleDevTools" as const }]),
        { type: "separator" },
        { role: "quit", label: "Sair" },
      ],
    },
    { role: "editMenu", label: "Editar" },
    { role: "viewMenu", label: "Exibir" },
    { role: "windowMenu", label: "Janela" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// IPC is only accepted from the local setup screen, never from remote pages.
function fromSetup(frameUrl: string | undefined): boolean {
  return !!frameUrl && frameUrl.split("?")[0] === SETUP_URL;
}

ipcMain.handle("honeymoney:get-server", (event) => {
  if (!fromSetup(event.senderFrame?.url)) return null;
  return readConfig().server ?? process.env.HONEYMONEY_SERVER_URL ?? "";
});

ipcMain.handle("honeymoney:set-server", (event, input: unknown) => {
  if (!fromSetup(event.senderFrame?.url)) return { ok: false, error: "Não permitido." };
  const parsed = normalizeServerUrl(typeof input === "string" ? input : "");
  if (!parsed.ok) return parsed;
  writeConfig({ server: parsed.origin });
  openServer(parsed.origin);
  return parsed;
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  void app.whenReady().then(() => {
    buildMenu();
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
