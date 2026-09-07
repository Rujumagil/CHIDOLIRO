(() => {
  'use strict';
  const TABLE_KEY='chidoliro_table_context_v1';
  const MODE_KEY='chidoliro_order_mode_v1';
  const TRACK_KEY='chidoliro_last_order_tracking_v1';
  const params=new URLSearchParams(location.search);
  const mesaParam=(params.get('mesa')||'').trim();
  let verifiedQr=false;

  function readTable(){try{return JSON.parse(localStorage.getItem(TABLE_KEY)||'null')}catch(_){return null}}
  function saveTable(table,verified=false){if(!table?.name)return;localStorage.setItem(TABLE_KEY,JSON.stringify({name:String(table.name).slice(0,40),id:table.id||null,verified:!!verified,updatedAt:Date.now()}));localStorage.setItem(MODE_KEY,'table');verifiedQr=!!verified;applyTableContext();}

  if(mesaParam){
    localStorage.setItem(MODE_KEY,'table');
    if(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(mesaParam)){
      fetch(`/api/table?token=${encodeURIComponent(mesaParam)}`,{cache:'no-store'}).then(r=>r.json()).then(p=>{if(p?.ok&&p.table)saveTable(p.table,true);else throw new Error('mesa_invalida')}).catch(()=>{localStorage.removeItem(TABLE_KEY);});
    }else{
      const clean=mesaParam.replace(/[^0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ _-]/g,'').slice(0,40);
      if(clean)saveTable({name:clean},false);
    }
  }

  function applyTableContext(){
    const table=readTable(); if(!table?.name)return;
    const input=document.getElementById('orderTable');
    if(input){input.value=table.name;if(table.verified){input.readOnly=true;input.setAttribute('aria-readonly','true');input.style.background='#eef0e9';}}
    const checkout=document.getElementById('checkoutBody');
    if(checkout&&!document.getElementById('tableContextBadge')){
      const mode=checkout.querySelector('.checkoutMode');
      if(mode){const badge=document.createElement('div');badge.id='tableContextBadge';badge.style.cssText='margin:-4px 0 12px;padding:10px 12px;border-radius:14px;background:#e4f0ed;color:#155d50;font-size:.74rem;font-weight:900;border:1px solid rgba(19,122,126,.15)';badge.textContent=`✓ Pedido identificado para Mesa ${table.name}`;mode.insertAdjacentElement('afterend',badge);}
    }
    if(table.verified){document.querySelectorAll('[data-checkout-mode="takeout"]').forEach(btn=>{btn.style.display='none'});}
    const sheet=document.getElementById('menuSheet');
    const head=sheet?.querySelector('.sheetHead');
    if(head&&!document.getElementById('menuTableChip')){const chip=document.createElement('div');chip.id='menuTableChip';chip.style.cssText='display:inline-flex;margin-top:7px;padding:6px 9px;border-radius:999px;background:#e4f0ed;color:#155d50;font-size:.66rem;font-weight:900';chip.textContent=`Mesa ${table.name}`;head.querySelector('div')?.appendChild(chip);}
  }

  const originalFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const response=await originalFetch(input,init);
    try{
      const raw=typeof input==='string'?input:input?.url||'';
      const url=new URL(raw,location.href);
      if(url.pathname==='/api/order'&&String(init?.method||'GET').toUpperCase()==='POST'){
        response.clone().json().then(result=>{
          if(result?.ok&&result?.public_token){
            localStorage.setItem(TRACK_KEY,JSON.stringify({token:result.public_token,orderNumber:result.order_number,createdAt:Date.now()}));
            setTimeout(enhanceSuccess,60);setTimeout(enhanceSuccess,300);
          }
        }).catch(()=>{});
      }
    }catch(_){}
    return response;
  };

  function tracking(){try{return JSON.parse(localStorage.getItem(TRACK_KEY)||'null')}catch(_){return null}}
  function enhanceSuccess(){
    const box=document.querySelector('.orderSuccess'); const data=tracking();
    if(!box||!data?.token||document.getElementById('trackOrderButton'))return;
    const done=document.getElementById('orderDone');
    const link=document.createElement('a');link.id='trackOrderButton';link.href=`/pedido.html?t=${encodeURIComponent(data.token)}`;link.textContent='Ver estado de mi pedido';link.style.cssText='display:flex;align-items:center;justify-content:center;width:100%;max-width:340px;margin:0 auto 9px;min-height:52px;border-radius:16px;background:#f09a52;color:#25160b;font-weight:900;text-decoration:none';
    if(done)done.insertAdjacentElement('beforebegin',link);else box.appendChild(link);
    const p=box.querySelector('p');if(p)p.textContent='Tu pedido ya llegó al restaurante. Puedes seguir su avance en tiempo real desde este dispositivo.';
  }

  function boot(){applyTableContext();const observer=new MutationObserver(()=>{applyTableContext();enhanceSuccess()});observer.observe(document.body,{childList:true,subtree:true});setTimeout(applyTableContext,900);setTimeout(applyTableContext,2200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
