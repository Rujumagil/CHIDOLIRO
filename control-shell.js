(()=>{
  'use strict';
  const SESSION_KEY='chidoliro_kitchen_session';
  const MODULES={
    '/pos.html':{key:'pos',title:'Punto de venta',icon:'📱',dock:'POS',badge:'openTables'},
    '/cocina.html':{key:'kitchen',title:'Comandas de cocina',icon:'🔥',dock:'Cocina',badge:'activeOrders'},
    '/bebidas.html':{key:'bar',title:'Bebidas y barra',icon:'🥤',dock:'Bebidas'},
    '/reservaciones.html':{key:'reservations',title:'Reservaciones',icon:'📅',dock:'Reservas',badge:'pendingReservations'},
    '/mesas.html':{key:'tables',title:'Mesas y QR',icon:'🔳',dock:'Mesas',badge:'openTables'},
    '/caja.html':{key:'cash',title:'Caja y corte',icon:'💳',dock:'Caja'},
    '/inventario.html':{key:'inventory',title:'Inventario y costos',icon:'📦',dock:'Inventario'},
    '/menu-admin.html':{key:'menu',title:'Menú',icon:'🍽️',dock:'Menú'},
    '/menu-config.html':{key:'menu',title:'Menú avanzado',icon:'⚙️',dock:'Config.'},
    '/actividad.html':{key:'activity',title:'Actividad',icon:'🧾',dock:'Actividad'},
    '/usuarios.html':{key:'staff',title:'Personal y accesos',icon:'👥',dock:'Personal'},
    '/entregas.html':{key:'pos',title:'Entregas',icon:'✅',dock:'Entregas'}
  };
  const QUICK=['/pos.html','/cocina.html','/reservaciones.html','/mesas.html','/caja.html'];
  const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  let activePath=''; let historyPushed=false;

  function injectStyles(){
    if($('#chidoliroControlStyles')) return;
    const style=document.createElement('style'); style.id='chidoliroControlStyles'; style.textContent=`
      :root{--controlDock:78px}
      body.controlMode .main{padding-bottom:calc(72px + env(safe-area-inset-bottom))}
      body.controlMode .top .brand small{color:#9edbd5!important}
      .controlPulse{display:none;position:sticky;top:66px;z-index:25;max-width:1500px;margin:0 auto;padding:8px 12px 0;gap:7px;overflow:auto;scrollbar-width:none}.controlPulse.show{display:flex}.controlPulse::-webkit-scrollbar{display:none}.controlPulseItem{border:1px solid var(--line);background:white;color:var(--ink);border-radius:999px;padding:8px 11px;font-size:.64rem;font-weight:900;white-space:nowrap;box-shadow:0 6px 20px rgba(5,27,31,.05)}.controlPulseItem.warn{background:#fff0df;color:#8d4e17}.controlPulseItem.ok{background:#e5f1ea;color:#226c43}
      .controlDock{position:fixed;z-index:320;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(calc(100% - 16px),760px);display:none;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px;padding:6px;border-radius:21px;background:rgba(250,247,240,.97);backdrop-filter:blur(18px);box-shadow:0 18px 55px rgba(0,0,0,.24);border:1px solid rgba(21,39,40,.08)}.controlDock.show{display:grid}.controlDock button{position:relative;border:0;background:transparent;color:#5b6967;border-radius:14px;min-height:54px;padding:4px 2px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:2px;font-size:.55rem;font-weight:900}.controlDock button.active{background:var(--ocean);color:white}.controlDock .dockIcon{font-size:.95rem}.controlDock .dockBadge{position:absolute;top:4px;right:8px;min-width:18px;height:18px;border-radius:999px;padding:0 5px;display:none;place-items:center;background:var(--amber);color:#25160b;font-size:.52rem;font-weight:950}.controlDock .dockBadge.show{display:grid}
      .controlWorkspace{position:fixed;inset:0;z-index:900;background:#edf0eb;display:none;flex-direction:column;color:var(--ink)}.controlWorkspace.show{display:flex}.workspaceBar{flex:0 0 auto;background:#04171b;color:white;padding:8px 10px calc(8px + env(safe-area-inset-top));box-shadow:0 8px 26px rgba(0,0,0,.18);position:relative;z-index:3}.workspaceTop{display:flex;align-items:center;gap:8px;max-width:1600px;margin:auto}.workspaceBack,.workspaceExternal,.workspaceHome{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:white;border-radius:12px;height:40px;padding:0 11px;font-weight:900}.workspaceTitle{min-width:0;flex:1}.workspaceTitle b{display:block;font-size:.84rem}.workspaceTitle small{display:block;color:#9edbd5;font-size:.58rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;margin-top:2px}.workspaceTabs{max-width:1600px;margin:7px auto 0;display:flex;gap:6px;overflow:auto;scrollbar-width:none}.workspaceTabs::-webkit-scrollbar{display:none}.workspaceTab{position:relative;border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.05);color:#c8dcda;border-radius:999px;min-height:34px;padding:0 11px;white-space:nowrap;font-size:.61rem;font-weight:900}.workspaceTab.active{background:white;color:var(--ocean)}.workspaceTab .miniBadge{display:inline-grid;place-items:center;min-width:17px;height:17px;margin-left:4px;padding:0 4px;border-radius:999px;background:var(--amber);color:#25160b;font-size:.5rem}.workspaceFrameWrap{position:relative;flex:1;min-height:0}.workspaceFrame{width:100%;height:100%;border:0;background:#edf0eb}.workspaceLoading{position:absolute;inset:0;display:grid;place-items:center;background:#edf0eb;color:var(--muted);font-size:.75rem;font-weight:900;z-index:2}.workspaceLoading.hide{display:none}.controlModuleTag{display:inline-flex;align-items:center;gap:5px;margin-left:6px;padding:5px 8px;border-radius:999px;background:#e8f0ed;color:var(--ocean);font-size:.56rem;font-weight:900}
      @media(max-width:700px){body.controlMode .main{padding-bottom:calc(90px + env(safe-area-inset-bottom))}.controlPulse{top:64px;padding:7px 9px 0}.controlDock{grid-template-columns:repeat(6,minmax(0,1fr));width:calc(100% - 12px);bottom:max(6px,env(safe-area-inset-bottom));border-radius:19px}.controlDock button{min-height:50px;font-size:.5rem}.controlDock .dockBadge{right:4px}.workspaceBar{padding-left:7px;padding-right:7px}.workspaceBack,.workspaceExternal,.workspaceHome{height:38px;padding:0 9px}.workspaceExternal{display:none}.workspaceTitle b{font-size:.78rem}.workspaceTabs{margin-top:6px}.workspaceTab{min-height:32px}.controlWorkspace{height:100dvh}.topActions #refresh{display:none}}
      @media(min-width:1100px){.controlDock{width:min(calc(100% - 20px),880px)}.controlDock button{font-size:.59rem}}
    `; document.head.appendChild(style);
  }

  function rebrand(){
    document.title='CHIDOLIRO Control';
    document.body.classList.add('controlMode');
    $$('.loginCard h1').forEach(e=>e.textContent='CHIDOLIRO Control');
    const loginCopy=$('.loginCard p'); if(loginCopy) loginCopy.textContent='Un solo acceso para pedidos, mesas, reservaciones, caja y operación del restaurante.';
    $$('.brand small').forEach((e,i)=>{ if(i===0)e.textContent='CONTROL OPERATIVO'; else e.textContent='CHIDOLIRO CONTROL'; });
    const eye=$('.eyebrow'); if(eye) eye.textContent='Control operativo en tiempo real';
    const footer=$('.footerNote'); if(footer) footer.textContent='CHIDOLIRO Control · operación conectada en una sola app';
  }

  function allowedPaths(){
    const set=new Set();
    $$('#modules a.module').forEach(a=>{ try{const p=new URL(a.href,location.href).pathname;if(MODULES[p])set.add(p);}catch(_){}});
    return set;
  }
  function isAllowed(path){
    if(!sessionStorage.getItem(SESSION_KEY)) return false;
    const allowed=allowedPaths();
    return allowed.has(path) || (path==='/entregas.html'&&allowed.has('/pos.html'));
  }

  function ensureDock(){
    if($('#controlDock')) return;
    const nav=document.createElement('nav'); nav.id='controlDock'; nav.className='controlDock'; nav.setAttribute('aria-label','CHIDOLIRO Control');
    nav.innerHTML='<button type="button" data-control-home><span class="dockIcon">⌂</span><span>Inicio</span></button>'+QUICK.map(path=>{const m=MODULES[path];return `<button type="button" data-control-path="${path}"><span class="dockIcon">${m.icon}</span><span>${m.dock}</span><span class="dockBadge" data-badge-for="${path}"></span></button>`}).join('');
    document.body.appendChild(nav);
    nav.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-control-home')){closeWorkspace();scrollTo({top:0,behavior:'smooth'});return;}const path=b.dataset.controlPath;if(path)openWorkspace(path);});
  }

  function ensurePulse(){
    if($('#controlPulse')) return;
    const pulse=document.createElement('div');pulse.id='controlPulse';pulse.className='controlPulse';
    const top=$('#appView .top'); if(top) top.insertAdjacentElement('afterend',pulse);
  }

  function ensureWorkspace(){
    if($('#controlWorkspace')) return;
    const w=document.createElement('section');w.id='controlWorkspace';w.className='controlWorkspace';w.innerHTML=`<div class="workspaceBar"><div class="workspaceTop"><button class="workspaceBack" type="button" aria-label="Volver">←</button><div class="workspaceTitle"><b id="workspaceTitle">Módulo</b><small>CHIDOLIRO Control</small></div><button class="workspaceHome" type="button">Inicio</button><button class="workspaceExternal" type="button">↗</button></div><div class="workspaceTabs" id="workspaceTabs"></div></div><div class="workspaceFrameWrap"><div class="workspaceLoading" id="workspaceLoading">Abriendo módulo…</div><iframe class="workspaceFrame" id="workspaceFrame" title="Módulo CHIDOLIRO"></iframe></div>`;
    document.body.appendChild(w);
    $('.workspaceBack',w).onclick=()=>closeWorkspace();
    $('.workspaceHome',w).onclick=()=>closeWorkspace();
    $('.workspaceExternal',w).onclick=()=>{if(activePath)window.open(activePath,'_blank','noopener');};
    $('#workspaceFrame').addEventListener('load',()=>$('#workspaceLoading')?.classList.add('hide'));
    $('#workspaceTabs').addEventListener('click',e=>{const b=e.target.closest('[data-workspace-path]');if(b)openWorkspace(b.dataset.workspacePath,false);});
  }

  function renderWorkspaceTabs(){
    const tabs=$('#workspaceTabs'); if(!tabs)return;
    const allowed=allowedPaths();
    const ordered=QUICK.filter(p=>allowed.has(p));
    if(allowed.has('/bebidas.html')) ordered.splice(Math.min(2,ordered.length),0,'/bebidas.html');
    tabs.innerHTML=ordered.map(path=>{const m=MODULES[path];return `<button class="workspaceTab ${path===activePath?'active':''}" type="button" data-workspace-path="${path}">${m.icon} ${m.dock}<span class="miniBadge" data-tab-badge="${path}" style="display:none"></span></button>`}).join('');
    updateBadges();
  }

  function openWorkspace(path,push=true){
    if(!MODULES[path]||!isAllowed(path)) return;
    ensureWorkspace(); activePath=path;
    const m=MODULES[path]; $('#workspaceTitle').textContent=m.title; $('#workspaceLoading')?.classList.remove('hide');
    const frame=$('#workspaceFrame'); if(frame.getAttribute('src')!==path)frame.src=path;
    $('#controlWorkspace').classList.add('show'); document.body.style.overflow='hidden';
    renderWorkspaceTabs(); updateDockState();
    if(push && !historyPushed){history.pushState({chidoliroControl:path},'',`${location.pathname}?module=${encodeURIComponent(path.slice(1,-5))}`);historyPushed=true;}
  }
  function closeWorkspace(fromPop=false){
    const w=$('#controlWorkspace'); if(w)w.classList.remove('show'); document.body.style.overflow=''; activePath=''; updateDockState();
    if(!fromPop&&historyPushed){history.back();} else {historyPushed=false; if(location.search.includes('module='))history.replaceState({},'',location.pathname);}
  }
  function updateDockState(){
    const dock=$('#controlDock'); if(!dock)return;
    dock.querySelectorAll('button').forEach(b=>b.classList.toggle('active',activePath?b.dataset.controlPath===activePath:b.hasAttribute('data-control-home')));
  }

  function badgeNumber(id){
    const el=document.getElementById(id); if(!el)return 0;
    const n=Number(String(el.textContent||'').replace(/[^0-9.-]/g,'')); return Number.isFinite(n)?n:0;
  }
  function updateBadges(){
    const openTables=badgeNumber('openTables'),activeOrders=badgeNumber('activeOrders'),pendingReservations=badgeNumber('pendingReservations');
    const values={'/pos.html':openTables,'/cocina.html':activeOrders,'/mesas.html':openTables,'/reservaciones.html':pendingReservations};
    Object.entries(values).forEach(([path,n])=>{
      $$(`[data-badge-for="${path}"]`).forEach(el=>{el.textContent=n;el.classList.toggle('show',n>0)});
      $$(`[data-tab-badge="${path}"]`).forEach(el=>{el.textContent=n;el.style.display=n>0?'inline-grid':'none'});
    });
  }

  function updatePulse(){
    ensurePulse(); const p=$('#controlPulse'); if(!p)return;
    const orders=badgeNumber('activeOrders'),ready=badgeNumber('readyOrders'),reservations=badgeNumber('pendingReservations'),tables=badgeNumber('openTables');
    const cash=String($('#cashStatus')?.textContent||'').trim().toLowerCase();
    const items=[];
    if(orders>0)items.push(`<button class="controlPulseItem warn" data-pulse-path="/cocina.html">🔥 ${orders} comandas activas</button>`);
    if(ready>0)items.push(`<button class="controlPulseItem ok" data-pulse-path="/pos.html">✅ ${ready} listas para entregar</button>`);
    if(reservations>0)items.push(`<button class="controlPulseItem warn" data-pulse-path="/reservaciones.html">📅 ${reservations} reservas pendientes</button>`);
    if(tables>0)items.push(`<button class="controlPulseItem" data-pulse-path="/pos.html">🍽 ${tables} mesas abiertas</button>`);
    if(cash==='cerrada')items.push(`<button class="controlPulseItem warn" data-pulse-path="/caja.html">💳 Caja cerrada</button>`);
    p.innerHTML=items.join('');p.classList.toggle('show',items.length>0);
    p.querySelectorAll('[data-pulse-path]').forEach(b=>b.onclick=()=>openWorkspace(b.dataset.pulsePath));
  }

  function syncVisibility(){
    ensureDock(); const app=$('#appView'); const logged=app&&!app.classList.contains('hidden')&&!!sessionStorage.getItem(SESSION_KEY);
    $('#controlDock')?.classList.toggle('show',logged);
    $('#controlPulse')?.classList.toggle('show',logged&&$('#controlPulse')?.children.length>0);
    if(logged){renderWorkspaceTabs();updateBadges();updatePulse();} else if($('#controlWorkspace')?.classList.contains('show'))closeWorkspace(true);
  }

  function interceptLinks(){
    document.addEventListener('click',e=>{
      if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      const a=e.target.closest('a[href]');if(!a||a.target==='_blank'||a.closest('#controlWorkspace'))return;
      let url;try{url=new URL(a.href,location.href);}catch(_){return;}if(url.origin!==location.origin)return;
      const path=url.pathname;if(!MODULES[path]||!isAllowed(path))return;
      e.preventDefault();openWorkspace(path);
    },true);
  }

  function observe(){
    const obs=new MutationObserver(()=>{syncVisibility();updateBadges();updatePulse();});
    obs.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  }

  function restoreModuleFromQuery(){
    const q=new URLSearchParams(location.search).get('module');if(!q)return;
    const path=`/${q.replace(/[^a-z0-9-]/gi,'')}.html`;
    const tryOpen=()=>{if(isAllowed(path)){historyPushed=true;openWorkspace(path,false);}else setTimeout(tryOpen,250);};setTimeout(tryOpen,400);
  }

  function start(){
    injectStyles();rebrand();ensureDock();ensurePulse();ensureWorkspace();interceptLinks();observe();syncVisibility();updateDockState();restoreModuleFromQuery();
    window.addEventListener('popstate',()=>{if($('#controlWorkspace')?.classList.contains('show'))closeWorkspace(true);});
    if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}),{once:true});
    setInterval(()=>{updateBadges();updatePulse();},5000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();