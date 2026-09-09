(()=>{
  if(!document.getElementById('greeting')) return;
  document.body.classList.add('chidoliro-v3-dashboard');
  const $=s=>document.querySelector(s);
  const text=(s,f='0')=>$(s)?.textContent?.trim()||f;

  function makeCommandStrip(){
    if(document.querySelector('.v3-command-strip')) return;
    const hero=document.querySelector('.hero');
    if(!hero) return;
    const strip=document.createElement('section');
    strip.className='v3-command-strip';
    strip.innerHTML=`
      <article class="v3-command-card primary"><div class="v3-label">Pulso operativo</div><strong class="v3-value" id="v3PulseValue">Sistema activo</strong><div class="v3-sub" id="v3PulseSub">Sincronizando estaciones…</div><div class="v3-signal"><i></i><span>Actualización en vivo</span></div></article>
      <article class="v3-command-card"><div class="v3-label">Cocina</div><strong class="v3-value" id="v3Kitchen">0</strong><div class="v3-sub" id="v3KitchenSub">sin preparación activa</div></article>
      <article class="v3-command-card"><div class="v3-label">Barra</div><strong class="v3-value" id="v3Bar">0</strong><div class="v3-sub" id="v3BarSub">sin bebidas activas</div></article>
      <article class="v3-command-card"><div class="v3-label">Entregas</div><strong class="v3-value" id="v3Delivery">0</strong><div class="v3-sub" id="v3DeliverySub">sin pendientes</div></article>`;
    hero.insertAdjacentElement('afterend',strip);
  }

  function makeDock(){
    if(document.querySelector('.v3-dock')) return;
    const quick=[...document.querySelectorAll('.quick a')];
    if(!quick.length) return;
    const wanted=[
      ['/pos.html','📱','POS'],['/cocina.html','🔥','Cocina'],['/bebidas.html','🥤','Barra'],['/entregas.html','✅','Entregas'],['/caja.html','💳','Caja'],['/reportes.html','⏱','Rendimiento']
    ];
    const allowed=new Set(quick.map(a=>new URL(a.href,location.origin).pathname));
    const dock=document.createElement('nav');
    dock.className='v3-dock';
    dock.setAttribute('aria-label','Accesos operativos');
    const home=document.createElement('a'); home.href='#'; home.dataset.v3Home='1'; home.title='Inicio'; home.textContent='⌂'; dock.appendChild(home);
    wanted.forEach(([href,icon,label])=>{if(!allowed.has(href))return;const a=document.createElement('a');a.href=href;a.title=label;a.textContent=icon;dock.appendChild(a)});
    document.body.appendChild(dock);
  }

  function sync(){
    const k=text('#liveKitchen');
    const b=text('#liveBar');
    const d=text('#liveDelivery');
    const ks=text('#liveKitchenNote','sin preparación activa');
    const bs=text('#liveBarNote','sin bebidas activas');
    const ds=text('#liveDeliveryNote','sin pendientes');
    const set=(id,v)=>{const n=document.getElementById(id);if(n&&n.textContent!==v)n.textContent=v};
    set('v3Kitchen',k); set('v3KitchenSub',ks);
    set('v3Bar',b); set('v3BarSub',bs);
    set('v3Delivery',d); set('v3DeliverySub',ds);
    const active=Number((text('#activeOrders')||'0').replace(/\D/g,''))||0;
    const tables=Number((text('#openTables')||'0').replace(/\D/g,''))||0;
    const ready=Number(d.replace(/\D/g,''))||0;
    let headline='Operación estable', sub=`${tables} mesa${tables===1?'':'s'} activa${tables===1?'':'s'} · ${active} comanda${active===1?'':'s'} en curso`;
    if(ready>0){headline=`${ready} entrega${ready===1?'':'s'} esperando`;sub='Prioridad de servicio en mesa'}
    else if(active>0){headline=`${active} comanda${active===1?'':'s'} en curso`;sub='Producción y servicio sincronizados'}
    set('v3PulseValue',headline); set('v3PulseSub',sub);
  }

  function promoteLive(){
    const live=$('#liveKitchenCard')?.closest('.panel');
    const activity=[...document.querySelectorAll('.sectionHead h2')].find(h=>/Actividad del día/i.test(h.textContent||''))?.closest('.sectionHead');
    if(live&&activity&&live.parentElement){
      const panel=live;
      if(!panel.dataset.v3Promoted){panel.dataset.v3Promoted='1';panel.style.boxShadow='0 0 0 1px rgba(84,234,220,.05),0 18px 44px rgba(0,0,0,.16)'}
    }
  }

  makeCommandStrip();
  makeDock();
  promoteLive();
  sync();
  const mo=new MutationObserver(()=>sync());
  ['#liveKitchen','#liveBar','#liveDelivery','#activeOrders','#openTables'].forEach(sel=>{const n=$(sel);if(n)mo.observe(n,{childList:true,subtree:true,characterData:true})});
  setInterval(sync,2500);
})();
