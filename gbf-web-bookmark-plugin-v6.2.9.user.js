// ==UserScript==
// @name         GBF Panel Pro
// @namespace    gbf.panel.pro
// @version      6.2.9
// @match        *://steam.granbluefantasy.com/*
// @match        *://gbf.game.mbga.jp/*
// @match        *://game.granbluefantasy.jp/*
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  const KEY = 'gbf-panel-v15';

  const state = {
    x: 50, y: 120,
    activeList: 'raid',
    docked: false, dockEdge: null,
    opacity: 100,
    idleSec: 5,
    idleMode: false, idleActive: false
  };

  let data = {
    main: [{ name: '首页', url: '#mypage' }],
    raid: [{ name: 'EX+', url: '#quest/ex' }, { name: 'HELL', url: '#quest/hell' }]
  };

  let settingsOpen = false;
  let idleTimer = null;
  let mouseOnPanel = false;
  let preventDragUntil = 0;
  let preventIdleUntil = 0;
  let suppressClickUntil = 0;
  let resizeRAF = 0;
  let panelNaturalH = 0; // 面板展开时的自然高度

  const IDLE_THIN = 13;
  const PANEL_W = 150;
  const DOCK_SNAP = 6;

  /* ─── persistence ─────────────────────────────── */
  function load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    try {
      const obj = JSON.parse(raw);
      if (obj.data)  data  = obj.data;
      if (obj.state) { Object.assign(state, obj.state); sanitizeState(); }
    } catch {}
  }
  function save() { localStorage.setItem(KEY, JSON.stringify({ data, state })); }

  function sanitizeState() {
    const cw = document.documentElement.clientWidth;
    const ch = document.documentElement.clientHeight;
    if (state.x < -PANEL_W || state.x > cw || state.y < -200 || state.y > ch) {
      state.x = 50; state.y = 120;
      state.docked = false; state.dockEdge = null; state.idleActive = false;
    }
  }

  /* ─── transform helpers ────────────────────────── */
  // 只设 translate，不碰 transition（拖动时也走这里，永远无惯性）
  function setXY(el) {
    el.style.transform = `translate(${state.x}px,${state.y}px)`;
    el.style.opacity   = Math.max(0.1, state.opacity / 100);
  }

  // 临时覆写 transform 用于 hover-show 展开偏移，不改 state
  function setRawXY(el, x, y) {
    el.style.transform = `translate(${x}px,${y}px)`;
    el.style.opacity   = Math.max(0.1, state.opacity / 100);
  }

  function updateIdleClass(el) {
    el.classList.remove('idle-left','idle-right','idle-top','idle-bottom');
    if (state.idleActive && state.docked && state.dockEdge)
      el.classList.add('idle-' + state.dockEdge);
    el.querySelector('.title')?.classList.toggle('idle-mode-on', state.idleMode);
  }

  function clampValue(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  /* ─── dock / clamp ─────────────────────────────── */
  function clampAndDock(el) {
    const r  = el.getBoundingClientRect();
    const cw = document.documentElement.clientWidth;
    const ch = document.documentElement.clientHeight;
    const maxX = Math.max(0, cw - r.width);
    const maxY = Math.max(0, ch - r.height);
    let edge = null;
    if      (r.left   <= DOCK_SNAP)      { state.x = 0;    state.y = clampValue(state.y, 0, maxY); edge = 'left';   }
    else if (r.right  >= cw - DOCK_SNAP) { state.x = maxX; state.y = clampValue(state.y, 0, maxY); edge = 'right';  }
    else if (r.top    <= DOCK_SNAP)      { state.y = 0;    state.x = clampValue(state.x, 0, maxX); edge = 'top';    }
    else if (r.bottom >= ch - DOCK_SNAP) { state.y = maxY; state.x = clampValue(state.x, 0, maxX); edge = 'bottom'; }

    if (edge) { state.docked = true; state.dockEdge = edge; setXY(el); }
    else      { state.docked = false; state.dockEdge = null; }
    return !!edge;
  }

  function forceVisible(el) {
    const r  = el.getBoundingClientRect();
    const cw = document.documentElement.clientWidth;
    const ch = document.documentElement.clientHeight;
    const maxX = Math.max(0, cw - r.width);
    const maxY = Math.max(0, ch - r.height);
    let changed = false;
    if      (r.left   < 0)  { state.x = 0;    changed = true; }
    else if (r.right  > cw) { state.x = maxX; changed = true; }
    if      (r.top    < 0)  { state.y = 0;    changed = true; }
    else if (r.bottom > ch) { state.y = maxY; changed = true; }
    if (changed) {
      setXY(el); updateIdleClass(el);
    }
    return changed;
  }

  function syncViewport(el) {
    const r  = el.getBoundingClientRect();
    const cw = document.documentElement.clientWidth;
    const ch = document.documentElement.clientHeight;
    let changed = false;

    if (state.docked && state.dockEdge) {
      if (state.idleActive) {
        const maxY = Math.max(0, ch - (panelNaturalH || r.height));
        const maxX = Math.max(0, cw - r.width);
        if      (state.dockEdge === 'left')   { state.x = 0;              state.y = clampValue(state.y, 0, maxY); }
        else if (state.dockEdge === 'right')  { state.x = Math.max(0, cw - IDLE_THIN); state.y = clampValue(state.y, 0, maxY); }
        else if (state.dockEdge === 'top')    { state.y = 0;              state.x = clampValue(state.x, 0, maxX); }
        else if (state.dockEdge === 'bottom') { state.y = Math.max(0, ch - IDLE_THIN); state.x = clampValue(state.x, 0, maxX); }
      } else {
        const maxX = Math.max(0, cw - r.width);
        const maxY = Math.max(0, ch - r.height);
        if      (state.dockEdge === 'left')   { state.x = 0;    state.y = clampValue(state.y, 0, maxY); }
        else if (state.dockEdge === 'right')  { state.x = maxX; state.y = clampValue(state.y, 0, maxY); }
        else if (state.dockEdge === 'top')    { state.y = 0;    state.x = clampValue(state.x, 0, maxX); }
        else if (state.dockEdge === 'bottom') { state.y = maxY; state.x = clampValue(state.x, 0, maxX); }
      }
      changed = true;
    } else {
      changed = clampAndDock(el);
      if (!changed) changed = forceVisible(el);
    }

    if (changed) {
      setXY(el);
      updateIdleClass(el);
      save();
      if (state.idleMode && state.docked && !state.idleActive && !mouseOnPanel) startIdleTimer(el, true);
    }
  }

  function scheduleViewportSync(el) {
    if (resizeRAF) return;
    resizeRAF = requestAnimationFrame(() => {
      resizeRAF = 0;
      syncViewport(el);
    });
  }

  /* ─── idle timer ───────────────────────────────── */
  function clearIdleTimer() { clearTimeout(idleTimer); idleTimer = null; }

  function startIdleTimer(el, ignoreMouse = false) {
    clearIdleTimer();
    if (Date.now() < preventIdleUntil) return;
    // FIX-逻辑: 条件只需 idleMode && docked，不管鼠标位置（ignoreMouse 参数保留兼容）
    if (!state.idleMode || !state.docked) return;
    if (!ignoreMouse && mouseOnPanel) return;

    idleTimer = setTimeout(() => {
      panelNaturalH = el.getBoundingClientRect().height;

      const cw = document.documentElement.clientWidth;
      const ch = document.documentElement.clientHeight;
      if      (state.dockEdge === 'left')   state.x = 0;
      else if (state.dockEdge === 'right')  state.x = cw - IDLE_THIN;
      else if (state.dockEdge === 'top')    state.y = 0;
      else if (state.dockEdge === 'bottom') state.y = ch - IDLE_THIN;
      // 左右收缩时 transform 不影响布局，需显式锁定高度，否则面板高度会撑大
      if (state.dockEdge === 'left' || state.dockEdge === 'right') {
        el.style.height = panelNaturalH + 'px';
      }
      setXY(el);
      state.idleActive = true;
      updateIdleClass(el);
      save();
    }, state.idleSec * 1000);
  }

  function exitIdleActive(el) {
    // 先把展开状态下的实际位置同步到 state，避免拖动时以旧细条坐标计算偏移导致瞬移
    const r = el.getBoundingClientRect();
    state.x = r.left;
    state.y = r.top;
    el.classList.remove('hover-show');
    el.style.height = '';
    state.idleActive = false;
    updateIdleClass(el);
    clearIdleTimer();
    clampAndDock(el);
    setXY(el);
    if (state.idleMode && state.docked && !mouseOnPanel) startIdleTimer(el);
  }

  // FIX-逻辑: toggleIdleMode 里，只要现在 docked 就启动计时
  function toggleIdleMode(el) {
    state.idleMode = !state.idleMode;
    state.idleActive = false;
    clearIdleTimer();
    if (state.idleMode) clampAndDock(el);
    updateIdleClass(el);
    if (state.idleMode && state.docked) {
      startIdleTimer(el, true); // ignoreMouse=true：开关瞬间不管鼠标在不在
    }
    save();
  }

  /* ─── render ────────────────────────────────────── */
  function render(el) {
    const list = data[state.activeList];
    const box  = el.querySelector('.menu');
    box.innerHTML = list.map((item, i) =>
      `<div class="item" data-i="${i}">${item.name}</div>`).join('');

    box.querySelectorAll('.item').forEach(dom => {
      const i = +dom.dataset.i;
      dom.addEventListener('click',       () => { if (Date.now() < suppressClickUntil) return; if (!state.idleActive) location.href = list[i].url; });
      dom.addEventListener('contextmenu', e  => { e.preventDefault(); e.stopPropagation(); showCtxMenu(e, i, el); });
    });

    const addBtn = document.createElement('div');
    addBtn.className = 'item add-btn';
    addBtn.textContent = '＋ 添加书签';
    addBtn.onclick = () => { if (Date.now() < suppressClickUntil) return; showAddDialog(el); };
    box.appendChild(addBtn);

    el.querySelectorAll('.tabs span').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === state.activeList);
      t.onclick = () => { if (Date.now() < suppressClickUntil) return; state.activeList = t.dataset.tab; save(); render(el); };
    });

    // 缓存自然高度
    requestAnimationFrame(() => {
      if (!state.idleActive) panelNaturalH = el.getBoundingClientRect().height;
    });
  }

  /* ─── context menu ──────────────────────────────── */
  function showCtxMenu(e, idx, panelEl) {
    removeCtxMenu();
    const menu = document.createElement('div');
    menu.id = 'gbf-ctx';
    menu.innerHTML = `<div class="ctx-item" id="ctx-edit">✏️ 编辑</div>
                      <div class="ctx-item ctx-del" id="ctx-del">🗑️ 删除</div>`;
    menu.style.cssText = 'position:fixed;z-index:9999999;background:#2a2a2a;border:1px solid #555;' +
      'border-radius:5px;padding:3px 0;min-width:100px;font-size:12px;color:#fff;' +
      'box-shadow:0 4px 12px rgba(0,0,0,.4);';
    document.body.appendChild(menu);
    let mx = e.clientX, my = e.clientY;
    const mr = menu.getBoundingClientRect();
    if (mx + mr.width  > innerWidth)  mx = innerWidth  - mr.width  - 4;
    if (my + mr.height > innerHeight) my = innerHeight - mr.height - 4;
    menu.style.left = mx + 'px'; menu.style.top = my + 'px';
    menu.querySelector('#ctx-edit').onclick = () => { removeCtxMenu(); showEditDialog(idx, panelEl); };
    menu.querySelector('#ctx-del').onclick  = () => {
      removeCtxMenu();
      data[state.activeList].splice(idx, 1);
      save(); render(panelEl);
    };
    setTimeout(() => document.addEventListener('click', removeCtxMenu, { once: true }), 0);
  }
  function removeCtxMenu() { document.getElementById('gbf-ctx')?.remove(); }

  /* ─── dialogs ───────────────────────────────────── */
  function showEditDialog(idx, panelEl) {
    const item = data[state.activeList][idx];
    showDialog({ title:'编辑书签', name:item.name, url:item.url,
      onConfirm(n,u) { data[state.activeList][idx] = {name:n,url:u}; save(); render(panelEl); } });
  }
  function showAddDialog(panelEl) {
    showDialog({ title:'添加书签',
      name: document.title || '',
      url:  location.hash  || location.href,
      onConfirm(n,u) { data[state.activeList].push({name:n,url:u}); save(); render(panelEl); } });
  }

  function showDialog({ title, name, url, onConfirm }) {
    removeDialog();
    const overlay = document.createElement('div');
    overlay.id = 'gbf-dialog-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000000;background:rgba(0,0,0,.5);' +
      'display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
      <div style="background:#2a2a2a;border:1px solid #555;border-radius:8px;padding:16px;
        min-width:260px;color:#fff;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.5);">
        <div style="font-weight:bold;margin-bottom:12px;font-size:14px;">${title}</div>
        <div style="margin-bottom:8px;">
          <div style="margin-bottom:4px;color:#aaa;font-size:11px;">名称</div>
          <input id="gbf-d-name" type="text" value="${esc(name)}"
            style="width:100%;box-sizing:border-box;padding:5px 7px;border:1px solid #555;
            border-radius:4px;background:#1a1a1a;color:#fff;font-size:12px;">
        </div>
        <div style="margin-bottom:12px;">
          <div style="margin-bottom:4px;color:#aaa;font-size:11px;">网址</div>
          <input id="gbf-d-url" type="text" value="${esc(url)}"
            style="width:100%;box-sizing:border-box;padding:5px 7px;border:1px solid #555;
            border-radius:4px;background:#1a1a1a;color:#fff;font-size:12px;">
          <div id="gbf-d-fill" style="margin-top:4px;font-size:11px;color:#00bfff;cursor:pointer;">
            📋 读取当前页面
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="gbf-d-cancel" style="padding:5px 12px;border:1px solid #555;border-radius:4px;
            background:#333;color:#fff;cursor:pointer;font-size:12px;">取消</button>
          <button id="gbf-d-ok" style="padding:5px 12px;border:none;border-radius:4px;
            background:#00bfff;color:#000;cursor:pointer;font-weight:bold;font-size:12px;">确定</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const ni = overlay.querySelector('#gbf-d-name');
    const ui = overlay.querySelector('#gbf-d-url');
    overlay.querySelector('#gbf-d-fill').onclick   = () => { ni.value = document.title||''; ui.value = location.hash||location.href; };
    overlay.querySelector('#gbf-d-cancel').onclick = removeDialog;
    overlay.querySelector('#gbf-d-ok').onclick     = () => {
      const n=ni.value.trim(), u=ui.value.trim();
      if (!n||!u) return;
      removeDialog(); onConfirm(n,u);
    };
    overlay.addEventListener('click', e => { if (e.target===overlay) removeDialog(); });
    ni.focus(); ni.select();
  }
  function removeDialog() { document.getElementById('gbf-dialog-overlay')?.remove(); }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

  /* ─── settings ──────────────────────────────────── */
  function toggleSettings(el) {
    if (state.idleActive) return;
    const box = el.querySelector('.settings');
    settingsOpen = !settingsOpen;
    if (!settingsOpen) { box.innerHTML = ''; return; }
    box.innerHTML = `
      <div class="row">透明度 <span id="opv">${state.opacity}</span>
        <input id="op" type="range" min="10" max="100" value="${state.opacity}"></div>
      <div class="row">待机 <span id="iv">${state.idleSec}</span>s
        <input id="idle" type="range" min="1" max="15" value="${state.idleSec}"></div>`;
    box.querySelector('#op').oninput   = () => { state.opacity = +box.querySelector('#op').value;   box.querySelector('#opv').textContent=state.opacity;   setXY(el); save(); };
    box.querySelector('#idle').oninput = () => { state.idleSec = +box.querySelector('#idle').value; box.querySelector('#iv').textContent=state.idleSec; save(); };
  }

  /* ─── create ────────────────────────────────────── */
  function create() {
    if (document.getElementById('gbf-panel')) return;
    const el = document.createElement('div');
    el.id = 'gbf-panel';
    el.innerHTML = `
      <div class="title">GBF Tools</div>
      <div class="panel-content">
        <div class="tabs">
          <span data-tab="main">主</span>
          <span data-tab="raid">副本</span>
        </div>
        <div class="menu"></div>
        <div class="settings"></div>
      </div>`;
    document.body.appendChild(el);
    setXY(el);
    syncViewport(el);
    setXY(el);
    updateIdleClass(el);
    bind(el);
    render(el);
    if (state.idleMode && state.docked) startIdleTimer(el, true);
  }

  /* ─── bind ──────────────────────────────────────── */
  function bind(el) {
    const title = el.querySelector('.title');
    let dragging = false;
    let moved = false;
    let ox=0, oy=0, osx=0, osy=0, downX=0, downY=0;

    function dragBlocked(target) {
      return !!(target.closest && target.closest('input,button,select,textarea,#gbf-dialog-overlay,#gbf-ctx,.settings'));
    }

    el.addEventListener('mousedown', e => {
      if (e.button !== 0 || Date.now() < preventDragUntil) return;
      if (dragBlocked(e.target)) return;
      if (state.idleActive) exitIdleActive(el);
      dragging = true;
      moved = false;
      ox=e.clientX; oy=e.clientY; downX=e.clientX; downY=e.clientY;
      osx=state.x;  osy=state.y;
      document.body.style.userSelect = 'none';
      clearIdleTimer();
      e.preventDefault();
    });

    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      state.x = osx + (e.clientX - ox);
      state.y = osy + (e.clientY - oy);
      if (Math.abs(e.clientX - downX) >= 3 || Math.abs(e.clientY - downY) >= 3) moved = true;
      // 直接写，绕过任何 transition，拖动零延迟
      el.style.transform = `translate(${state.x}px,${state.y}px)`;
    });

    window.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = '';
      if (moved) suppressClickUntil = Date.now() + 250;
      clampAndDock(el);
      setXY(el);
      updateIdleClass(el);
      // FIX-逻辑: 拖动松手后如果满足条件就启动计时（不管鼠标是否在面板上，因为刚放手）
      if (state.idleMode && state.docked) startIdleTimer(el, !mouseOnPanel);
      save();
    });

    /* ── hover 展开（右边不抽搐版）────────────────── */
    el.addEventListener('mouseenter', () => {
      mouseOnPanel = true;
      if (!state.idleActive) { clearIdleTimer(); return; }

      // 先设好位置，再加 class，避免展开瞬间位置错位触发 mouseleave
      const cw = document.documentElement.clientWidth;
      const ch = document.documentElement.clientHeight;

      if (state.dockEdge === 'right') {
        // 右边：禁用 transition 后同帧完成位移+展开，避免中间态触发 mouseleave 抽搐
        if (panelNaturalH > 0) el.style.height = panelNaturalH + 'px';
        el.style.transition = 'none';
        el.classList.add('hover-show');
        setRawXY(el, cw - PANEL_W, state.y);
        void el.offsetWidth;
        el.style.transition = '';
        preventIdleUntil = Date.now() + 700;
        return;
      } else if (state.dockEdge === 'left') {
        // 左边：位置不动，固定高度
        if (panelNaturalH > 0) el.style.height = panelNaturalH + 'px';
        setRawXY(el, 0, state.y);
      } else if (state.dockEdge === 'bottom') {
        // 下边：先加 class 展开内容，下一帧再拿真实高度后上移
        el.classList.add('hover-show');
        requestAnimationFrame(() => {
          const h = el.getBoundingClientRect().height;
          setRawXY(el, state.x, ch - h);
        });
        preventIdleUntil = Date.now() + 700;
        preventDragUntil  = Date.now() + 700; // bottom 需要等 rAF 完成才能拖
        return;
      }
      // top / left：先移位再展开，不锁拖动
      el.classList.add('hover-show');
      preventIdleUntil = Date.now() + 700;
    });

    el.addEventListener('mouseleave', () => {
      mouseOnPanel = false;
      el.classList.remove('hover-show');

      if (state.idleActive) {
        if ((state.dockEdge === 'left' || state.dockEdge === 'right') && panelNaturalH > 0) {
          el.style.height = panelNaturalH + 'px';
        } else {
          el.style.height = '';
        }
        // 恢复窄条坐标
        const cw = document.documentElement.clientWidth;
        const ch = document.documentElement.clientHeight;
        if      (state.dockEdge === 'left')   state.x = 0;
        else if (state.dockEdge === 'right')  state.x = Math.max(0, cw - IDLE_THIN);
        else if (state.dockEdge === 'top')    state.y = 0;
        else if (state.dockEdge === 'bottom') state.y = Math.max(0, ch - IDLE_THIN);
        setXY(el);
      } else if (state.idleMode && state.docked) {
        el.style.height = '';
        startIdleTimer(el);
      }
    });

    title.addEventListener('click', e => {
      if (e.button !== 0) return;
      if (Math.abs(e.clientX-downX) < 3 && Math.abs(e.clientY-downY) < 3)
        toggleIdleMode(el);
    });
    title.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (state.idleActive) exitIdleActive(el);
      toggleSettings(el);
    });
    el.addEventListener('click', e => { if (state.idleActive && e.target===el) exitIdleActive(el); });
    window.addEventListener('resize', () => scheduleViewportSync(el));
  }

  /* ─── style ─────────────────────────────────────── */
  function style() {
    const s = document.createElement('style');
    s.innerHTML = `
#gbf-panel {
  position:fixed;top:0;left:0;width:${PANEL_W}px;
  background:#1e1e1e;color:#fff;font-size:12px;
  z-index:999999;border-radius:6px;
  box-shadow:0 6px 18px rgba(0,0,0,.3);
  overflow:hidden;
  /* 只对 width/height/border-radius/box-shadow 加过渡，transform 不加（防拖动惯性） */
  transition:width .3s ease,height .3s ease,border-radius .3s ease,box-shadow .3s ease;
}
.title {
  background:#333;padding:6px;text-align:center;cursor:grab;
  border-radius:0 0 4px 4px;
  font-weight:bold;user-select:none;
  /* title 自身的 transform 过渡用于左右收缩动画 */
  transition:color .3s,background .3s,opacity .3s,height .3s,padding .3s,transform .3s ease;
}
.title.idle-mode-on{color:#00bfff;background:linear-gradient(135deg,#333,#004466);}

/* panel-content: 左右用 scaleX，上下用 scaleY，配合 overflow:hidden 实现真实压缩 */
.panel-content{
  transition:transform .3s ease,opacity .3s;
  padding-top:3px;
  transform-origin:top center; /* 上下压缩时从顶部收缩 */
}

.tabs{display:flex;gap:4px;background:#1e1e1e;padding:0 3px 3px;}
.tabs span{flex:1;text-align:center;padding:5px;background:#444;cursor:pointer;border-radius:4px;}
.tabs span.active{background:#fff;color:#000;}
.menu{padding:0;}
.item{display:block;width:100%;box-sizing:border-box;background:#555;margin:0;padding:6px;text-align:center;cursor:pointer;border-radius:0;border-bottom:2px solid #1e1e1e;transition:background .2s;}
.item:last-child{border-bottom:none;}
.item:hover{background:#666;}
.add-btn{background:#2a4a2a;color:#8f8;}
.add-btn:hover{background:#3a5a3a;}
.settings{background:#222;padding:6px;}
.settings:empty{display:none;}
.row{margin:6px 0;font-size:11px;}
.row input[type=range]{width:100%;margin-top:3px;}
#gbf-ctx .ctx-item{padding:6px 14px;cursor:pointer;}
#gbf-ctx .ctx-item:hover{background:#444;}
#gbf-ctx .ctx-del{color:#f88;}

/* ── 左吸附：宽度压到 IDLE_THIN，内容向左飞出 ── */
#gbf-panel.idle-left{
  width:${IDLE_THIN}px !important;
  border-radius:0 5px 5px 0;
  background:linear-gradient(90deg,rgba(0,191,255,.9),rgba(0,191,255,.5)) !important;
  box-shadow:3px 0 10px rgba(0,191,255,.4),inset 0 0 8px rgba(255,255,255,.1);
}
#gbf-panel.idle-left .panel-content{transform:translateX(-100%);opacity:0;}
#gbf-panel.idle-left .title{transform:translateX(-100%);opacity:0;height:0;padding:0;}

/* ── 右吸附：宽度压到 IDLE_THIN，内容向右飞出 ── */
#gbf-panel.idle-right{
  width:${IDLE_THIN}px !important;
  border-radius:5px 0 0 5px;
  background:linear-gradient(270deg,rgba(0,191,255,.9),rgba(0,191,255,.5)) !important;
  box-shadow:-3px 0 10px rgba(0,191,255,.4),inset 0 0 8px rgba(255,255,255,.1);
}
#gbf-panel.idle-right .panel-content{transform:translateX(100%);opacity:0;}
#gbf-panel.idle-right .title{transform:translateX(100%);opacity:0;height:0;padding:0;}

/* ── 上吸附：高度压到 IDLE_THIN，内容用 scaleY 向上收缩 ── */
#gbf-panel.idle-top{
  height:${IDLE_THIN}px !important;
  border-radius:0 0 5px 5px;
  background:linear-gradient(180deg,rgba(0,191,255,.9),rgba(0,191,255,.5)) !important;
  box-shadow:0 3px 10px rgba(0,191,255,.4),inset 0 0 8px rgba(255,255,255,.1);
}
#gbf-panel.idle-top .panel-content{transform:scaleY(0);opacity:0;transform-origin:top center;}
#gbf-panel.idle-top .title{transform:scaleY(0);opacity:0;height:0;padding:0;}

/* ── 下吸附：高度压到 IDLE_THIN，内容用 scaleY 向下收缩 ── */
#gbf-panel.idle-bottom{
  height:${IDLE_THIN}px !important;
  border-radius:5px 5px 0 0;
  background:linear-gradient(0deg,rgba(0,191,255,.9),rgba(0,191,255,.5)) !important;
  box-shadow:0 -3px 10px rgba(0,191,255,.4),inset 0 0 8px rgba(255,255,255,.1);
}
#gbf-panel.idle-bottom .panel-content{transform:scaleY(0);opacity:0;transform-origin:bottom center;}
#gbf-panel.idle-bottom .title{transform:scaleY(0);opacity:0;height:0;padding:0;}

@keyframes idle-pulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3)}}
#gbf-panel.idle-left,#gbf-panel.idle-right,
#gbf-panel.idle-top,#gbf-panel.idle-bottom{animation:idle-pulse 2s ease-in-out infinite;}

/* ── hover 展开 ── */
#gbf-panel.hover-show.idle-left,
#gbf-panel.hover-show.idle-right {width:${PANEL_W}px !important;}
#gbf-panel.hover-show.idle-top,
#gbf-panel.hover-show.idle-bottom{height:auto !important;}
#gbf-panel.hover-show .panel-content{
  transform:none !important;
  opacity:1 !important;
  padding:3px 0 0 !important;
}
#gbf-panel.hover-show .title{
  transform:none !important;
  opacity:1 !important;height:auto !important;padding:6px !important;
}
#gbf-panel.hover-show{
  border-radius:6px !important;
  background:#1e1e1e !important;
  box-shadow:0 6px 18px rgba(0,0,0,.3) !important;
  animation:none !important;
}`;
    document.head.appendChild(s);
  }

  function init() { load(); style(); create(); }
  init();
})();
