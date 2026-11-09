// Ad-hoc signs the macOS app. Without any signature, Apple Silicon refuses to open it.
// This is not a Developer ID signature: Gatekeeper still warns on first open (see docs/desktop-mobile.md).
const { execFileSync } = require("node:child_process");
const { join } = require("node:path");

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") return;
  const app = join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", app], { stdio: "inherit" });
};
