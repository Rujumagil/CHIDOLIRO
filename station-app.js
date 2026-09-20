(()=>{
const STATION=(document.body.dataset.station||'kitchen').toLowerCase();
const IS_BAR=STATION==='bar';
const PERMISSION=IS_BAR?'bar':'kitchen';
const TITLE=IS_BAR?'Barra de bebidas':'Cocina';
const SUBTITLE=IS_BAR?'BEBIDAS · UNIDAD POR UNIDAD':'COCINA · PLATILLO POR PLATILLO';
const ICON=IS_BAR?'◒':'♨';
const KEY='chidoliro_kitchen_session';
const state={session:sessionStorage.getItem(KEY)||localStorage.getItem(KEY)||'',orders:[],filter:'active',timer:null,profile:null,first:true,lastNew:new Set()};
const labels={submitted:'Nuevo',accepted:'Aceptado',preparing:'Preparando',ready:'Listo',delivered:'Entregado',cancelled:'Cancelado'};
const next={submitted:['accepted','Aceptar'],accepted:['preparing','Preparar'],preparing:['ready','Marcar listo']};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style=document.createElement('style');style.textContent=`:root{--o:#082a31;--t:#137a7e;--a:#7bc9c4;--c:#f6f0e7;--am:#f09a52;--i:#152728;--m:#6b7977;--l:rgba(21,39,40,.12);--ok:#27784a;--d:#b43b3b}*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#04171b;color:white}button,input{font:inherit}.hidden{display:none!important}.login{min-height:100dvh;display:grid;place-items:center;padding:22px;background:radial-gradient(circle at 50% -10%,#0f5960,#082d34 36%,#04171b 74%)}.loginCard{width:min(100%,430px);background:var(--c);color:var(--i);border-radius:28px;padding:28px}.brand{display:flex;align-items:center;gap:11px}.brand img{width:58px;height:58px;object-fit:contain}.brand b{display:block;letter-spacing:.11em}.brand small{display:block;color:var(--t);font-size:.63rem;font-weight:900;letter-spacing:.09em}.loginCard h1{font-size:2rem;margin:26px 0 6px}.loginCard p{color:var(--m);font-size:.8rem;line-height:1.5}.field{display:grid;gap:5px;margin-top:9px}.field span{font-size:.66rem;font-weight:900}.field input{height:50px;border:1px solid var(--l);border-radius:14px;padding:0 12px}.pin{text-align:center;font-size:1.2rem;font-weight:950;letter-spacing:.23em}.loginBtn{width:100%;height:50px;border:0;border-radius:14px;background:var(--o);color:white;font-weight:950;margin-top:12px}.error{min-height:22px;color:var(--d);font-size:.72rem;font-weight:850;text-align:center;margin-top:8px}.app{min-height:100dvh;background:#edf0eb;color:var(--i)}.top{position:sticky;top:0;z-index:30;background:#04171b;color:white;padding:10px 13px}.topRow{max-width:1500px;margin:auto;display:flex;align-items:center;gap:10px}.top .brand img{width:44px;height:44px}.top .brand small{color:var(--a)}.topActions{margin-left:auto;display:flex;gap:7px}.topActions a,.topActions button{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:white;border-radius:11px;min-height:39px;padding:0 10px;font-weight:850;text-decoration:none;display:flex;align-items:center}.main{max-width:1500px;margin:auto;padding:13px 11px 38px}.hero{background:linear-gradient(135deg,#082a31,#0d4b51);border-radius:22px;padding:18px;color:white;display:flex;gap:12px;align-items:center}.heroIcon{width:52px;height:52px;border-radius:16px;background:rgba(255,255,255,.1);display:grid;place-items:center;font-size:1.45rem}.hero h1{margin:0;font-size:1.55rem}.hero p{margin:4px 0 0;color:#c4dad6;font-size:.69rem}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.stat{background:white;border:1px solid var(--l);border-radius:16px;padding:12px}.stat small{display:block;color:var(--m);font-size:.58rem;font-weight:900;text-transform:uppercase}.stat strong{display:block;font-size:1.4rem;margin-top:5px}.toolbar{display:flex;gap:7px;align-items:center;overflow:auto;padding:2px 0 10px}.filter{border:1px solid var(--l);background:white;color:var(--i);border-radius:999px;padding:8px 12px;font-size:.68rem;font-weight:900;white-space:nowrap}.filter.active{background:var(--o);color:white}.updated{margin-left:auto;color:var(--m);font-size:.61rem;white-space:nowrap}.orders{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;align-items:start}.order{background:white;border:1px solid var(--l);border-radius:20px;overflow:hidden}.orderHead{display:flex;gap:9px;align-items:flex-start;padding:13px 14px;border-bottom:1px solid var(--l)}.orderNo{font-size:1.3rem;font-weight:950}.orderMeta{font-size:.62rem;color:var(--m);margin-top:3px}.elapsed{margin-left:auto;border-radius:999px;background:#eef1ed;padding:6px 8px;font-size:.63rem;font-weight:900}.elapsed.warn{background:#fff0df;color:#9a591d}.elapsed.late{background:#fde5e5;color:#a23e3e}.body{padding:12px 14px}.customer{font-size:.73rem;font-weight:900;margin-bottom:9px}.customer span{color:var(--t)}.waiter{font-size:.61rem;color:var(--m);margin-top:2px}.items{display:grid;gap:9px}.item{border:1px solid var(--l);border-radius:14px;padding:10px}.itemTop{display:grid;grid-template-columns:34px 1fr auto;gap:8px;align-items:start}.unit{width:34px;height:34px;border-radius:10px;background:var(--o);color:white;display:grid;place-items:center;font-size:.67rem;font-weight:950}.item b{font-size:.8rem;line-height:1.2}.unitLabel{display:inline-flex;margin-left:5px;border-radius:999px;background:#eef2ed;color:var(--t);padding:2px 6px;font-size:.52rem;font-weight:950}.opts{font-size:.61rem;color:var(--m);line-height:1.4;margin-top:3px}.badge{border-radius:999px;padding:5px 7px;font-size:.54rem;font-weight:950;background:#edf0eb}.s-submitted{background:#fff0df;color:#9a591d}.s-accepted{background:#e7eef2;color:#24596a}.s-preparing{background:#e4f0ed;color:#1d6d5d}.s-ready{background:#dff1e5;color:#247444}.s-delivered{background:#eee;color:#68716c}.s-cancelled{background:#fde5e5;color:#a23e3e}.timeRow{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.time{border-radius:999px;background:#f0f2ee;padding:4px 7px;font-size:.55rem;color:var(--m);font-weight:800}.itemAction{width:100%;min-height:40px;border:0;border-radius:11px;background:var(--am);color:#25160b;font-weight:950;margin-top:8px}.itemAction.ready{background:#e4f0e8;color:var(--ok)}.notes{margin-top:9px;padding:8px 9px;border-radius:11px;background:#fff8ed;border:1px solid #f0dcc0;font-size:.64rem}.empty{grid-column:1/-1;background:white;border:1px dashed #c8d0ca;border-radius:20px;padding:46px 20px;text-align:center;color:var(--m)}.empty strong{display:block;color:var(--i);margin-bottom:5px}.toast{position:fixed;left:50%;bottom:18px;z-index:100;transform:translate(-50%,20px);opacity:0;background:#04171b;color:white;padding:10px 13px;border-radius:12px;font-size:.7rem;font-weight:850;transition:.2s}.toast.show{opacity:1;transform:translate(-50%,0)}@media(max-width:1050px){.orders{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){.orders{grid-template-columns:1fr}.summary{grid-template-columns:1fr 1fr}.main{padding:9px 8px 28px}.topActions a{display:none}.updated{display:none}.hero{border-radius:18px}}`;
document.head.appendChild(style);
const brandStyle=document.createElement('style');brandStyle.textContent=`
:root{--o:#0f52ba;--t:#0f52ba;--a:#dce9ff;--c:#f7f1e5;--am:#d89a43;--i:#17324d;--m:#74818a;--l:rgba(15,82,186,.13);--ok:#2f7753;--d:#b84a45}
html,body{background:#f7f1e5;color:#17324d}
.login{background:linear-gradient(145deg,#f7f1e5,#eef4ff)}
.login:before{content:"";position:fixed;inset:0;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='980' height='320' viewBox='0 0 980 320'%3E%3Cg fill='none' stroke='%230F52BA' stroke-width='1.2' opacity='.08'%3E%3Cpath d='M-40 44C75 10 155 76 270 43s214-24 329 10 209 28 324-8 181-21 243 5'/%3E%3Cpath d='M-20 95C92 59 170 125 285 92s213-24 330 10 210 28 324-8 181-21 243 5'/%3E%3Cpath d='M-36 148c113-35 192 31 306-2s213-24 330 10 210 28 325-8 180-21 242 5'/%3E%3C/g%3E%3C/svg%3E");background-size:auto 320px;background-repeat:repeat;opacity:.65}
.loginCard{position:relative;background:#fffdf8;border:1px solid rgba(15,82,186,.14);border-radius:24px;box-shadow:0 18px 46px rgba(29,67,117,.14)}
.brand small{color:#0f52ba}
.loginBtn{background:#0f52ba}
.field input{background:#fff;border-color:rgba(15,82,186,.15);color:#17324d}
.field input:focus{outline:none;border-color:rgba(15,82,186,.42);box-shadow:0 0 0 3px rgba(15,82,186,.07)}
.app{background:#f7f1e5;color:#17324d;position:relative;isolation:isolate}
.app:before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='980' height='320' viewBox='0 0 980 320'%3E%3Cg fill='none' stroke='%230F52BA' stroke-width='1.2' opacity='.08'%3E%3Cpath d='M-40 44C75 10 155 76 270 43s214-24 329 10 209 28 324-8 181-21 243 5'/%3E%3Cpath d='M-20 95C92 59 170 125 285 92s213-24 330 10 210 28 324-8 181-21 243 5'/%3E%3Cpath d='M-36 148c113-35 192 31 306-2s213-24 330 10 210 28 325-8 180-21 242 5'/%3E%3Cpath d='M-18 204c112-36 191 30 305-3s213-24 330 10 210 28 325-8 180-21 242 5'/%3E%3C/g%3E%3C/svg%3E");background-size:auto 320px;background-repeat:repeat;opacity:.70}
.top{background:linear-gradient(90deg,#0b438f,#0f52ba);border-bottom:1px solid rgba(255,255,255,.16);box-shadow:0 8px 28px rgba(8,47,106,.14);padding:9px 12px}
.top .brand img{width:46px;height:46px;filter:drop-shadow(0 4px 10px rgba(0,0,0,.14))}
.top .brand b{letter-spacing:.14em}
.top .brand small{color:#dce9ff;font-size:.56rem;letter-spacing:.10em}
.topActions a,.topActions button{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18);border-radius:12px;min-height:38px}
.main{padding-top:10px}
.hero{background:linear-gradient(135deg,#0b438f,#1764c6);border:1px solid rgba(255,255,255,.16);border-radius:18px;padding:13px 15px;box-shadow:0 10px 28px rgba(15,82,186,.12)}
.heroIcon{width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.12);font-family:Arial,Helvetica,sans-serif;font-size:1.05rem;font-weight:900}
.hero h1{font-size:1.34rem;letter-spacing:-.03em}
.hero p{font-size:.59rem;line-height:1.4;color:#eef5ff}
.summary{gap:7px;margin:8px 0}
.stat{min-height:78px;padding:9px 10px;background:rgba(255,253,248,.97);border:1px solid rgba(15,82,186,.13);border-radius:15px;box-shadow:0 7px 20px rgba(29,67,117,.05);position:relative;overflow:hidden}
.stat:after{content:"";position:absolute;left:0;bottom:0;width:32%;height:2px;background:linear-gradient(90deg,#0f52ba,rgba(15,82,186,0))}
.stat small{font-size:.49rem;letter-spacing:.07em;color:#74818a}
.stat strong{font-size:1.28rem;color:#17324d;margin-top:4px;letter-spacing:-.03em}
.toolbar{gap:5px;padding:1px 0 8px;scrollbar-width:none}
.toolbar::-webkit-scrollbar{display:none}
.filter{padding:7px 10px;border:1px solid rgba(15,82,186,.13);background:#fffdf8;color:#48627b;font-size:.56rem}
.filter.active{background:#0f52ba;color:#fff;border-color:#0f52ba}
.updated{font-size:.49rem;color:#839098}
.orders{gap:8px}
.order{background:#fffdf8;border:1px solid rgba(15,82,186,.12);border-radius:16px;box-shadow:0 7px 20px rgba(29,67,117,.045)}
.orderHead{padding:9px 10px;gap:7px;border-bottom:1px solid rgba(15,82,186,.08)}
.orderNo{font-size:.92rem;color:#17324d}
.orderMeta{font-size:.49rem;color:#74818a;margin-top:2px}
.elapsed{padding:5px 7px;background:#edf4ff;color:#0f52ba;font-size:.50rem}
.elapsed.warn{background:#fff1df;color:#94601f}
.elapsed.late{background:#fff0ef;color:#b84a45}
.body{padding:8px 10px}
.customer{font-size:.62rem;margin-bottom:7px;color:#17324d}
.customer span{color:#0f52ba}
.waiter{font-size:.49rem;color:#7a878f}
.items{gap:7px}
.item{padding:8px;border:1px solid rgba(15,82,186,.10);border-radius:12px;background:#fff}
.itemTop{grid-template-columns:30px 1fr auto;gap:7px}
.unit{width:30px;height:30px;border-radius:9px;background:#0f52ba;font-size:.56rem}
.item b{font-size:.68rem;color:#17324d}
.unitLabel{font-size:.43rem;padding:2px 5px;background:#edf4ff;color:#0f52ba}
.opts{font-size:.49rem;line-height:1.30;color:#77858d;margin-top:2px}
.badge{padding:4px 6px;font-size:.45rem}
.s-submitted{background:#fff1df;color:#94601f}
.s-accepted{background:#edf4ff;color:#0f52ba}
.s-preparing{background:#eef4ff;color:#375f99}
.s-ready{background:#e8f3ec;color:#2f7753}
.s-delivered{background:#f1f3f2;color:#68736d}
.s-cancelled{background:#fff0ef;color:#b84a45}
.timeRow{gap:4px;margin-top:6px}
.time{padding:4px 6px;background:#f3f6fa;color:#6d7d88;font-size:.43rem}
.itemAction{min-height:36px;margin-top:6px;border-radius:10px;font-size:.57rem}
.itemAction[data-status="accepted"]{background:#0f52ba;color:#fff}
.itemAction[data-status="preparing"]{background:#d89a43;color:#2e1d0a}
.itemAction[data-status="ready"]{background:#2f7753;color:#fff}
.itemAction.ready{background:#e8f3ec;color:#2f7753;border:1px solid #d4e6da}
.notes{margin-top:7px;padding:7px 8px;border-radius:10px;background:#fff6e8;border-color:#ecd3a5;font-size:.52rem}
.empty{background:#fffdf8;border:1px dashed rgba(15,82,186,.18);border-radius:15px;color:#74818a}
.compactEmpty{display:flex;align-items:center;justify-content:center;gap:10px;padding:18px 14px;text-align:left}
.compactEmpty .emptyIcon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#edf4ff;color:#0f52ba;font-weight:950}
.compactEmpty strong{margin:0 0 2px;font-size:.67rem;color:#17324d}
.compactEmpty span{display:block;font-size:.52rem;color:#7a878f}
.toast{background:#17324d}
@media(max-width:680px){
  .main{padding:8px 8px 28px}
  .hero{padding:11px 12px;border-radius:16px}
  .heroIcon{width:38px;height:38px}
  .hero h1{font-size:1.20rem}
  .hero p{font-size:.55rem}
  .summary{gap:6px}
  .stat{min-height:70px;padding:8px 9px}
  .stat strong{font-size:1.15rem}
  .orders{gap:7px}
  .orderHead{padding:8px 9px}
  .body{padding:7px 9px}
  .item{padding:7px}
}
`;document.head.appendChild(brandStyle);
document.body.innerHTML=`<section class="login" id="loginView"><div class="loginCard"><div class="brand"><img src="assets/logo.png" alt="CHIDOLIRO"><div><b>CHIDOLIRO</b><small>${SUBTITLE}</small></div></div><h1>${TITLE}</h1><p>Si una línea trae varias unidades, cada vaso o platillo se controla por separado.</p><form id="loginForm"><label class="field"><span>Usuario</span><input id="username" autocomplete="username" autocapitalize="none"></label><label class="field"><span>PIN de 6 dígitos</span><input class="pin" id="pin" type="password" inputmode="numeric" maxlength="6"></label><button class="loginBtn" type="submit">Entrar</button></form><div class="error" id="loginError"></div></div></section><section class="app hidden" id="appView"><header class="top"><div class="topRow"><div class="brand"><img src="assets/logo.png" alt="CHIDOLIRO"><div><b>CHIDOLIRO</b><small>${SUBTITLE}</small></div></div><div class="topActions"><a href="/entregas.html">Entregas</a><a href="/panel.html">Panel</a><button id="refresh">Actualizar</button><button id="logout">Salir</button></div></div></header><main class="main"><section class="hero"><div class="heroIcon">${ICON}</div><div><h1>${TITLE}</h1><p>${IS_BAR?'Cada bebida tiene su propio reloj, incluso si pidieron varias iguales.':'Cada plato tiene su propio reloj, incluso si pidieron varias unidades iguales.'}</p></div></section><section class="summary"><div class="stat"><small>Nuevos</small><strong id="nNew">0</strong></div><div class="stat"><small>Preparando</small><strong id="nPrep">0</strong></div><div class="stat"><small>Listos</small><strong id="nReady">0</strong></div><div class="stat"><small>Unidades activas</small><strong id="nActive">0</strong></div></section><div class="toolbar"><button class="filter active" data-f="active">Activos</button><button class="filter" data-f="submitted">Nuevos</button><button class="filter" data-f="preparing">Preparando</button><button class="filter" data-f="ready">Listos</button><button class="filter" data-f="all">Todos</button><span class="updated" id="updated">—</span></div><section class="orders" id="orders"></section></main></section><div class="toast" id="toast"></div>`;
const loginView=document.getElementById('loginView'),appView=document.getElementById('appView'),ordersEl=document.getElementById('orders');
function toast(m){const e=document.getElementById('toast');e.textContent=m;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1800)}
function fmtSec(s){s=Math.max(0,Number(s||0));if(s<60)return`${s}s`;const m=Math.floor(s/60);return m<60?`${m} min`:`${Math.floor(m/60)}h ${m%60}m`}
function age(t){return fmtSec(Math.floor((Date.now()-new Date(t).getTime())/1000))}
function ageClass(t){const m=(Date.now()-new Date(t).getTime())/60000;return m>=20?'late':m>=10?'warn':''}
function optText(v){return Array.isArray(v)?v.map(o=>o.name||o.label||'').filter(Boolean).join(' · '):''}
function unitSuffix(i){return Number(i.unit_count||1)>1?`${Number(i.unit_number||1)}/${Number(i.unit_count||1)}`:''}
function beep(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=new A(),o=c.createOscillator(),g=c.createGain();o.frequency.value=720;g.gain.setValueAtTime(.04,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.18);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.18)}catch(_){}}
async function post(body){const r=await fetch('/api/kitchen',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',...(state.session?{Authorization:`Bearer ${state.session}`}:{})},body:JSON.stringify(body||{})});const p=await r.json().catch(()=>null);if(r.status===401&&body?.action!=='login'){logoutLocal();throw new Error('Sesión vencida')}if(r.status===403)throw new Error('Sin permiso para esta estación');if(!r.ok||!p?.ok){const code=p?.error||'No se pudo conectar';const map={kitchen_upstream_failed:'No pudimos sincronizar la estación. Reintentando…'};throw new Error(map[code]||code)}return p}
async function getOrders(){const r=await fetch(`/api/kitchen?station=${encodeURIComponent(STATION)}`,{cache:'no-store',headers:{Authorization:`Bearer ${state.session}`}});const p=await r.json().catch(()=>null);if(r.status===401){logoutLocal();throw new Error('Sesión vencida')}if(r.status===403)throw new Error('Sin permiso para esta estación');if(!r.ok||!p?.ok){const code=p?.error||'No se pudo cargar';const map={kitchen_upstream_failed:'No pudimos actualizar la estación. Reintentando…'};throw new Error(map[code]||code)}return p}
async function validate(){const p=await post({action:'profile'});state.profile=p;const perms=new Set(p.permissions||[]);if(!perms.has(PERMISSION)){toast('Tu usuario no tiene acceso a '+TITLE);setTimeout(()=>location.replace('/panel.html'),700);return false}return true}
function showApp(){loginView.classList.add('hidden');appView.classList.remove('hidden');load();clearInterval(state.timer);state.timer=setInterval(load,4000)}
function logoutLocal(){state.session='';sessionStorage.removeItem(KEY);localStorage.removeItem(KEY);clearInterval(state.timer);appView.classList.add('hidden');loginView.classList.remove('hidden')}
function allItems(){return state.orders.flatMap(o=>(o.items||[]).map(i=>({...i,order:o})))}
function visibleItems(o){let rows=o.items||[];if(state.filter==='active')return rows.filter(i=>!['ready','delivered','cancelled'].includes(i.status));if(state.filter==='submitted')return rows.filter(i=>['submitted','accepted'].includes(i.status));if(state.filter==='all')return rows;return rows.filter(i=>i.status===state.filter)}
function render(){
  const ai=allItems();
  document.getElementById('nNew').textContent=ai.filter(i=>['submitted','accepted'].includes(i.status)).length;
  document.getElementById('nPrep').textContent=ai.filter(i=>i.status==='preparing').length;
  document.getElementById('nReady').textContent=ai.filter(i=>i.status==='ready').length;
  document.getElementById('nActive').textContent=ai.filter(i=>!['ready','delivered','cancelled'].includes(i.status)).length;
  const cards=state.orders.map(o=>({o,items:visibleItems(o)})).filter(x=>x.items.length);
  if(!cards.length){ordersEl.innerHTML=`<div class="empty compactEmpty"><div class="emptyIcon">✓</div><div><strong>Todo al día</strong><span>Las nuevas ${IS_BAR?'bebidas':'preparaciones'} aparecerán automáticamente.</span></div></div>`;return}
  ordersEl.innerHTML=cards.map(({o,items})=>{
    const customer=o.order_type==='table'?`Mesa <span>${esc(o.table_reference||'—')}</span>`:`Para llevar · <span>${esc(o.customer_name||'')}</span>`;
    const waiter=o.assigned_waiter?.display_name?`Responsable: ${esc(o.assigned_waiter.display_name)}`:'Sin mesero asignado';
    return `<article class="order"><div class="orderHead"><div><div class="orderNo">#${esc(o.order_number)}</div><div class="orderMeta">${o.order_type==='table'?'Mesa':'Para llevar'} · ${new Date(o.created_at).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</div></div><div class="elapsed ${ageClass(o.created_at)}">${age(o.created_at)}</div></div><div class="body"><div class="customer">${customer}<div class="waiter">${waiter}</div></div><div class="items">${items.map(i=>{
      const n=next[i.status],opts=optText(i.selected_options),suffix=unitSuffix(i);
      const time=i.status==='ready'&&i.ready_at?`Listo hace ${age(i.ready_at)}`:i.status==='preparing'&&i.preparing_at?`Preparando ${age(i.preparing_at)}`:i.status==='delivered'&&i.ready_at&&i.delivered_at?`Entrega ${fmtSec((new Date(i.delivered_at)-new Date(i.ready_at))/1000)}`:'';
      return `<div class="item"><div class="itemTop"><div class="unit">${suffix||'1'}</div><div><b>${esc(i.item_name)}${suffix?`<span class="unitLabel">${suffix}</span>`:''}</b>${opts?`<div class="opts">${esc(opts)}</div>`:''}${i.notes?`<div class="opts">Nota: ${esc(i.notes)}</div>`:''}</div><span class="badge s-${esc(i.status)}">${labels[i.status]||i.status}</span></div><div class="timeRow">${i.total_to_ready_seconds!=null?`<span class="time">Pedido→listo: ${fmtSec(i.total_to_ready_seconds)}</span>`:''}${i.prep_seconds!=null?`<span class="time">Preparación: ${fmtSec(i.prep_seconds)}</span>`:''}${time?`<span class="time">${esc(time)}</span>`:''}</div>${n?`<button class="itemAction" data-unit="${esc(i.unit_id||i.id)}" data-status="${n[0]}">${n[1]}${suffix?` · ${suffix}`:''}</button>`:i.status==='ready'?'<button class="itemAction ready" disabled>✓ Esperando entrega del mesero</button>':''}</div>`
    }).join('')}</div>${o.notes?`<div class="notes">Pedido: ${esc(o.notes)}</div>`:''}</div></article>`
  }).join('');
  ordersEl.querySelectorAll('[data-unit]').forEach(b=>b.onclick=()=>advance(b.dataset.unit,b.dataset.status,b));
}
async function load(){try{const p=await getOrders();const newIds=new Set((p.orders||[]).flatMap(o=>(o.items||[]).filter(i=>i.status==='submitted').map(i=>i.unit_id||i.id)));if(!state.first&&[...newIds].some(id=>!state.lastNew.has(id)))beep();state.first=false;state.lastNew=newIds;state.orders=p.orders||[];render();document.getElementById('updated').textContent='Actualizado '+new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}catch(e){toast(e.message)}}
async function advance(id,status,btn){btn.disabled=true;try{await post({action:'station_unit_update',unit_id:id,status});toast(status==='ready'?'Unidad lista para mesero':'Estado actualizado');await load()}catch(e){toast(e.message);btn.disabled=false}}
document.getElementById('loginForm').onsubmit=async e=>{e.preventDefault();const u=document.getElementById('username').value.trim().toLowerCase(),p=document.getElementById('pin').value.replace(/\D/g,'').slice(0,6),err=document.getElementById('loginError');err.textContent='';if(u.length<3){err.textContent='Escribe tu usuario.';return}if(p.length!==6){err.textContent='Ingresa tu PIN de 6 dígitos.';return}try{const r=await post({action:'login',username:u,pin:p});state.session=r.token;sessionStorage.setItem(KEY,state.session);localStorage.setItem(KEY,state.session);if(await validate())showApp()}catch(x){err.textContent=x.message==='too_many_attempts'?'Demasiados intentos. Espera 15 minutos.':'Usuario o PIN incorrectos.'}};
document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-f]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.f;render()});
document.getElementById('refresh').onclick=load;
document.getElementById('logout').onclick=async()=>{try{await post({action:'logout'})}catch(_){}logoutLocal()};
(async()=>{if(state.session){try{if(await validate())showApp()}catch(_){logoutLocal()}}else document.getElementById('username').focus()})();
})();
