import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The app is a thin shell: a local setup screen (www/) that remembers the HoneyMoney server
 * address and then opens it. Set HONEYMONEY_SERVER_URL when building to lock the app to one
 * server (e.g. an official instance); otherwise any server the user types can be opened.
 */
const preset = process.env.HONEYMONEY_SERVER_URL?.trim();
const presetHost = preset ? new URL(preset).hostname : null;

const config: CapacitorConfig = {
  appId: "app.honeymoney.mobile",
  appName: "HoneyMoney",
  webDir: "www",
  backgroundColor: "#fffdf7",
  server: {
    androidScheme: "https",
    allowNavigation: presetHost ? [presetHost] : ["*"],
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
