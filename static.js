(function () {
  if (window.__webgation_static_active) return;
  window.__webgation_static_active = true;

  const ROOT_ID = 'webgation-static-root';
  const HOME_URL = "https://online-homepage.vercel.app/";
  let hideTimer;
  let lastScroll = window.scrollY;

  function captureTitle() {
    if (!document.title || !window.navigation || !window.navigation.currentEntry) return;
    try {
      const key = window.navigation.currentEntry.key;
      sessionStorage.setItem('wg_title_' + key, document.title);
    } catch (e) { }
  }

  if (document.readyState === 'complete') captureTitle();
  window.addEventListener('load', captureTitle);
  window.addEventListener('pageshow', captureTitle);
  window.addEventListener('visibilitychange', captureTitle);

  const titleObserver = new MutationObserver(captureTitle);
  const titleEl = document.querySelector('title');
  if (titleEl) titleObserver.observe(titleEl, { childList: true });

  const css = `
    #${ROOT_ID} {
      position: fixed; top: 0; left: 0; width: 100%; height: 0; z-index: 2147483647;
      pointer-events: none; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #${ROOT_ID} .wg-top-container {
      position: fixed;
      top: -70px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 5px;
      padding: 5px 10px;
      background: rgb(98 98 98 / 0.1);
      backdrop-filter: blur(10px) saturate(6);
      border-radius: 0 0 16px 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      transition: top 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      pointer-events: auto;
      border: 1px solid rgba(0,0,0,0.05);
   
    }
    #${ROOT_ID} .wg-top-container.visible { top: 0; }
    #${ROOT_ID} .wg-btn {
      width: 45px; height: 45px; border-radius: 10px; border: none; cursor: pointer;
      background:rgba(255,255,255,0.1); color: #fff; display: flex; align-items: center; justify-content: center;
      transition: background 0.2s, transform 0.1s;
    }
    #${ROOT_ID} .wg-btn:hover { background: rgba(255,255,255,0.3); transform: scale(1.1); }
    #${ROOT_ID} .wg-btn svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2; }

    .wg-sidebar {
      position: fixed; top: 50%; transform: translateY(-50%);
      background: rgba(98, 98, 98, 0.1);
      backdrop-filter: blur(12px) saturate(6);
      width: 45px; height: 90px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; pointer-events: auto; opacity: 0.4; transition: opacity 0.3s, transform 0.2s;
      z-index: 2147483647; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .wg-sidebar:hover { opacity: 1; transform: translateY(-50%); }
    .wg-left { left: 0; border-radius: 0 12px 12px 0; }
    .wg-right { right: 0; border-radius: 12px 0 0 12px; }
    .wg-sidebar svg { width: 28px; height: 28px; fill: none; stroke: white; stroke-width: 3; }

    .wg-history-menu {
      position: fixed;
      background: rgba(30, 30, 30, 0.95);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 20px;
      padding: 6px;
      display: none;
      flex-direction: column;
      gap: 5px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.25);
      pointer-events: auto;
      min-width: 220px;
      max-width: 260px;
      max-height: 350px;
      overflow-y: auto;
      z-index: 2147483648;
      animation: wgFadeIn 0.15s ease-out;
    }
    @keyframes wgFadeIn { from{opacity:0;transform:scale(0.95);} to{opacity:1;transform:scale(1);} }
     .wg-history-menu::-webkit-scrollbar {
      width: 3px;
      height: 3px;
    }
    .wg-history-menu::-webkit-scrollbar-track {
      background: transparent;
    }
    .wg-history-menu::-webkit-scrollbar-thumb {
      background:#ffffff;
      border-radius: 5px;
      cursor: grab;
    }
      
    .wg-hist-item {
      padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 13px;
      display: flex; flex-direction: column; gap: 2px; transition: background 0.1s;
      border-bottom: 1px solid rgba(0,0,0,0.03);
    }
    .wg-hist-item:last-child { border-bottom: none; }
    .wg-hist-item:hover { background: rgba(255,255,255,0.2); color: white; }
    .wg-h-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .wg-h-title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
    .wg-h-url { font-size: 11px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
    .wg-h-idx { font-size: 11px; opacity: 0.5; font-weight: bold; margin-left: 6px; flex-shrink: 0; }
    .wg-hist-item:hover .wg-h-url, .wg-hist-item:hover .wg-h-idx { opacity: 0.9; color: rgba(255,255,255,0.9); }
    .wg-hist-disabled { padding: 10px; color: #999; text-align: center; font-style: italic; font-size: 13px; }
  `;

  const icons = {
    back: `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`,
    forward: `<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`,
    reload: `<svg viewBox="0 0 24 24"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/></svg>`,
    home: `<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`
  };

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.innerHTML = `
    <div class="wg-top-container" id="wg-top-bar">
      <button class="wg-btn" id="wg-reload" title="Reload">${icons.reload}</button>
      <button class="wg-btn" id="wg-home" title="Home">${icons.home}</button>
      <button class="wg-btn" id="wg-close" title="Close Tab">${icons.close}</button>
    </div>
    <div class="wg-sidebar wg-left" id="wg-back" title="Back">${icons.back}</div>
    <div class="wg-sidebar wg-right" id="wg-forward" title="Forward">${icons.forward}</div>
    <div class="wg-history-menu" id="wg-menu"></div>
  `;
  document.body.appendChild(root);

  const topBar = document.getElementById('wg-top-bar');
  function toggleTopBar(show) { show ? topBar.classList.add('visible') : topBar.classList.remove('visible'); }

  document.addEventListener('mousemove', (e) => {
    if (e.clientY <= 50) { clearTimeout(hideTimer); toggleTopBar(true); }
    else if (!topBar.contains(e.target)) { clearTimeout(hideTimer); hideTimer = setTimeout(() => toggleTopBar(false), 500); }
  });
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > lastScroll && y > 50) toggleTopBar(false); else if (y < lastScroll) toggleTopBar(true);
    lastScroll = y;
  });

  document.getElementById('wg-back').onclick = () => history.back();
  document.getElementById('wg-forward').onclick = () => history.forward();
  document.getElementById('wg-reload').onclick = () => location.reload();

  document.getElementById('wg-home').onclick = () => {
    captureTitle();
    location.href = HOME_URL;
  };

  document.getElementById('wg-close').onclick = () => window.close();

  const menu = document.getElementById('wg-menu');

  function getPrettyUrl(urlStr) {
    try { const u = new URL(urlStr); return u.hostname.replace('www.', '') + (u.pathname.length > 1 ? u.pathname : ''); }
    catch { return 'External Page'; }
  }

  function showHistory(e, direction) {
    e.preventDefault();
    menu.innerHTML = '';
    const nav = window.navigation;
    if (!nav) { menu.innerHTML = `<div class="wg-hist-disabled">Browser not supported</div>`; menu.style.display = 'flex'; return; }

    const entries = nav.entries();
    const currentIdx = nav.currentEntry ? nav.currentEntry.index : 0;
    const isBack = direction === 'back';
    let list = isBack ? entries.slice(0, currentIdx).reverse() : entries.slice(currentIdx + 1);

    if (list.length === 0) {
      menu.innerHTML = `<div class="wg-hist-disabled">No ${isBack ? 'back' : 'forward'} history</div>`;
    } else {
      list.slice(0, 10).forEach((entry, i) => {
        const step = isBack ? -(i + 1) : (i + 1);

        let displayTitle = sessionStorage.getItem('wg_title_' + entry.key);
        if (!displayTitle && entry.name) displayTitle = entry.name;
        if (!displayTitle) displayTitle = getPrettyUrl(entry.url);

        const displayUrl = getPrettyUrl(entry.url);

        const item = document.createElement('div');
        item.className = 'wg-hist-item';
        item.innerHTML = `
            <div class="wg-h-row">
                <div class="wg-h-title">${displayTitle}</div>
                <div class="wg-h-idx">${step > 0 ? '+' + step : step}</div>
            </div>
            <div class="wg-h-url">${displayUrl}</div>
        `;
        item.onclick = (ev) => {
          ev.stopPropagation();
          nav.traverseTo(entry.key);
          menu.style.display = 'none';
        };
        menu.appendChild(item);
      });
    }

    menu.style.display = 'flex';
    const rect = e.target.closest('.wg-sidebar').getBoundingClientRect();
    menu.style.top = Math.max(10, rect.top) + 'px';
    const menuRect = menu.getBoundingClientRect();
    if (menuRect.bottom > window.innerHeight) { menu.style.top = 'auto'; menu.style.bottom = '10px'; }
    if (isBack) { menu.style.left = '60px'; menu.style.right = 'auto'; }
    else { menu.style.right = '60px'; menu.style.left = 'auto'; }
  }

  document.getElementById('wg-back').oncontextmenu = (e) => showHistory(e, 'back');
  document.getElementById('wg-forward').oncontextmenu = (e) => showHistory(e, 'forward');
  document.addEventListener('click', (e) => { if (!menu.contains(e.target)) menu.style.display = 'none'; });

  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'destroyUI') {
      root.remove(); styleEl.remove(); titleObserver.disconnect();
      window.__webgation_static_active = false;
    }
  });
})();