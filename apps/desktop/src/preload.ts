import { contextBridge, ipcRenderer } from "electron";

// Exposed only to the bundled setup screen (file://). Remote pages get nothing.
if (window.location.protocol === "file:") {
  contextBridge.exposeInMainWorld("honeymoney", {
    getServer: (): Promise<string | null> => ipcRenderer.invoke("honeymoney:get-server"),
    setServer: (url: string): Promise<{ ok: boolean; error?: string }> => ipcRenderer.invoke("honeymoney:set-server", url),
  });
}
