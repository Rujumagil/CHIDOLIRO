(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=CHIDOLIRO+Nuevo+Urecho+Michoacan';

  function injectStyles() {
    if ($('#chidoliroPresentationV3Styles')) return;
    const style = document.createElement('style');
    style.id = 'chidoliroPresentationV3Styles';
    style.textContent = `
      .topbar,.topbar.compact{
        top:max(8px,env(safe-area-inset-top));
        width:min(calc(100% - 18px),1080px);
        padding:7px 9px;
        border-radius:20px;
        background:rgba(5,40,45,.9);
        border-color:rgba(255,255,255,.12);
        box-shadow:0 10px 32px rgba(0,0,0,.17);
      }
      .topbar.compact{max-width:760px}
      .topbar.compact .brand img{width:40px;height:40px}
      .topbar.compact .brand small{display:none}
      .heroStatus{display:flex;align-items:center;gap:8px;margin-top:12px;color:rgba(255,255,255,.74);font-size:.7rem;font-weight:700}
      .heroStatusDot{width:7px;height:7px;border-radius:50%;background:#7bc9c4;box-shadow:0 0 0 4px rgba(123,201,196,.12)}
      .featuredQuickNav{display:flex;gap:7px;overflow:auto;scrollbar-width:none;margin:-3px 0 17px;padding-bottom:2px}
      .featuredQuickNav::-webkit-scrollbar{display:none}
      .featuredQuickNav button{flex:0 0 auto;border:1px solid var(--line);border-radius:999px;background:#fffaf3;color:var(--ocean);padding:9px 12px;font-size:.69rem;font-weight:800}
      .featuredFooterCta{display:flex;justify-content:center;margin-top:14px}
      .featuredFooterCta .btn{min-width:min(100%,320px)}
      .chooseSection{background:#fffaf3}
      .chooseGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
      .chooseCard{border:1px solid var(--line);border-radius:24px;padding:20px;background:white;box-shadow:var(--shadow2);display:flex;flex-direction:column;min-height:245px}
      .chooseIcon{width:46px;height:46px;border-radius:15px;display:grid;place-items:center;background:#eef3ed;font-size:1.3rem;margin-bottom:18px}
      .chooseCard h3{font-family:'Fraunces',serif;font-size:1.65rem;line-height:1;margin:0 0 8px}
      .chooseCard p{font-size:.78rem;line-height:1.5;color:var(--muted);margin:0 0 18px}
      .chooseCard .btn{margin-top:auto;width:100%}
      .chooseCard.primary{background:var(--ocean);color:white;border-color:transparent}
      .chooseCard.primary p{color:rgba(255,255,255,.65)}
      .chooseCard.primary .chooseIcon{background:rgba(255,255,255,.09)}
      .experienceIntro{display:flex;gap:8px;flex-wrap:wrap;margin:-3px 0 16px}
      .experienceIntro span{padding:7px 10px;border-radius:999px;background:#fffaf3;border:1px solid var(--line);font-size:.65rem;font-weight:800;color:var(--ocean)}
      .reviewsGoogle{display:flex;justify-content:center;margin-top:14px}
      .reviewsGoogle a{display:inline-flex;align-items:center;gap:7px;padding:10px 14px;border-radius:999px;background:#fffaf3;border:1px solid var(--line);color:var(--ocean);font-size:.7rem;font-weight:800}
      .visitNotice{margin:16px 0 0;padding:12px 14px;border-radius:15px;background:#f4eee4;color:var(--muted);font-size:.72rem;line-height:1.45}
      .footerPro{display:grid;grid-template-columns:1.25fr .75fr .75fr;gap:28px;max-width:1050px;margin:auto}
      .footerProBrand{display:flex;gap:11px;align-items:flex-start}
      .footerProBrand img{width:52px;height:52px;object-fit:contain}
      .footerProBrand b{display:block;color:white;letter-spacing:.12em;margin-top:3px}
      .footerProBrand p{max-width:390px;font-size:.73rem;line-height:1.55;margin:8px 0 0;color:rgba(255,255,255,.55)}
      .footerColumn h4{margin:0 0 10px;color:white;font-size:.76rem;letter-spacing:.08em;text-transform:uppercase}
      .footerColumn a,.footerColumn button{display:block;border:0;background:none;padding:0;margin:0 0 8px;color:rgba(255,255,255,.62);font-size:.72rem;text-align:left;cursor:pointer}
      .footerColumn a:hover,.footerColumn button:hover{color:white}
      .footerBottom{max-width:1050px;margin:24px auto 0;padding-top:16px;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;gap:12px;color:rgba(255,255,255,.4);font-size:.64rem}
      @media(max-width:760px){
        .chooseGrid{grid-template-columns:1fr;gap:10px}
        .chooseCard{min-height:0;padding:18px;border-radius:21px}
        .chooseIcon{margin-bottom:12px}
        .chooseCard h3{font-size:1.55rem}
        .footerPro{grid-template-columns:1fr 1fr;gap:24px 18px}
        .footerProBrand{grid-column:1/-1}
      }
      @media(max-width:700px){
        .topbar,.topbar.compact{width:calc(100% - 14px);top:max(7px,env(safe-area-inset-top));padding:6px 8px}
        .topbar .brand img,.topbar.compact .brand img{width:40px;height:40px}
        .topbar .brand small{display:none}
        .topbar .orderTop{min-height:40px!important;font-size:.74rem;padding:0 13px!important}
        .bottomNav a,.bottomNav button{min-height:47px!important}
        .bottomNav .primaryNav{transform:translateY(-4px)!important}
        .heroStatus{font-size:.65rem}
        .chooseSection{padding-top:44px!important;padding-bottom:44px!important}
        .visitNotice{font-size:.69rem}
        footer{padding-left:18px;padding-right:18px}
      }
      @media(max-width:390px){
        .topbar .brand b{font-size:.7rem}
        .topbar .orderTop{font-size:.68rem;padding:0 10px!important}
        .footerPro{grid-template-columns:1fr}
        .footerProBrand{grid-column:auto}
        .footerBottom{display:block}
        .footerBottom span{display:block;margin-top:5px}
      }
    `;
    document.head.appendChild(style);
  }

  function injectSeo() {
    if (!document.querySelector('meta[property="og:title"]')) {
      const meta = [
        ['property', 'og:title', 'CHIDOLIRO · Surf & Turf MX'],
        ['property', 'og:description', 'Mariscos, carnes, bebidas y atardeceres en Nuevo Urecho, Michoacán.'],
        ['property', 'og:type', 'restaurant'],
        ['property', 'og:image', 'https://chidoliro.vercel.app/assets/hero.webp'],
        ['name', 'twitter:card', 'summary_large_image']
      ];
      meta.forEach(([kind, key, value]) => {
        const tag = document.createElement('meta');
        tag.setAttribute(kind, key);
        tag.content = value;
        document.head.appendChild(tag);
      });
    }
    if (!$('#chidoliroRestaurantSchema')) {
      const schema = document.createElement('script');
      schema.id = 'chidoliroRestaurantSchema';
      schema.type = 'application/ld+json';
      schema.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: 'CHIDOLIRO Surf & Turf MX',
        url: 'https://chidoliro.vercel.app/',
        image: 'https://chidoliro.vercel.app/assets/hero.webp',
        servesCuisine: ['Mariscos', 'Surf & Turf', 'Parrilla'],
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Nacional s/n',
          postalCode: '61750',
          addressLocality: 'Nuevo Urecho',
          addressRegion: 'Michoacán',
          addressCountry: 'MX'
        }
      });
      document.head.appendChild(schema);
    }
  }

  function enhanceHero() {
    const hero = $('.heroContent');
    if (!hero || $('.heroStatus', hero)) return;
    const actions = $('.heroActions', hero);
    if (!actions) return;
    const status = document.createElement('div');
    status.className = 'heroStatus';
    status.innerHTML = '<span class="heroStatusDot"></span><span>Nuevo Urecho · Reserva, pide o planea tu visita desde aquí</span>';
    actions.insertAdjacentElement('afterend', status);
  }

  function enhanceImperdibles() {
    const section = $('#imperdibles');
    if (!section || $('.featuredQuickNav', section)) return;
    const head = $('.sectionHead', section);
    const rail = $('.rail', section);
    if (!head || !rail) return;

    const nav = document.createElement('div');
    nav.className = 'featuredQuickNav';
    nav.innerHTML = ['🦐 Mariscos', '🔥 Parrilla', '🌮 Tacos', '🍹 Bebidas'].map(label => `<button type="button">${label}</button>`).join('');
    $$('button', nav).forEach(button => button.addEventListener('click', () => window.openSheet?.('menuSheet')));
    head.insertAdjacentElement('afterend', nav);

    const footer = document.createElement('div');
    footer.className = 'featuredFooterCta';
    footer.innerHTML = '<button type="button" class="btn btnDark">Ver menú completo</button>';
    $('button', footer)?.addEventListener('click', () => window.openSheet?.('menuSheet'));
    rail.insertAdjacentElement('afterend', footer);
  }

  function addChooseSection() {
    if ($('#eligeTuPlan')) return;
    const promos = $('#promos');
    if (!promos) return;
    const section = document.createElement('section');
    section.className = 'section chooseSection';
    section.id = 'eligeTuPlan';
    section.innerHTML = `
      <div class="sectionHead">
        <h2 class="sectionTitle">Elige cómo vivir CHIDOLIRO</h2>
        <p>Tu visita, tu pedido o tu próxima escapada: empieza desde aquí.</p>
      </div>
      <div class="chooseGrid">
        <article class="chooseCard primary">
          <div class="chooseIcon">🍽️</div>
          <h3>Comer aquí</h3>
          <p>Reserva una mesa y disfruta la comida, la naturaleza y el atardecer.</p>
          <button type="button" class="btn btnOrange" data-action="reserve">Reservar mesa</button>
        </article>
        <article class="chooseCard">
          <div class="chooseIcon">🥡</div>
          <h3>Para llevar</h3>
          <p>Explora el menú, arma tu pedido desde el celular y continúa con la orden.</p>
          <button type="button" class="btn btnDark" data-action="order">Hacer pedido</button>
        </article>
        <article class="chooseCard">
          <div class="chooseIcon">🌅</div>
          <h3>Conocer CHIDOLIRO</h3>
          <p>Descubre la experiencia, la ubicación y cómo llegar a Nuevo Urecho.</p>
          <a class="btn btnWhite" style="border:1px solid var(--line)" href="#visita">Planear visita</a>
        </article>
      </div>
    `;
    $('[data-action="reserve"]', section)?.addEventListener('click', () => window.openSheet?.('reserveSheet'));
    $('[data-action="order"]', section)?.addEventListener('click', () => window.openSheet?.('orderSheet'));
    promos.insertAdjacentElement('afterend', section);
  }

  function enhanceExperience() {
    const section = $('#experiencia');
    if (!section || $('.experienceIntro', section)) return;
    const head = $('.sectionHead', section);
    const rail = $('.experienceRail', section);
    if (!head || !rail) return;
    const intro = document.createElement('div');
    intro.className = 'experienceIntro';
    intro.innerHTML = '<span>🌅 Vista</span><span>🍤 Sabor</span><span>🍹 Ambiente</span><span>🌿 Naturaleza</span>';
    head.insertAdjacentElement('afterend', intro);

    if ($$('.experienceCard', rail).length < 4) {
      const card = document.createElement('article');
      card.className = 'experienceCard';
      card.innerHTML = '<img src="assets/gallery-03.webp" alt="Experiencia CHIDOLIRO"><div class="experienceText"><h3>Comparte el momento</h3><p>Una salida para comer, brindar y disfrutar sin prisa.</p></div>';
      card.addEventListener('click', () => window.openGallery?.(3));
      rail.appendChild(card);
    }
  }

  function enhanceReviews() {
    const section = $('#resenas');
    if (!section) return;
    const copy = $('.sectionHead p', section);
    if (copy) copy.textContent = 'Sabores, ambiente y momentos que hacen que la visita se recuerde.';
    const foot = $('.reviewFoot', section);
    if (foot) foot.textContent = 'Próximamente: conexión directa con las reseñas del perfil de Google.';
    const trust = $('.reviewTrust', section);
    if (trust) trust.remove();
    if (!$('.reviewsGoogle', section)) {
      const box = $('.reviewBox', section);
      const cta = document.createElement('div');
      cta.className = 'reviewsGoogle';
      cta.innerHTML = `<a href="${MAPS_URL}" target="_blank" rel="noopener">★★★★★ Buscar CHIDOLIRO en Google</a>`;
      box?.appendChild(cta);
    }
  }

  function enhanceVisit() {
    const section = $('#visita');
    const info = $('.visitInfo', section);
    if (!section || !info || $('.visitNotice', info)) return;
    const meta = $('.visitMeta', info);
    if (meta) {
      meta.innerHTML = `
        <div class="metaItem"><span class="metaIcon">⌖</span><span>Nacional s/n · 61750 Nuevo Urecho, Michoacán.</span></div>
        <div class="metaItem"><span class="metaIcon">◷</span><span>Reserva tu mesa directamente desde la página.</span></div>
        <div class="metaItem"><span class="metaIcon">🥡</span><span>Explora el menú y prepara tu pedido para llevar.</span></div>
        <div class="metaItem"><span class="metaIcon">🌅</span><span>Ideal para comida, tarde y atardecer.</span></div>
      `;
    }
    const notice = document.createElement('div');
    notice.className = 'visitNotice';
    notice.textContent = 'Para consultar horarios y disponibilidad del día, revisa el perfil de Google o inicia una reservación.';
    $('.visitActions', info)?.insertAdjacentElement('beforebegin', notice);

    const maps = $('.visitActions a', info);
    if (maps) maps.href = MAPS_URL;
  }

  function enhanceFooter() {
    const footer = $('footer');
    if (!footer || $('.footerPro', footer)) return;
    const year = new Date().getFullYear();
    footer.innerHTML = `
      <div class="footerPro">
        <div class="footerProBrand">
          <img src="assets/logo.png" alt="CHIDOLIRO">
          <div>
            <b>CHIDOLIRO</b>
            <div style="font-size:.62rem;color:var(--aqua);font-weight:800;letter-spacing:.11em;margin-top:3px">SURF & TURF MX</div>
            <p>Mariscos, carnes, bebidas y una experiencia entre naturaleza en Nuevo Urecho, Michoacán.</p>
          </div>
        </div>
        <div class="footerColumn">
          <h4>Explora</h4>
          <button type="button" data-footer-menu>Ver menú</button>
          <a href="#promos">Promociones</a>
          <a href="#experiencia">La experiencia</a>
          <a href="#resenas">Opiniones</a>
        </div>
        <div class="footerColumn">
          <h4>Visita</h4>
          <button type="button" data-footer-reserve>Reservar mesa</button>
          <button type="button" data-footer-order>Pedir para llevar</button>
          <a href="${MAPS_URL}" target="_blank" rel="noopener">Cómo llegar</a>
          <span style="display:block;color:rgba(255,255,255,.45);font-size:.7rem;line-height:1.45">Nacional s/n · 61750 Nuevo Urecho</span>
        </div>
      </div>
      <div class="footerBottom">
        <div>© ${year} CHIDOLIRO Surf & Turf MX.</div>
        <span>Nuevo Urecho, Michoacán · México</span>
      </div>
    `;
    $('[data-footer-menu]', footer)?.addEventListener('click', () => window.openSheet?.('menuSheet'));
    $('[data-footer-reserve]', footer)?.addEventListener('click', () => window.openSheet?.('reserveSheet'));
    $('[data-footer-order]', footer)?.addEventListener('click', () => window.openSheet?.('orderSheet'));
  }

  function addAriaLabels() {
    $('.orderTop')?.setAttribute('aria-label', 'Pedir para llevar');
    $$('.plus').forEach(button => button.setAttribute('aria-label', 'Agregar o ver producto'));
    $('.galleryPrev')?.setAttribute('aria-label', 'Foto anterior');
    $('.galleryNext')?.setAttribute('aria-label', 'Foto siguiente');
    $('.galleryClose')?.setAttribute('aria-label', 'Cerrar galería');
  }

  function start() {
    injectStyles();
    injectSeo();
    enhanceHero();
    enhanceImperdibles();
    addChooseSection();
    enhanceExperience();
    enhanceReviews();
    enhanceVisit();
    enhanceFooter();
    addAriaLabels();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();