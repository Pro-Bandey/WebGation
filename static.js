// static.js
(function () {
  if (window.__quicknav_static_active) return;
  window.__quicknav_static_active = true;

  const ROOT_ID = 'quicknav-static-root';
  // Fallback to Vercel app since internal chrome://newtab cannot be opened in current tab via script
  const HOME_URL = "https://online-homepage.vercel.app/"; 
  let hideTimer;
  let lastScroll = window.scrollY;

  // --- 1. TITLE CAPTURE (Session Storage) ---
  function captureTitle() {
    // Requires Navigation API support (Chrome/Edge 102+)
    if (!document.title || !window.navigation || !window.navigation.currentEntry) return;
    try {
      const key = window.navigation.currentEntry.key;
      // Save title mapped to the specific history ID
      sessionStorage.setItem('qn_title_' + key, document.title);
    } catch (e) {}
  }

  // Trigger on every possible event
  if (document.readyState === 'complete') captureTitle();
  window.addEventListener('load', captureTitle);
  window.addEventListener('pageshow', captureTitle);
  window.addEventListener('visibilitychange', captureTitle);
  
  const titleObserver = new MutationObserver(captureTitle);
  const titleEl = document.querySelector('title');
  if (titleEl) titleObserver.observe(titleEl, { childList: true });

  // --- CSS ---
  const css = `
    #${ROOT_ID} {
      position: fixed; top: 0; left: 0; width: 100%; height: 0; z-index: 2147483647;
      pointer-events: none; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #${ROOT_ID} .qn-top-container {
      position: fixed; top: -70px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 8px; padding: 10px 20px;
      background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px);
      border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      transition: top 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      pointer-events: auto; border: 1px solid rgba(0,0,0,0.05);
    }
    #${ROOT_ID} .qn-top-container.visible { top: 0; }
    #${ROOT_ID} .qn-btn {
      width: 44px; height: 44px; border-radius: 10px; border: none; cursor: pointer;
      background: transparent; color: #333; display: flex; align-items: center; justify-content: center;
      transition: background 0.2s, transform 0.1s;
    }
    #${ROOT_ID} .qn-btn:hover { background: rgba(0,0,0,0.06); transform: scale(1.05); }
    #${ROOT_ID} .qn-btn svg { width: 22px; height: 22px; stroke-width: 2; }

    .qn-sidebar {
      position: fixed; top: 50%; transform: translateY(-50%);
      width: 44px; height: 100px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; pointer-events: auto; opacity: 0.4; transition: opacity 0.3s, transform 0.2s;
      z-index: 2147483647; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .qn-sidebar:hover { opacity: 1; transform: translateY(-50%) scale(1.1); }
    .qn-left { left: 0; background: #FF3B30; border-radius: 0 12px 12px 0; }
    .qn-right { right: 0; background: #FF3B30; border-radius: 12px 0 0 12px; }
    .qn-sidebar svg { width: 28px; height: 28px; fill: none; stroke: white; stroke-width: 3; }

    .qn-history-menu {
      position: fixed; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px);
      border: 1px solid rgba(0,0,0,0.1); border-radius: 12px;
      padding: 6px; display: none; flex-direction: column; gap: 2px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.25); pointer-events: auto;
      min-width: 260px; max-width: 340px; max-height: 400px; overflow-y: auto;
      z-index: 2147483648; animation: qnFadeIn 0.15s ease-out;
    }
    @keyframes qnFadeIn { from{opacity:0;transform:scale(0.95);} to{opacity:1;transform:scale(1);} }

    .qn-hist-item {
      padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; color: #333;
      display: flex; flex-direction: column; gap: 2px; transition: background 0.1s;
      border-bottom: 1px solid rgba(0,0,0,0.03);
    }
    .qn-hist-item:last-child { border-bottom: none; }
    .qn-hist-item:hover { background: #007AFF; color: white; }
    .qn-h-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .qn-h-title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
    .qn-h-url { font-size: 11px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
    .qn-h-idx { font-size: 11px; opacity: 0.5; font-weight: bold; margin-left: 6px; flex-shrink: 0; }
    .qn-hist-item:hover .qn-h-url, .qn-hist-item:hover .qn-h-idx { opacity: 0.9; color: rgba(255,255,255,0.9); }
    .qn-hist-disabled { padding: 10px; color: #999; text-align: center; font-style: italic; font-size: 13px; }
  `;

  const icons = {
    back: `<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>`,
    forward: `<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>`,
    home: `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>`,
    reload: `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
    close: `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
  };

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.innerHTML = `
    <div class="qn-top-container" id="qn-top-bar">
      <button class="qn-btn" id="qn-reload" title="Reload">${icons.reload}</button>
      <button class="qn-btn" id="qn-home" title="Home">${icons.home}</button>
      <button class="qn-btn" id="qn-close" title="Close Tab">${icons.close}</button>
    </div>
    <div class="qn-sidebar qn-left" id="qn-back" title="Back">${icons.back}</div>
    <div class="qn-sidebar qn-right" id="qn-forward" title="Forward">${icons.forward}</div>
    <div class="qn-history-menu" id="qn-menu"></div>
  `;
  document.body.appendChild(root);

  // --- Show/Hide Logic ---
  const topBar = document.getElementById('qn-top-bar');
  function toggleTopBar(show) { show ? topBar.classList.add('visible') : topBar.classList.remove('visible'); }

  document.addEventListener('mousemove', (e) => {
    if (e.clientY <= 60) { clearTimeout(hideTimer); toggleTopBar(true); }
    else if (!topBar.contains(e.target)) { clearTimeout(hideTimer); hideTimer = setTimeout(() => toggleTopBar(false), 500); }
  });
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > lastScroll && y > 50) toggleTopBar(false); else if (y < lastScroll) toggleTopBar(true);
    lastScroll = y;
  });

  // --- Actions ---
  document.getElementById('qn-back').onclick = () => history.back();
  document.getElementById('qn-forward').onclick = () => history.forward();
  document.getElementById('qn-reload').onclick = () => location.reload();
  
  // --- HOME ACTION (Preserves History) ---
  document.getElementById('qn-home').onclick = () => {
    // 1. Force save title of current page before leaving
    captureTitle();
    // 2. Standard navigation (pushes to history stack)
    location.href = HOME_URL;
  };

  document.getElementById('qn-close').onclick = () => window.close();

  // --- History Menu ---
  const menu = document.getElementById('qn-menu');
  
  function getPrettyUrl(urlStr) {
    try { const u = new URL(urlStr); return u.hostname.replace('www.', '') + (u.pathname.length > 1 ? u.pathname : ''); } 
    catch { return 'External Page'; }
  }

  function showHistory(e, direction) {
    e.preventDefault();
    menu.innerHTML = '';
    const nav = window.navigation;
    if (!nav) { menu.innerHTML = `<div class="qn-hist-disabled">Browser not supported</div>`; menu.style.display = 'flex'; return; }
    
    const entries = nav.entries();
    const currentIdx = nav.currentEntry ? nav.currentEntry.index : 0;
    const isBack = direction === 'back';
    let list = isBack ? entries.slice(0, currentIdx).reverse() : entries.slice(currentIdx + 1);

    if (list.length === 0) {
      menu.innerHTML = `<div class="qn-hist-disabled">No ${isBack ? 'back' : 'forward'} history</div>`;
    } else {
      list.slice(0, 10).forEach((entry, i) => {
        const step = isBack ? -(i + 1) : (i + 1);
        
        // Lookup title from SessionStorage (using unique key)
        let displayTitle = sessionStorage.getItem('qn_title_' + entry.key);
        if (!displayTitle && entry.name) displayTitle = entry.name;
        if (!displayTitle) displayTitle = getPrettyUrl(entry.url);
        
        const displayUrl = getPrettyUrl(entry.url);
        
        const item = document.createElement('div');
        item.className = 'qn-hist-item';
        item.innerHTML = `
            <div class="qn-h-row">
                <div class="qn-h-title">${displayTitle}</div>
                <div class="qn-h-idx">${step>0?'+'+step:step}</div>
            </div>
            <div class="qn-h-url">${displayUrl}</div>
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
    const rect = e.target.closest('.qn-sidebar').getBoundingClientRect();
    menu.style.top = Math.max(10, rect.top) + 'px';
    const menuRect = menu.getBoundingClientRect();
    if (menuRect.bottom > window.innerHeight) { menu.style.top = 'auto'; menu.style.bottom = '10px'; }
    if (isBack) { menu.style.left = '60px'; menu.style.right = 'auto'; }
    else { menu.style.right = '60px'; menu.style.left = 'auto'; }
  }

  document.getElementById('qn-back').oncontextmenu = (e) => showHistory(e, 'back');
  document.getElementById('qn-forward').oncontextmenu = (e) => showHistory(e, 'forward');
  document.addEventListener('click', (e) => { if (!menu.contains(e.target)) menu.style.display = 'none'; });

  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'destroyUI') {
      root.remove(); styleEl.remove(); titleObserver.disconnect();
      window.__quicknav_static_active = false;
    }
  });
})();