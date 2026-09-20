(()=> {
  const css = `
  .section#eventos{scroll-margin-top:118px}.eventCards{display:grid;gap:16px}.eventCard{display:grid;grid-template-columns:minmax(250px,.72fr) minmax(0,1.28fr);background:#071d21;color:white;border:1px solid rgba(255,255,255,.1);border-radius:30px;overflow:hidden;box-shadow:var(--shadow);position:relative}
  .eventCard:after{content:"";position:absolute;right:-90px;top:-90px;width:250px;height:250px;border-radius:50%;background:radial-gradient(circle,rgba(240,154,82,.18),transparent 68%);pointer-events:none}
  .eventPoster{background:#04171b;display:grid;place-items:center;padding:18px;min-height:520px;position:relative}.eventPoster:before{content:"Cargando cartel…";position:absolute;color:rgba(255,255,255,.55);font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.eventPoster.loaded:before{display:none}.eventPoster.noImage:before{content:"Próximamente";font-size:.72rem}.eventPoster img{display:block;width:min(100%,340px);height:auto;max-height:640px;object-fit:contain;border-radius:20px;box-shadow:0 22px 52px rgba(0,0,0,.38);opacity:0;transition:opacity .2s ease}.eventPoster.loaded img{opacity:1}
  .eventBody{padding:30px;display:flex;flex-direction:column;justify-content:center;position:relative;z-index:1}.eventKicker{align-self:flex-start;display:inline-flex;align-items:center;gap:7px;padding:8px 11px;border-radius:999px;background:rgba(240,154,82,.13);border:1px solid rgba(240,154,82,.34);color:#ffd29b;font-size:.68rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
  .eventBody h3{font-family:"Fraunces",serif;font-size:clamp(2.45rem,4.7vw,4.8rem);line-height:.94;letter-spacing:-.035em;margin:15px 0 9px;color:white}.eventSubtitle{color:#ffd4a8;font-size:.76rem;font-weight:900;margin:0 0 8px}.eventBody>p{max-width:620px;color:rgba(255,255,255,.7);font-size:.88rem;line-height:1.65;margin:0}
  .eventMeta{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}.eventMeta span{display:inline-flex;align-items:center;min-height:36px;padding:0 11px;border-radius:11px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09);font-size:.72rem;font-weight:800;color:rgba(255,255,255,.86)}
  .eventLineup{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:2px}.eventLineup div{padding:12px;border-radius:15px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.08)}.eventLineup b{display:block;color:white;font-size:.78rem;line-height:1.2}.eventLineup span{display:block;color:rgba(255,255,255,.5);font-size:.64rem;line-height:1.35;margin-top:4px}
  .eventSponsor{margin-top:10px;padding:11px 13px;border-left:3px solid var(--amber);background:rgba(240,154,82,.08);border-radius:0 12px 12px 0;color:#ffd7aa;font-size:.72rem;font-weight:800}.eventActions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.eventActions button{font:inherit;border:0;cursor:pointer}.eventGhost{background:rgba(255,255,255,.07);color:white;border:1px solid rgba(255,255,255,.12)}
  @media(max-width:820px){.eventCard{grid-template-columns:1fr}.eventPoster{min-height:0;padding:16px 12px 18px}.eventPoster img{width:min(100%,340px)}.eventBody{padding:23px 18px 25px}.eventLineup{grid-template-columns:1fr}}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
  const promos=document.getElementById('promos');if(!promos||document.getElementById('eventos'))return;

  const fallback=[{
    id:'fallback-anniversary',slug:'primer-aniversario-2026',title:'CHIDOLIRO cumple 1 año',
    eyebrow:'1ER ANIVERSARIO · DOM 18 OCT',subtitle:'Presenta a los mejores imitadores',
    description:'Celebramos con música en vivo, los mejores imitadores, activación de Tesoro Azul, sorpresas y regalos en Nuevo Urecho.',
    event_date:'2026-10-18',start_time:'14:00:00',location:'Nuevo Urecho, Michoacán',
    address:'Nacional s/n, 61750 Nuevo Urecho, Michoacán',whatsapp:'524521590691',
    reservation_message:'Hola CHIDOLIRO, quiero reservar para el 1er Aniversario del 18 de octubre.',
    sponsor:'Tesoro Azul · activación de 2 a 5 PM',
    artists:[{name:'Jorge Luis Solís',detail:'El clon de Marco Antonio Solís'},{name:'La Rivereña Divina',detail:'La voz gemela de Jenny Rivera'},{name:'Pepé Mancilla',detail:'La leyenda continúa'}],
    image_url:null
  }];

  const section=document.createElement('section');section.className='section sand';section.id='eventos';section.innerHTML='<div class="sectionHead"><h2 class="sectionTitle">Próximos eventos</h2><p>Música, activaciones y fechas especiales para vivir CHIDOLIRO de otra manera.</p></div><div class="eventCards" id="eventCards"></div>';promos.insertAdjacentElement('afterend',section);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateLabel=v=>{if(!v)return 'Próximo evento';const d=new Date(v+'T12:00:00');return new Intl.DateTimeFormat('es-MX',{weekday:'short',day:'numeric',month:'short'}).format(d).replace('.','')};
  const timeLabel=v=>{if(!v)return '';const [h,m]=String(v).slice(0,5).split(':').map(Number),d=new Date();d.setHours(h,m||0,0,0);return new Intl.DateTimeFormat('es-MX',{hour:'numeric',minute:m?'2-digit':undefined}).format(d).replace('a. m.','AM').replace('p. m.','PM')};
  const whatsappHref=e=>{const phone=String(e.whatsapp||'').replace(/\D/g,'');return phone?'https://wa.me/'+phone+'?text='+encodeURIComponent(e.reservation_message||('Hola CHIDOLIRO, quiero reservar para '+e.title+'.')):''};
  const mapHref=e=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(e.address||e.location||'Nuevo Urecho, Michoacán');

  function render(events){
    const root=document.getElementById('eventCards');root.innerHTML=events.map((e,i)=>{
      const artists=Array.isArray(e.artists)?e.artists.filter(a=>a&&a.name):[],wa=whatsappHref(e);
      return '<article class="eventCard" data-event-id="'+esc(e.id||i)+'"><div class="eventPoster"><img alt="'+esc('Cartel de '+e.title)+'"></div><div class="eventBody"><span class="eventKicker">'+esc(e.eyebrow||dateLabel(e.event_date))+'</span><h3>'+esc(e.title)+'</h3>'+(e.subtitle?'<div class="eventSubtitle">'+esc(e.subtitle)+'</div>':'')+'<p>'+esc(e.description||'')+'</p><div class="eventMeta">'+(e.start_time?'<span>◷ Desde las '+esc(timeLabel(e.start_time))+'</span>':'')+(e.location?'<span>⌖ '+esc(e.location)+'</span>':'')+'</div>'+(artists.length?'<div class="eventLineup">'+artists.map(a=>'<div><b>'+esc(a.name)+'</b>'+(a.detail?'<span>'+esc(a.detail)+'</span>':'')+'</div>').join('')+'</div>':'')+(e.sponsor?'<div class="eventSponsor">'+esc(e.sponsor)+'</div>':'')+'<div class="eventActions">'+((e.slug==='primer-aniversario-2026'||e.event_date==='2026-10-18')?'<button class="btn btnOrange eventReserveNative" data-event-reserve="'+esc(e.id||i)+'">Reservar para el aniversario</button>':'')+(wa?'<a class="btn eventGhost" target="_blank" rel="noopener" href="'+esc(wa)+'">WhatsApp</a>':'')+(e.location||e.address?'<a class="btn eventGhost" target="_blank" rel="noopener" href="'+esc(mapHref(e))+'">Cómo llegar</a>':'')+'</div></div></article>';
    }).join('');
    events.forEach((e,i)=>loadPoster(root.children[i]?.querySelector('.eventPoster'),e));
    root.querySelectorAll('[data-event-reserve]').forEach(button=>button.addEventListener('click',()=>{
      const id=button.dataset.eventReserve;
      const event=events.find((x,idx)=>String(x.id||idx)===String(id))||events.find(x=>x.slug==='primer-aniversario-2026'||x.event_date==='2026-10-18');
      if(!event)return;
      if(typeof window.openEventReservation==='function'){
        window.openEventReservation({
          slug:event.slug||'primer-aniversario-2026',
          title:'1er Aniversario CHIDOLIRO',
          date:event.event_date||'2026-10-18',
          startTime:String(event.start_time||'14:00').slice(0,5),
          meta:'Domingo 18 de octubre · desde las 2 PM'
        });
      }else if(typeof openSheet==='function'){openSheet('reserveSheet');}
    }));
  }

  function loadPoster(wrap,e){
    if(!wrap)return;const img=wrap.querySelector('img');
    const show=src=>{img.onload=()=>wrap.classList.add('loaded');img.onerror=()=>{wrap.classList.add('loaded','noImage');img.remove()};img.src=src};
    if(e.image_url){show(e.image_url+(e.image_url.includes('?')?'&':'?')+'v='+(e.image_version||Date.now()));return}
    if(e.slug==='primer-aniversario-2026'||e.id==='fallback-anniversary'){
      const parts=Array.from({length:7},(_,i)=>'assets/evento-aniversario-clean-v4/part-'+String(i+1).padStart(2,'0')+'.txt?v=5');
      Promise.all(parts.map(url=>fetch(url,{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('poster');return r.text()}))).then(p=>show('data:image/webp;base64,'+p.join(''))).catch(()=>wrap.classList.add('loaded','noImage'));return;
    }
    wrap.classList.add('loaded','noImage');img.remove();
  }

  fetch('/api/events',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(p=>{
    const events=Array.isArray(p?.events)?p.events:[];if(events.length)render(events);else section.remove();
  }).catch(()=>render(fallback));

  const nav=document.querySelector('.navlinks');if(nav&&!nav.querySelector('a[href="#eventos"]')){const link=document.createElement('a');link.href='#eventos';link.textContent='Eventos';const visit=nav.querySelector('a[href="#visita"]');visit?nav.insertBefore(link,visit):nav.appendChild(link)}
})();