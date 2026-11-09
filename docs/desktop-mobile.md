# Desktop and mobile apps

HoneyMoney is a web app: the agents, the database and your AI keys live on a server. Every client below opens that server.

| Client | How | Where the code is |
| --- | --- | --- |
| PWA (any modern browser, desktop and mobile) | "Install app" in Chrome/Edge, or Safari → Share → *Add to Home Screen* | `apps/web/src/app/manifest.ts`, `apps/web/public/sw.js` |
| Windows, macOS, Linux | Installers from GitHub Releases | `apps/desktop` (Electron) |
| Android | APK from GitHub Releases | `apps/mobile` (Capacitor) |
| iOS | PWA only for now (an App Store build needs an Apple Developer account) | — |

## Security model of the native apps

- They contain no business logic and no secrets: a local setup screen asks for the server address (https only, except `localhost` / emulator addresses for testing) and then loads `<server>/app`.
- **Desktop:** context isolation, sandbox and no Node integration. Navigation is limited to the configured server; any other link opens in the system browser. The bridge used by the setup screen is only exposed to the local `file://` page, and the main process rejects calls from anything else.
- **Android:** the local setup screen stores the address and opens the server in the app's WebView. Mixed content and WebView debugging are disabled. Build with `HONEYMONEY_SERVER_URL` to lock the app to a single server host.
- The service worker never caches private pages or API responses; only static assets and an offline screen.

Google sign-in is blocked by Google inside embedded browsers, so use e-mail and password in the desktop and Android apps.

## Building locally

Desktop (installs for the current OS into `apps/desktop/release/`):

```bash
pnpm desktop:dist
```

Run it in development against a local server:

```bash
pnpm desktop
```

Android (needs JDK 21 and the Android SDK):

```bash
pnpm mobile:sync
```

```bash
cd apps/mobile/android && ./gradlew assembleDebug
```

To ship the Android app pointing at one server, set `HONEYMONEY_SERVER_URL` before `pnpm mobile:sync` and put the same address in `apps/mobile/www/preset.js`.

## Releases

`.github/workflows/release.yml` builds Windows, macOS (Intel and Apple Silicon) and Linux installers plus the Android APK, and publishes a GitHub Release with `docs/releases/<tag>.md` as the description. It runs:

- when a commit on `main` carries a version (root `package.json`) that has no tag yet: the release creates the `v<version>` tag;
- when a `v*` tag is pushed.

To cut a release: bump the version in the root `package.json`, `apps/desktop/package.json`, `apps/mobile/package.json` and `apps/mobile/android/app/build.gradle` (`versionName` and `versionCode`), add `docs/releases/v<version>.md` and a CHANGELOG entry, and merge to `main`.

### Signing (optional)

- **Android:** add the repository secrets `ANDROID_KEYSTORE_BASE64` (base64 of a `.jks` keystore), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD` to get a release-signed APK. Without them, a debug-signed APK is published. Keep the keystore safe: updates must be signed with the same key.
- **Windows and macOS:** installers are not code-signed (that needs paid certificates). macOS builds are ad-hoc signed so they run on Apple Silicon; users confirm the first open.
