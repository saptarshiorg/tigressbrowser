// --- Window controls ---
document.getElementById('btn-close').onclick = () => window.browserAPI.close();
document.getElementById('btn-minimize').onclick = () => window.browserAPI.minimize();
document.getElementById('btn-maximize').onclick = () => window.browserAPI.maximize();

// --- Tab + webview management ---
const tabsEl = document.getElementById('tabs');
const viewContainer = document.getElementById('view-container');
const urlInput = document.getElementById('url-input');

let tabs = [];
let activeTabId = null;
let tabCounter = 0;

// Injected into every page so native <video>/<audio> elements that point at
// .m3u8 (HLS) or .mpd (DASH) manifests get proper playback support, matching
// what VLC does for those formats.
const STREAMING_SHIM = `
  (function() {
    if (window.__streamingShimInstalled) return;
    window.__streamingShimInstalled = true;
    function loadScript(src) {
      return new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    async function attach(video) {
      const src = video.currentSrc || video.src || '';
      if (/\\.m3u8($|\\?)/i.test(src) && !video.canPlayType('application/vnd.apple.mpegurl')) {
        await loadScript('https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js');
        if (window.Hls && Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
        }
      } else if (/\\.mpd($|\\?)/i.test(src)) {
        await loadScript('https://cdn.jsdelivr.net/npm/dashjs@4.7.4/dist/dash.all.min.js');
        if (window.dashjs) {
          const player = dashjs.MediaPlayer().create();
          player.initialize(video, src, false);
        }
      }
    }
    document.addEventListener('play', (e) => {
      if (e.target && e.target.tagName === 'VIDEO') attach(e.target);
    }, true);
  })();
`;

function createTab(url = 'https://www.google.com') {
  const id = `tab-${tabCounter++}`;

  const tabBtn = document.createElement('div');
  tabBtn.className = 'tab';
  tabBtn.textContent = 'New Tab';
  tabBtn.dataset.id = id;
  tabBtn.onclick = () => activateTab(id);
  tabsEl.appendChild(tabBtn);

  const webview = document.createElement('webview');
  webview.src = url;
  webview.setAttribute('allowpopups', 'true');
  webview.dataset.id = id;
  viewContainer.appendChild(webview);

  webview.addEventListener('dom-ready', () => {
    webview.executeJavaScript(STREAMING_SHIM).catch(() => {});
  });
  webview.addEventListener('page-title-updated', (e) => {
    tabBtn.textContent = e.title || url;
  });
  webview.addEventListener('did-navigate', (e) => {
    if (id === activeTabId) urlInput.value = e.url;
  });

  tabs.push({ id, tabBtn, webview, url });
  activateTab(id);
  return id;
}

function activateTab(id) {
  activeTabId = id;
  tabs.forEach(t => {
    const isActive = t.id === id;
    t.tabBtn.classList.toggle('active', isActive);
    t.webview.classList.toggle('active', isActive);
    if (isActive) urlInput.value = t.webview.src;
  });
}

function getActiveTab() {
  return tabs.find(t => t.id === activeTabId);
}

document.getElementById('new-tab').onclick = () => createTab();

// --- Navigation ---
document.getElementById('nav-back').onclick = () => getActiveTab()?.webview.goBack();
document.getElementById('nav-forward').onclick = () => getActiveTab()?.webview.goForward();
document.getElementById('nav-reload').onclick = () => getActiveTab()?.webview.reload();

document.getElementById('url-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const tab = getActiveTab();
  if (!tab) return;
  let value = urlInput.value.trim();
  if (!/^https?:\/\//i.test(value)) {
    // Treat as a search query if it isn't a URL
    if (/^[\w-]+\.[a-z]{2,}(\/.*)?$/i.test(value)) {
      value = 'https://' + value;
    } else {
      value = 'https://www.google.com/search?q=' + encodeURIComponent(value);
    }
  }
  tab.webview.src = value;
});

// --- VLC fallback button: send the active tab's URL to bundled VLC ---
document.getElementById('vlc-fallback').onclick = async () => {
  const tab = getActiveTab();
  if (!tab) return;
  const result = await window.browserAPI.playInVlc(tab.webview.src);
  if (!result.ok) {
    alert('Could not launch VLC: ' + result.error);
  }
};

// Start with one tab
createTab();
