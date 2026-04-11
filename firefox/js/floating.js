
(function () {
  if (window.__webgation_floating_active) return;
  window.__webgation_floating_active = true;

  const ROOT_ID = 'webgation-floating-root';
  const HOME_URL = "https://online-homepage.vercel.app/";
  let hideTimer;

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
  window.addEventListener('load', captureTitle);
  window.addEventListener('visibilitychange', captureTitle);
  const titleObserver = new MutationObserver(captureTitle);
  const titleEl = document.querySelector('title');
  if (titleEl) titleObserver.observe(titleEl, { childList: true });

  const css = `
    #${ROOT_ID} {
      position: fixed;
      inset: auto 20px 10px auto;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px;
      background: rgba(30, 30, 30, 0.7);
      backdrop-filter: blur(10px) saturate(10);
      border-radius: 15px;  
      border: 1px solid rgba(255,255,255,0.1); 
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      transition: opacity 0.3s ease, transform 0.1s;
      cursor: move;
      user-select: none;
    }
    #${ROOT_ID}.inactive { opacity: 0.3; }
    #${ROOT_ID}:hover { opacity: 1; }
    .wg-f-btn {
      width: 45px;
      height: 45px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      background: rgba(255,255,255,0.1);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, transform 0.1s;
    }
    .wg-f-btn:hover { background: rgba(255,255,255,0.3); transform: scale(1.1); }
    .wg-f-btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; }
    
    .wg-history-menu {
      position: absolute; left: 0; background: rgba(98, 98, 98, 0.1); backdrop-filter: blur(12px) saturate(6);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 5px; 
      display: none; flex-direction: column; min-width: 220px; width: -webkit-fill-available; max-width: 280px;
      color: white; font-family: sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-height: 250px; overflow-y: auto;
    }
    .wg-history-menu::-webkit-scrollbar {
      width: 2px;
      height: 2px;
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
        padding: 8px; cursor: pointer; border-radius: 4px; font-size: 12px; color: #e3e3e3;
        display:flex; flex-direction:column; gap:2px; border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .wg-hist-item:last-child { border-bottom: none; }
    .wg-hist-item:hover { background: rgba(255,255,255,0.2); }
    .wg-h-row { display: flex; justify-content: space-between; align-items: center; }
    .wg-h-title { font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;}
    .wg-h-url { opacity: 0.6; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wg-h-idx { opacity: 0.5; font-size: 10px; margin-left: 4px;}
    .wg-hist-disabled { padding: 8px; color: #efefef; font-size: 12px; font-style: italic; text-align: center; }
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

  const btnBack = mkEl('button', { className: 'wg-f-btn', id: 'wgf-back', title: 'Back' }, [createSvgIcon(iconPaths.back)]);
  const btnForward = mkEl('button', { className: 'wg-f-btn', id: 'wgf-forward', title: 'Forward' }, [createSvgIcon(iconPaths.forward)]);
  const btnReload = mkEl('button', { className: 'wg-f-btn', id: 'wgf-reload', title: 'Reload' }, [createSvgIcon(iconPaths.reload)]);
  const btnHome = mkEl('button', { className: 'wg-f-btn', id: 'wgf-home', title: 'Home' }, [createSvgIcon(iconPaths.home)]);
  const btnClose = mkEl('button', { className: 'wg-f-btn', id: 'wgf-close', title: 'Close' }, [createSvgIcon(iconPaths.close)]);
  const menu = mkEl('div', { className: 'wg-history-menu', id: 'wgf-menu' });

  const root = mkEl('div', { id: ROOT_ID }, [
    btnBack, btnForward, btnReload, btnHome, btnClose, menu
  ]);

  document.body.appendChild(root);

  function resetActivity() {
    root.classList.remove('inactive'); clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { root.classList.add('inactive'); }, 2500);
  }
  root.addEventListener('mouseenter', resetActivity);
  window.addEventListener('scroll', resetActivity);
  resetActivity();

  btnBack.onclick = () => history.back();
  btnForward.onclick = () => history.forward();
  btnReload.onclick = () => location.reload();

  btnHome.onclick = () => {
    captureTitle();
    location.href = HOME_URL;
  };

  btnClose.onclick = () => window.close();

  function getPrettyUrl(urlStr) {
    try { const u = new URL(urlStr); return u.hostname.replace('www.', '') + (u.pathname.length > 1 ? u.pathname : ''); }
    catch { return 'Page'; }
  }
  
  function hideHistoryMenu() {
    menu.style.display = 'none';
  }
  
  document.addEventListener('click', (e) => {
    if (
      menu.style.display === 'flex' &&
      !e.target.closest('.wg-history-menu') &&
      !e.target.closest('#wgf-back') &&
      !e.target.closest('#wgf-forward')
    ) {
      hideHistoryMenu();
    }
  });
  menu.addEventListener('click', (e) => e.stopPropagation());

  let historyDirection = 'back'; 

  function requestHistory(direction) {
    historyDirection = direction;
    window.postMessage({ __webgation: true, type: 'getHistory' }, '*');
  }

  function renderHistoryMenu(data) {
    menu.replaceChildren();
    
    const { stack, currentIdx } = data || { stack: [], currentIdx: 0 };
    const isBack = historyDirection === 'back';
    
    let list = [];
    if (isBack) {
      list = stack.slice(0, currentIdx).reverse();
    } else {
      list = stack.slice(currentIdx + 1);
    }

    if (list.length === 0) {
      const msg = mkEl('div', { className: 'wg-hist-disabled', textContent: 'No history' });
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

        item.onclick = (e) => { 
          e.stopPropagation(); 
          history.go(delta);
          menu.style.display = 'none'; 
        };
        menu.appendChild(item);
      });
    }

    menu.style.display = 'flex';
    const rootRect = root.getBoundingClientRect();
    if (rootRect.bottom + 200 > window.innerHeight) { menu.style.top = 'auto'; menu.style.bottom = '120%'; }
    else { menu.style.top = '120%'; menu.style.bottom = 'auto'; }
  }

  btnBack.oncontextmenu = (e) => { e.preventDefault(); requestHistory('back'); };
  btnForward.oncontextmenu = (e) => { e.preventDefault(); requestHistory('forward'); };

  let isDragging = false, startX, startY, initialLeft, initialTop;
  root.addEventListener('mousedown', (e) => {
    if (e.target.closest('button') || e.target.closest('.wg-history-menu')) return;
    isDragging = true; startX = e.clientX; startY = e.clientY;
    const rect = root.getBoundingClientRect(); initialLeft = rect.left; initialTop = rect.top;
    root.style.transition = 'none'; e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    root.style.top = `${initialTop + (e.clientY - startY)}px`;
    root.style.right = `auto`;
    root.style.left = `${initialLeft + (e.clientX - startX)}px`;
    root.style.bottom = `auto`;
  });
  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false; root.style.transition = 'opacity 0.3s ease, transform 0.1s';
      const rect = root.getBoundingClientRect();
      window.postMessage({ __webgation: true, type: 'savePosition', payload: { x: rect.left, y: rect.top } }, '*');
    }
  });

  window.postMessage({ __webgation: true, type: 'getSettings' }, '*');
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.__webgation !== true) return;
    
    if (e.data.type === 'receiveSettings' && e.data.payload.position) {
      root.style.left = e.data.payload.position.x + 'px';
      root.style.right = `auto`;
      root.style.top = e.data.payload.position.y + 'px';
      root.style.bottom = `auto`;
    }
    if (e.data.type === 'receiveHistory') {
      renderHistoryMenu(e.data.payload);
    }
    if (e.data.type === 'destroyUI') {
      root.remove(); styleEl.remove(); titleObserver.disconnect();
      window.__webgation_floating_active = false;
    }
  });
})();