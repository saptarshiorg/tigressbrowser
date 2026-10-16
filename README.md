# MacStyleBrowser

A macOS-styled web browser for Windows, built on Electron/Chromium, with:
- Custom traffic-light window chrome, tabs, address bar (Mac look & feel)
- Native HTTP/HTTPS browsing
- HLS (`.m3u8`) and DASH (`.mpd`) stream playback via injected `hls.js` / `dash.js`
- A **VLC fallback engine**: a bundled VLC binary that opens streams Chromium
  can't natively handle (RTSP, MMS, unusual codecs), launched as a companion
  process — the same approach real desktop browsers use for non-web formats.

This project only plays content you already have rights/keys to access. It does
not defeat DRM or decrypt protected content without authorization.

## 1. Prerequisites (local machine)

- Windows 10/11 (to build the `.exe` with `electron-builder`'s NSIS target)
- [Node.js 20+](https://nodejs.org/)
- Git

## 2. Project setup

```bash
git clone <your-repo-url> mac-style-browser
cd mac-style-browser
npm install
```

## 3. Bundling VLC (for the fallback engine)

The VLC fallback spawns `vlc.exe` as an external process — it does **not**
require compiling libvlc bindings, which keeps the build simple and stable.

1. Download the **Windows .zip (not installer)** build of VLC from the
   official VideoLAN site: https://www.videolan.org/vlc/download-windows.html
2. Extract it, and copy the whole VLC folder contents into:
   ```
   mac-style-browser/vlc-bin/
   ```
   so that `mac-style-browser/vlc-bin/vlc.exe` exists alongside its `plugins/`
   folder and DLLs.
3. This `vlc-bin/` folder is referenced in `package.json` under
   `build.extraResources`, so `electron-builder` packages it into the final
   installer automatically.

> Note: redistributing VLC is permitted — VLC is licensed under GPLv2/LGPL.
> If you publish this app publicly, keep VLC's license file alongside your
> bundled copy (include `vlc-bin/COPYING.txt` from the VLC zip) to comply
> with the license.

## 4. Run in development

```bash
npm start
```

## 5. Build the Windows installer locally

```bash
npm run dist
```

Output `.exe` installer appears in `release/`.

## 6. GitHub repo setup & publishing (CI build)

### a) Create the repo
```bash
cd mac-style-browser
git init
git add .
git commit -m "Initial commit: Mac-style browser with VLC fallback"
gh repo create your-username/mac-style-browser --public --source=. --remote=origin
git push -u origin main
```
(No `gh` CLI? Create the repo manually on github.com, then:)
```bash
git remote add origin https://github.com/your-username/mac-style-browser.git
git branch -M main
git push -u origin main
```

### b) Let GitHub Actions build it for you
The workflow at `.github/workflows/build.yml` builds the Windows installer
automatically on every push. You don't need a Windows machine for this step —
GitHub provides a `windows-latest` runner.

### c) Publish a release
Tag a version and push the tag — this triggers the release job, which builds
the `.exe` and attaches it to a GitHub Release automatically:
```bash
git tag v1.0.0
git push origin v1.0.0
```
Check the **Actions** tab for build progress, then the **Releases** tab for
the published installer once it finishes.

### d) Manual trigger (optional)
You can also run the workflow without tagging, via **Actions → Build and
Release Windows Exe → Run workflow**.

## Notes / next steps you may want

- **App icon**: put a `.ico` file at `build/icon.ico` (referenced in
  `package.json`) for a custom taskbar/installer icon.
- **Auto-update**: add `electron-updater` if you want in-app update checks
  against your GitHub Releases.
- **Code signing**: Windows SmartScreen will warn on unsigned installers.
  For production distribution, get a code-signing certificate and add signing
  steps to the Actions workflow.
