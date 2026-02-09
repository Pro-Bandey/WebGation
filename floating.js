// floating.js
(function () {
  if (window.__quicknav_floating_active) return;
  window.__quicknav_floating_active = true;

  const ROOT_ID = 'quicknav-floating-root';
  const HOME_URL = "https://online-homepage.vercel.app/";
  let hideTimer;

  function captureTitle() {
    if (!document.title || !window.navigation || !window.navigation.currentEntry) return;
    try {
      const key = window.navigation.currentEntry.key;
      sessionStorage.setItem('qn_title_' + key, document.title);
    } catch (e) {}
  }
  if (document.readyState === 'complete') captureTitle();
  window.addEventListener('load', captureTitle);
  window.addEventListener('visibilitychange', captureTitle);
  const titleObserver = new MutationObserver(captureTitle);
  const titleEl = document.querySelector('title');
  if (titleEl) titleObserver.observe(titleEl, { childList: true });

  const css = `
    #${ROOT_ID} {
      position: fixed; top: 10px; z-index: 2147483647; display: flex; align-items: center; gap: 4px; padding: 6px;
      background: rgba(30, 30, 30, 0.7); backdrop-filter: blur(15px) saturate(180%);
      border-radius: 100px; border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3); transition: opacity 0.3s ease, transform 0.1s;
      cursor: move; user-select: none;
    }
    #${ROOT_ID}.inactive { opacity: 0.3; }
    #${ROOT_ID}:hover { opacity: 1; }
    .qn-f-btn {
      width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer;
      background: rgba(255,255,255,0.1); color: white; display: flex; align-items: center; justify-content: center;
      transition: background 0.2s, transform 0.1s;
    }
    .qn-f-btn:hover { background: rgba(255,255,255,0.3); transform: scale(1.1); }
    .qn-f-btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; }
    
    .qn-history-menu {
      position: absolute; left: 0; background: rgba(30, 30, 30, 0.95); backdrop-filter: blur(15px);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px; 
      display: none; flex-direction: column; min-width: 220px; max-width: 280px;
      color: white; font-family: sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-height: 250px; overflow-y: auto;
    }
    .qn-hist-item { 
        padding: 8px; cursor: pointer; border-radius: 4px; font-size: 12px; 
        display:flex; flex-direction:column; gap:2px; border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .qn-hist-item:last-child { border-bottom: none; }
    .qn-hist-item:hover { background: rgba(255,255,255,0.2); }
    .qn-h-row { display: flex; justify-content: space-between; align-items: center; }
    .qn-h-title { font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;}
    .qn-h-url { opacity: 0.6; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .qn-h-idx { opacity: 0.5; font-size: 10px; margin-left: 4px;}
    .qn-hist-disabled { padding: 8px; color: #aaa; font-size: 12px; font-style: italic; text-align: center; }
  `;

  const icons = {
    back: `<svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
    forward: `<svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
    reload: `<svg viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
    home: `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>`,
    close: `<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
  };

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.innerHTML = `
    <button class="qn-f-btn" id="qnf-back" title="Back">${icons.back}</button>
    <button class="qn-f-btn" id="qnf-forward" title="Forward">${icons.forward}</button>
    <button class="qn-f-btn" id="qnf-reload" title="Reload">${icons.reload}</button>
    <button class="qn-f-btn" id="qnf-home" title="Home">${icons.home}</button>
    <button class="qn-f-btn" id="qnf-close" title="Close">${icons.close}</button>
    <div class="qn-history-menu" id="qnf-menu"></div>
  `;
  document.body.appendChild(root);

  function resetActivity() {
    root.classList.remove('inactive'); clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { root.classList.add('inactive'); }, 2500);
  }
  root.addEventListener('mouseenter', resetActivity);
  window.addEventListener('scroll', resetActivity);
  resetActivity(); 

  document.getElementById('qnf-back').onclick = () => history.back();
  document.getElementById('qnf-forward').onclick = () => history.forward();
  document.getElementById('qnf-reload').onclick = () => location.reload();
  
  // --- HOME ACTION ---
  document.getElementById('qnf-home').onclick = () => {
    captureTitle();
    location.href = HOME_URL;
  };
  
  document.getElementById('qnf-close').onclick = () => window.close();

  const menu = document.getElementById('qnf-menu');
  function getPrettyUrl(urlStr) {
    try { const u = new URL(urlStr); return u.hostname.replace('www.', '') + (u.pathname.length > 1 ? u.pathname : ''); } 
    catch { return 'Page'; }
  }

  function showHistory(isBack) {
    menu.innerHTML = '';
    const nav = window.navigation;
    if (!nav) { menu.innerHTML = `<div class="qn-hist-disabled">Browser not supported</div>`; menu.style.display='flex'; return; }
    
    const entries = nav.entries();
    const currentIdx = nav.currentEntry ? nav.currentEntry.index : 0;
    let list = isBack ? entries.slice(0, currentIdx).reverse() : entries.slice(currentIdx + 1);

    if (list.length === 0) {
      menu.innerHTML = `<div class="qn-hist-disabled">No history</div>`;
    } else {
      list.slice(0, 10).forEach((entry, i) => {
        const step = isBack ? -(i + 1) : (i + 1);
        
        let displayTitle = sessionStorage.getItem('qn_title_' + entry.key);
        if (!displayTitle && entry.name) displayTitle = entry.name;
        if (!displayTitle) displayTitle = getPrettyUrl(entry.url);
        
        const displayUrl = getPrettyUrl(entry.url);
        
        const d = document.createElement('div');
        d.className = 'qn-hist-item';
        d.innerHTML = `
            <div class="qn-h-row">
                <div class="qn-h-title">${displayTitle}</div>
                <div class="qn-h-idx">${step>0?'+'+step:step}</div>
            </div>
            <div class="qn-h-url">${displayUrl}</div>
        `;
        d.onclick = (e) => { e.stopPropagation(); nav.traverseTo(entry.key); menu.style.display='none'; };
        menu.appendChild(d);
      });
    }

    menu.style.display = 'flex';
    const rootRect = root.getBoundingClientRect();
    if (rootRect.bottom + 200 > window.innerHeight) { menu.style.top = 'auto'; menu.style.bottom = '120%'; } 
    else { menu.style.top = '120%'; menu.style.bottom = 'auto'; }
  }

  document.getElementById('qnf-back').oncontextmenu = (e) => { e.preventDefault(); showHistory(true); };
  document.getElementById('qnf-forward').oncontextmenu = (e) => { e.preventDefault(); showHistory(false); };
  
  let isDragging = false, startX, startY, initialLeft, initialTop;
  root.addEventListener('mousedown', (e) => {
    if(e.target.closest('button') || e.target.closest('.qn-history-menu')) return;
    isDragging = true; startX = e.clientX; startY = e.clientY;
    const rect = root.getBoundingClientRect(); initialLeft = rect.left; initialTop = rect.top;
    root.style.transition = 'none'; e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    root.style.left = `${initialLeft + (e.clientX - startX)}px`;
    root.style.top = `${initialTop + (e.clientY - startY)}px`;
  });
  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false; root.style.transition = 'opacity 0.3s ease, transform 0.1s';
      const rect = root.getBoundingClientRect();
      window.postMessage({ __quicknav: true, type: 'savePosition', payload: { x: rect.left, y: rect.top } }, '*');
    }
  });

  window.postMessage({ __quicknav: true, type: 'getSettings' }, '*');
  window.addEventListener('message', (e) => {
    if(e.data && e.data.type === 'receiveSettings' && e.data.payload.position) {
        root.style.left = e.data.payload.position.x + 'px';
        root.style.top = e.data.payload.position.y + 'px';
    }
    if(e.data && e.data.type === 'destroyUI') {
        root.remove(); styleEl.remove(); titleObserver.disconnect();
        window.__quicknav_floating_active = false;
    }
  });
})();