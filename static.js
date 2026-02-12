
(function () {
  if (window.__webgation_static_active) return;
  window.__webgation_static_active = true;

  const ROOT_ID = 'webgation-static-root';
  const HOME_URL = "https://online-homepage.vercel.app/";
  let hideTimer;
  let lastScroll = window.scrollY;
  function mkEl(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, val] of Object.entries(props)) {
      if (key === 'dataset') {
        for (const [dKey, dVal] of Object.entries(val)) el.dataset[dKey] = dVal;
      } else if (key === 'style' && typeof val === 'object') {
        Object.assign(el.style, val);
      } else {
        el[key] = val;
      }
    }
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child) el.appendChild(child);
    });
    return el;
  }

  function createSvgIcon(pathData) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    svg.appendChild(path);
    return svg;
  }

  function captureTitle() {
    if (!document.title) return;
    try {
      sessionStorage.setItem('wg_current_title', document.title);
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
      background: rgba(98, 98, 98, 0.1); 
      backdrop-filter: blur(12px) saturate(6);
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
      border-bottom: 1px solid rgba(0,0,0,0.03);color: #e3e3e3;
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

  const iconPaths = {
    back: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z",
    forward: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
    reload: "M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z",
    home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
  };

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const btnReload = mkEl('button', { className: 'wg-btn', id: 'wg-reload', title: 'Reload' }, [createSvgIcon(iconPaths.reload)]);
  const btnHome = mkEl('button', { className: 'wg-btn', id: 'wg-home', title: 'Home' }, [createSvgIcon(iconPaths.home)]);
  const btnClose = mkEl('button', { className: 'wg-btn', id: 'wg-close', title: 'Close Tab' }, [createSvgIcon(iconPaths.close)]);

  const topBar = mkEl('div', { className: 'wg-top-container', id: 'wg-top-bar' }, [
    btnReload, btnHome, btnClose
  ]);

  const sidebarBack = mkEl('div', { className: 'wg-sidebar wg-left', id: 'wg-back', title: 'Back' }, [createSvgIcon(iconPaths.back)]);
  const sidebarForward = mkEl('div', { className: 'wg-sidebar wg-right', id: 'wg-forward', title: 'Forward' }, [createSvgIcon(iconPaths.forward)]);
  const menu = mkEl('div', { className: 'wg-history-menu', id: 'wg-menu' });

  const root = mkEl('div', { id: ROOT_ID }, [
    topBar, sidebarBack, sidebarForward, menu
  ]);

  document.body.appendChild(root);

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

  sidebarBack.onclick = () => history.back();
  sidebarForward.onclick = () => history.forward();
  btnReload.onclick = () => location.reload();

  btnHome.onclick = () => {
    captureTitle();
    location.href = HOME_URL;
  };

  btnClose.onclick = () => window.close();

  function getPrettyUrl(urlStr) {
    try { const u = new URL(urlStr); return u.hostname.replace('www.', '') + (u.pathname.length > 1 ? u.pathname : ''); }
    catch { return 'External Page'; }
  }

  let historyRequestOrigin = null;

  function requestHistory(e, direction) {
    e.preventDefault();
    historyRequestOrigin = { direction, x: e.clientX, y: e.clientY, target: e.target };
    window.postMessage({ __webgation: true, type: 'getHistory' }, '*');
  }

  function renderHistoryMenu(data) {
    menu.replaceChildren();

    const { stack, currentIdx } = data || { stack: [], currentIdx: 0 };
    const direction = historyRequestOrigin ? historyRequestOrigin.direction : 'back';
    const isBack = direction === 'back';
    
    let list = [];
    if (isBack) {
      list = stack.slice(0, currentIdx).reverse();
    } else {
      list = stack.slice(currentIdx + 1);
    }

    if (list.length === 0) {
      const msg = mkEl('div', { 
        className: 'wg-hist-disabled', 
        textContent: `No ${isBack ? 'back' : 'forward'} history` 
      });
      menu.appendChild(msg);
    } else {
      list.slice(0, 10).forEach((entry, i) => {
        let delta = isBack ? -(i + 1) : (i + 1);
        let displayTitle = entry.title || getPrettyUrl(entry.url);
        const displayUrl = getPrettyUrl(entry.url);

        const row = mkEl('div', { className: 'wg-h-row' }, [
          mkEl('div', { className: 'wg-h-title', textContent: displayTitle }),
          mkEl('div', { className: 'wg-h-idx', textContent: delta > 0 ? '+' + delta : delta })
        ]);
        const urlRow = mkEl('div', { className: 'wg-h-url', textContent: displayUrl });
        const item = mkEl('div', { className: 'wg-hist-item' }, [row, urlRow]);

        item.onclick = (ev) => {
          ev.stopPropagation();
          history.go(delta);
          menu.style.display = 'none';
        };
        menu.appendChild(item);
      });
    }

    menu.style.display = 'flex';
    if (historyRequestOrigin) {
        const rect = historyRequestOrigin.target.closest('.wg-sidebar').getBoundingClientRect();
        menu.style.top = Math.max(10, rect.top) + 'px';
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.bottom > window.innerHeight) { menu.style.top = 'auto'; menu.style.bottom = '10px'; }
        if (isBack) { menu.style.left = '60px'; menu.style.right = 'auto'; }
        else { menu.style.right = '60px'; menu.style.left = 'auto'; }
    }
  }

  sidebarBack.oncontextmenu = (e) => requestHistory(e, 'back');
  sidebarForward.oncontextmenu = (e) => requestHistory(e, 'forward');
  document.addEventListener('click', (e) => { if (!menu.contains(e.target)) menu.style.display = 'none'; });

  window.addEventListener('message', (e) => {
    if (!e.data || e.data.__webgation !== true) return;
    
    if (e.data.type === 'receiveHistory') {
      renderHistoryMenu(e.data.payload);
    }
    if (e.data.type === 'destroyUI') {
      root.remove(); styleEl.remove(); titleObserver.disconnect();
      window.__webgation_static_active = false;
    }
  });
})();