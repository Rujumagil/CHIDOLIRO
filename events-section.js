(()=> {
  const css = `
  .section#eventos{scroll-margin-top:118px}.eventCard{display:grid;grid-template-columns:minmax(250px,.72fr) minmax(0,1.28fr);background:#071d21;color:white;border:1px solid rgba(255,255,255,.1);border-radius:30px;overflow:hidden;box-shadow:var(--shadow);position:relative}
  .eventCard:after{content:"";position:absolute;right:-90px;top:-90px;width:250px;height:250px;border-radius:50%;background:radial-gradient(circle,rgba(240,154,82,.18),transparent 68%);pointer-events:none}
  .eventPoster{background:#04171b;display:grid;place-items:center;padding:18px;min-height:520px;position:relative}.eventPoster:before{content:"Cargando cartel…";position:absolute;color:rgba(255,255,255,.55);font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.eventPoster.loaded:before{display:none}.eventPoster img{display:block;width:min(100%,320px);height:auto;max-height:610px;object-fit:contain;border-radius:20px;box-shadow:0 22px 52px rgba(0,0,0,.38);opacity:0;transition:opacity .2s ease}.eventPoster.loaded img{opacity:1}
  .eventBody{padding:30px;display:flex;flex-direction:column;justify-content:center;position:relative;z-index:1}.eventKicker{align-self:flex-start;display:inline-flex;align-items:center;gap:7px;padding:8px 11px;border-radius:999px;background:rgba(240,154,82,.13);border:1px solid rgba(240,154,82,.34);color:#ffd29b;font-size:.68rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
  .eventBody h3{font-family:"Fraunces",serif;font-size:clamp(2.45rem,4.7vw,4.8rem);line-height:.94;letter-spacing:-.035em;margin:15px 0 10px;color:white}.eventBody>p{max-width:620px;color:rgba(255,255,255,.7);font-size:.88rem;line-height:1.65;margin:0}
  .eventMeta{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}.eventMeta span{display:inline-flex;align-items:center;min-height:36px;padding:0 11px;border-radius:11px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09);font-size:.72rem;font-weight:800;color:rgba(255,255,255,.86)}
  .eventLineup{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:2px}.eventLineup div{padding:12px;border-radius:15px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.08)}.eventLineup b{display:block;color:white;font-size:.78rem;line-height:1.2}.eventLineup span{display:block;color:rgba(255,255,255,.5);font-size:.64rem;line-height:1.35;margin-top:4px}
  .eventSponsor{margin-top:10px;padding:11px 13px;border-left:3px solid var(--amber);background:rgba(240,154,82,.08);border-radius:0 12px 12px 0;color:#ffd7aa;font-size:.72rem;font-weight:800}.eventActions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.eventGhost{background:rgba(255,255,255,.07);color:white;border:1px solid rgba(255,255,255,.12)}
  @media(max-width:820px){.eventCard{grid-template-columns:1fr}.eventPoster{min-height:0;padding:16px 12px 18px}.eventPoster img{width:min(100%,320px)}.eventBody{padding:23px 18px 25px}.eventLineup{grid-template-columns:1fr}}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const promos = document.getElementById('promos');
  if (!promos || document.getElementById('eventos')) return;

  const section = document.createElement('section');
  section.className = 'section sand';
  section.id = 'eventos';
  section.innerHTML = `
    <div class="sectionHead"><h2 class="sectionTitle">Próximos eventos</h2><p>Música, activaciones y fechas especiales para vivir CHIDOLIRO de otra manera.</p></div>
    <article class="eventCard">
      <div class="eventPoster"><img id="eventPosterImg" alt="Cartel del 1er aniversario de CHIDOLIRO con los artistas invitados"></div>
      <div class="eventBody">
        <span class="eventKicker">1er aniversario · Dom 18 Oct</span>
        <h3>CHIDOLIRO cumple 1 año</h3>
        <p>Celebramos con música en vivo, los mejores imitadores, activación de Tesoro Azul, sorpresas y regalos en Nuevo Urecho.</p>
        <div class="eventMeta"><span>◷ Desde las 2 PM</span><span>⌖ Nuevo Urecho, Michoacán</span></div>
        <div class="eventLineup">
          <div><b>Jorge Luis Solís</b><span>El clon de Marco Antonio Solís</span></div>
          <div><b>La Rivereña Divina</b><span>La voz gemela de Jenny Rivera</span></div>
          <div><b>Pepé Mancilla</b><span>La leyenda continúa</span></div>
        </div>
        <div class="eventSponsor">Tesoro Azul · activación de 2 a 5 PM</div>
        <div class="eventActions">
          <a class="btn btnOrange" target="_blank" rel="noopener" href="https://wa.me/524521590691?text=Hola%20CHIDOLIRO%2C%20quiero%20reservar%20para%20el%201er%20Aniversario%20del%2018%20de%20octubre.">Reservar por WhatsApp</a>
          <a class="btn eventGhost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=Nacional+s%2Fn%2C+61750+Nuevo+Urecho%2C+Michoac%C3%A1n">Cómo llegar</a>
        </div>
      </div>
    </article>`;
  promos.insertAdjacentElement('afterend', section);

  const posterWrap = section.querySelector('.eventPoster');
  const poster = section.querySelector('#eventPosterImg');
  const posterParts = Array.from({length:7}, (_,i) => `assets/evento-aniversario-clean-v4/part-${String(i+1).padStart(2,'0')}.txt?v=5`);
  Promise.all(posterParts.map(url => fetch(url,{cache:'force-cache'}).then(r => {
    if (!r.ok) throw new Error('No se pudo cargar el cartel');
    return r.text();
  }))).then(parts => {
    poster.onload = () => posterWrap.classList.add('loaded');
    poster.onerror = () => {
      posterWrap.classList.add('loaded');
      poster.style.display='none';
    };
    poster.src = 'data:image/webp;base64,' + parts.join('');
  }).catch(() => {
    posterWrap.classList.add('loaded');
    poster.style.display='none';
  });

  const nav = document.querySelector('.navlinks');
  if (nav && !nav.querySelector('a[href="#eventos"]')) {
    const link = document.createElement('a');
    link.href = '#eventos';
    link.textContent = 'Eventos';
    const visit = nav.querySelector('a[href="#visita"]');
    visit ? nav.insertBefore(link, visit) : nav.appendChild(link);
  }
})();