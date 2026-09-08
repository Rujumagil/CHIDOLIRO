(() => {
  'use strict';
  const KEY='chidoliro_active_order_v1';
  const $=(s,r=document)=>r.querySelector(s);
  let timer=null;
  const originalFetch=window.fetch.bind(window);
  function get(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}}
  function set(v){if(v)localStorage.setItem(KEY,JSON.stringify(v));else localStorage.removeItem(KEY)}
  function injectStyles(){
    if($('#liveOrderBridgeStyles')) return;
    const style=document.createElement('style');style.id='liveOrderBridgeStyles';style.textContent=`
      .orderSuccessActions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:4px}.trackOrderBtn{background:var(--amber)!important;color:#25160b!important}
      .activeOrderChip{position:fixed;z-index:225;left:50%;bottom:calc(86px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(calc(100% - 24px),570px);background:rgba(4,23,27,.95);backdrop-filter:blur(16px);color:white;border:1px solid rgba(255,255,255,.11);box-shadow:0 12px 34px rgba(0,0,0,.25);border-radius:17px;padding:10px 12px;display:flex;align-items:center;gap:10px;transition:.2s}.activeOrderChip.hidden{opacity:0;pointer-events:none;transform:translate(-50%,10px)}.activeOrderDot{width:9px;height:9px;border-radius:50%;background:#f09a52;box-shadow:0 0 0 4px rgba(240,154,82,.16);flex:0 0 auto}.activeOrderText{min-width:0;flex:1}.activeOrderText b{display:block;font-size:.72rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.activeOrderText span{display:block;color:rgba(255,255,255,.65);font-size:.61rem;margin-top:2px}.activeOrderOpen{border:0;border-radius:12px;background:white;color:var(--ocean);font-size:.66rem;font-weight:900;min-height:36px;padding:0 11px}
      @media(max-width:700px){.orderSuccessActions{grid-template-columns:1fr}.activeOrderChip{bottom:calc(78px + env(safe-area-inset-bottom));width:calc(100% - 20px)}}
    `;document.head.appendChild(style);
  }
  function trackingUrl(token){return `/pedido.html?t=${encodeURIComponent(token)}`}
  function saveFromResponse(payload){
    if(!payload?.ok||!payload?.public_token) return;
    const record={token:payload.public_token,orderNumber:payload.order_number,type:payload.order_type,status:payload.status||'submitted',createdAt:Date.now()};
    set(record);renderChip(record);setTimeout(()=>enhanceSuccess(record),40);startPolling();
  }
  window.fetch=async function(input,init){
    const response=await originalFetch(input,init);
    try{
      const url=typeof input==='string'?input:(input?.url||'');
      const method=String(init?.method||'GET').toUpperCase();
      if(method==='POST'&&(/\/api\/order(?:\?|$)/).test(url)){
        response.clone().json().then(saveFromResponse).catch(()=>{});
      }
    }catch(_){}
    return response;
  };
  function enhanceSuccess(record){
    const success=$('.orderSuccess');if(!success||success.dataset.liveTracking==='1') return;
    success.dataset.liveTracking='1';
    const old=$('#orderDone',success);
    const wrap=document.createElement('div');wrap.className='orderSuccessActions';
    const track=document.createElement('a');track.className='btn trackOrderBtn';track.href=trackingUrl(record.token);track.textContent='Ver estado del pedido';
    if(old){old.parentNode.insertBefore(wrap,old);wrap.appendChild(track);wrap.appendChild(old);old.textContent='Seguir explorando';}
    else{wrap.appendChild(track);success.appendChild(wrap);}
    const p=$('p',success);if(p)p.textContent=record.type==='table'?'Tu comanda ya llegó al restaurante. Desde ahora puedes seguir cuándo la aceptan, preparan y entregan.':'Tu pedido ya llegó al restaurante. Consulta en vivo cuándo lo aceptan, preparan y está listo para recoger.';
  }
  function message(status,type){
    if(status==='submitted')return['Pedido recibido','Esperando confirmación del restaurante'];
    if(status==='accepted')return['Pedido aceptado','Pronto comenzará la preparación'];
    if(status==='preparing')return['Preparando tu pedido','La cocina ya está trabajando en él'];
    if(status==='ready')return[type==='takeout'?'¡Pedido listo!':'¡Pedido listo! ',type==='takeout'?'Ya puedes pasar a recogerlo':'En breve llegará a tu mesa'];
    return['Pedido en seguimiento','Toca para ver el estado'];
  }
  function ensureChip(){
    let chip=$('#activeOrderChip');if(chip)return chip;
    chip=document.createElement('div');chip.id='activeOrderChip';chip.className='activeOrderChip';chip.innerHTML='<div class="activeOrderDot"></div><div class="activeOrderText"><b></b><span></span></div><button class="activeOrderOpen" type="button">Ver estado</button>';document.body.appendChild(chip);
    $('.activeOrderOpen',chip).addEventListener('click',()=>{const r=get();if(r?.token)location.href=trackingUrl(r.token)});
    return chip;
  }
  function renderChip(record){
    if(!record?.token)return;
    const chip=ensureChip();const [title,sub]=message(record.status,record.type);
    $('.activeOrderText b',chip).textContent=`#${record.orderNumber||'—'} · ${title}`;
    $('.activeOrderText span',chip).textContent=sub;
    chip.classList.remove('hidden');
  }
  async function poll(){
    const record=get();if(!record?.token){$('#activeOrderChip')?.classList.add('hidden');clearInterval(timer);timer=null;return}
    try{
      const r=await originalFetch(`/api/order-status?token=${encodeURIComponent(record.token)}`,{cache:'no-store'});const p=await r.json();
      if(!r.ok||!p?.ok||!p.order)return;
      record.status=p.order.status;record.type=p.order.order_type||record.type;record.orderNumber=p.order.order_number||record.orderNumber;
      if(['delivered','cancelled'].includes(record.status)){set(null);$('#activeOrderChip')?.classList.add('hidden');clearInterval(timer);timer=null;return}
      set(record);renderChip(record);
    }catch(_){}
  }
  function startPolling(){if(timer)return;poll();timer=setInterval(poll,10000)}
  function start(){injectStyles();const record=get();if(record?.token){renderChip(record);startPolling()}const obs=new MutationObserver(()=>{const r=get();if(r?.token)enhanceSuccess(r)});obs.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
