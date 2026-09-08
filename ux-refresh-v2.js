(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function money(value) {
    return '$' + Number(value || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  function getCart() {
    try {
      return Array.isArray(window.CHIDOLIRO_ORDER?.getCart?.())
        ? window.CHIDOLIRO_ORDER.getCart()
        : [];
    } catch (_) {
      return [];
    }
  }

  function injectStyles() {
    if ($('#chidoliroUxRefreshV2Styles')) return;
    const style = document.createElement('style');
    style.id = 'chidoliroUxRefreshV2Styles';
    style.textContent = `
      :root{--nav-safe:calc(86px + env(safe-area-inset-bottom))}
      .heroTrust{display:flex;flex-wrap:wrap;gap:7px;margin-top:15px}
      .heroTrust span{display:inline-flex;align-items:center;min-height:30px;padding:0 10px;border-radius:999px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.13);color:rgba(255,255,255,.88);font-size:.66rem;font-weight:800;backdrop-filter:blur(8px)}
      .sectionMicrocopy{margin-top:7px!important;font-size:.73rem!important}
      .promoCta{margin-top:14px;align-self:flex-start;border:0;border-radius:14px;min-height:43px;padding:0 15px;background:var(--amber);color:#25160b;font-weight:900;box-shadow:0 8px 20px rgba(0,0,0,.12)}
      .promoCta:active{transform:scale(.98)}
      .visitQuickFacts{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0 3px}
      .visitQuickFacts span{display:inline-flex;align-items:center;gap:5px;padding:8px 10px;border-radius:999px;background:#eef0e9;color:var(--ocean);font-size:.68rem;font-weight:800}
      .menuBadge{display:inline-flex;align-items:center;width:max-content;margin:0 0 7px;padding:5px 8px;border-radius:999px;background:#fff0df;color:#7d4218;font-size:.58rem;font-weight:900;letter-spacing:.06em;text-transform:uppercase}
      .foodCard{cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}
      .foodCard:active{transform:scale(.988)}
      .uxAddPulse{animation:uxAddPulse .34s ease}
      @keyframes uxAddPulse{0%{transform:scale(1)}45%{transform:scale(.9)}100%{transform:scale(1)}}
      .bottomNav{padding-bottom:calc(6px + env(safe-area-inset-bottom));bottom:max(6px,env(safe-area-inset-bottom));}
      .bottomNav .primaryNav{min-width:0}
      .navOrderLabel{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 2px}
      .cartActive .bottomIcon{font-size:.95rem}
      .cartActive{background:var(--amber)!important;color:#25160b!important}
      .orderTop.hasCart{background:var(--amber);color:#25160b}
      .reviewTrust{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:10px;color:var(--muted);font-size:.66rem;font-weight:700}
      .reviewTrust strong{color:#f1a548;letter-spacing:.08em}
      .section[id]{scroll-margin-bottom:var(--nav-safe)}
      .sheet{padding-bottom:max(22px,calc(14px + env(safe-area-inset-bottom)))}
      @media(max-width:700px){
        body{padding-bottom:var(--nav-safe)!important}
        .app{padding-bottom:0}
        .section{padding:46px 14px}
        .sectionTitle{font-size:clamp(2.25rem,10vw,3.15rem);line-height:.98}
        #resenas .sectionTitle{font-size:clamp(2.1rem,9.2vw,2.85rem)}
        .sectionHead{margin-bottom:18px}
        .hero{min-height:86svh;padding-bottom:30px}
        .hero p{line-height:1.52}
        .heroActions{gap:8px}
        .heroActions .btn{min-height:52px}
        .foodCard{min-width:78vw;border-radius:22px}
        .foodCard img{height:274px}
        .foodOverlay{padding:52px 16px 15px}
        .cardTitle{font-size:1.62rem}
        .experienceRail .experienceCard{min-width:79vw;min-height:318px}
        .experienceText h3{font-size:1.72rem}
        .promoFocus{min-height:300px}
        .reviewCard{min-height:205px;padding:20px}
        .visitMedia{min-height:310px}
        .visitInfo{padding:19px}
        .visitInfo h3{font-size:1.9rem}
        footer{padding-bottom:calc(112px + env(safe-area-inset-bottom))}
        .bottomNav{width:calc(100% - 14px);grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;padding:6px;border-radius:20px}
        .bottomNav a,.bottomNav button{min-height:50px;border-radius:14px;font-size:.56rem}
        .bottomNav .primaryNav{transform:translateY(-6px);box-shadow:0 7px 16px rgba(240,154,82,.25)}
        .bottomIcon{font-size:.92rem}
        .topbar{border-radius:19px}
        .topactions button{white-space:nowrap}
      }
      @media(max-width:390px){
        .brand small{display:none}
        .brand b{font-size:.74rem}
        .orderTop{font-size:.72rem;padding:0 11px!important}
        .bottomNav a,.bottomNav button{font-size:.52rem}
        .foodCard{min-width:81vw}
      }
    `;
    document.head.appendChild(style);
  }

  function enhanceHero() {
    const heroContent = $('.heroContent');
    if (!heroContent || $('.heroTrust', heroContent)) return;
    const paragraph = $('p', heroContent);
    if (!paragraph) return;
    const trust = document.createElement('div');
    trust.className = 'heroTrust';
    trust.innerHTML = '<span>🦐 Mariscos</span><span>🥩 Carnes</span><span>🍹 Bebidas</span><span>🌅 Vista al atardecer</span>';
    paragraph.insertAdjacentElement('afterend', trust);
  }

  function enhancePromo() {
    const focus = $('#promoFocus');
    if (!focus || $('.promoCta', focus)) return;
    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'promoCta';
    cta.textContent = 'Ver opciones del menú';
    cta.addEventListener('click', () => window.openSheet?.('menuSheet'));
    focus.appendChild(cta);
  }

  function enhanceReviews() {
    const section = $('#resenas');
    if (!section) return;
    const copy = $('.sectionHead p', section);
    if (copy) copy.textContent = 'Vista previa de cómo lucirán las opiniones del restaurante.';
    const foot = $('.reviewFoot', section);
    if (foot) foot.textContent = 'Las reseñas verificadas se conectarán en la versión final.';
    if (!$('.reviewTrust', section)) {
      const trust = document.createElement('div');
      trust.className = 'reviewTrust';
      trust.innerHTML = '<strong>★★★★★</strong><span>Espacio preparado para reseñas verificadas</span>';
      $('.reviewBox', section)?.appendChild(trust);
    }
  }

  function enhanceVisit() {
    const info = $('.visitInfo');
    if (!info || $('.visitQuickFacts', info)) return;
    const paragraph = $('p', info);
    if (!paragraph) return;
    const facts = document.createElement('div');
    facts.className = 'visitQuickFacts';
    facts.innerHTML = '<span>📍 Nuevo Urecho</span><span>🌿 Naturaleza</span><span>🌅 Atardeceres</span>';
    paragraph.insertAdjacentElement('afterend', facts);
  }

  function enhanceFeaturedCards() {
    $$('#imperdibles .foodCard').forEach(card => {
      if (card.dataset.uxFeaturedBound === '1') return;
      card.dataset.uxFeaturedBound = '1';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      const open = event => {
        if (event?.target?.closest?.('button')) return;
        window.openSheet?.('menuSheet');
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(event);
        }
      });
    });
  }

  function enhanceMenuBadges() {
    const featured = new Set(['Aguachilón', 'Molcajete de mariscos', 'Pulpo zarandeado', 'Torre de mariscos']);
    $$('#menuItems .menuItem').forEach(card => {
      const name = $('h4', card)?.textContent?.trim();
      const body = $('.menuItemBody', card);
      if (!name || !body || $('.menuBadge', card) || !featured.has(name)) return;
      const badge = document.createElement('div');
      badge.className = 'menuBadge';
      badge.textContent = 'Imperdible';
      body.insertBefore(badge, body.firstChild);
    });
  }

  function updateOrderNav() {
    const cart = getCart();
    const count = cart.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
    const total = cart.reduce((sum, line) => sum + Number(line.unitPrice || 0) * Number(line.quantity || 0), 0);
    const navButton = $('.bottomNav .primaryNav');
    const topButton = $('.orderTop');

    if (navButton) {
      if (!navButton.dataset.uxCartBound) {
        navButton.dataset.uxCartBound = '1';
        navButton.removeAttribute('onclick');
        navButton.addEventListener('click', () => {
          const current = getCart();
          const hasItems = current.some(line => Number(line.quantity || 0) > 0);
          if (hasItems && window.CHIDOLIRO_ORDER?.openCheckout) window.CHIDOLIRO_ORDER.openCheckout();
          else window.openSheet?.('orderSheet');
        });
      }
      navButton.classList.toggle('cartActive', count > 0);
      navButton.innerHTML = count > 0
        ? `<span class="bottomIcon">🛍</span><span class="navOrderLabel">${count} · ${money(total)}</span>`
        : '<span class="bottomIcon">＋</span><span class="navOrderLabel">Pedir</span>';
      navButton.setAttribute('aria-label', count > 0 ? `Ver carrito: ${count} productos, ${money(total)}` : 'Crear pedido');
    }

    if (topButton) {
      topButton.classList.toggle('hasCart', count > 0);
      topButton.textContent = count > 0 ? `Ver pedido · ${count}` : 'Pedir para llevar';
    }
  }

  function bindAddFeedback() {
    document.addEventListener('click', event => {
      const button = event.target.closest('#menuItems .menuItemBottom button, #productDetailAdd, #imperdibles .plus');
      if (!button) return;
      button.classList.remove('uxAddPulse');
      requestAnimationFrame(() => button.classList.add('uxAddPulse'));
      setTimeout(updateOrderNav, 120);
      setTimeout(updateOrderNav, 420);
    }, true);
  }

  function observeDynamicUi() {
    const observer = new MutationObserver(mutations => {
      let menuChanged = false;
      let promoChanged = false;
      let cartChanged = false;
      for (const mutation of mutations) {
        const target = mutation.target;
        if (target?.id === 'menuItems' || target?.closest?.('#menuItems')) menuChanged = true;
        if (target?.id === 'promoFocus' || target?.closest?.('#promoFocus')) promoChanged = true;
        if (target?.id === 'cartCount' || target?.closest?.('#cartCount')) cartChanged = true;
      }
      if (menuChanged) enhanceMenuBadges();
      if (promoChanged) enhancePromo();
      if (cartChanged) updateOrderNav();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function activeNavigation() {
    const nav = $('.bottomNav');
    if (!nav || !('IntersectionObserver' in window)) return;
    const links = $$('a[href^="#"]', nav);
    const map = new Map(links.map(link => [link.getAttribute('href').slice(1), link]));
    const targets = ['inicio', 'imperdibles', 'visita'].map(id => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach(link => link.classList.remove('active'));
      const link = map.get(visible.target.id);
      if (link) link.classList.add('active');
    }, { rootMargin: '-20% 0px -55% 0px', threshold: [0.05, 0.2, 0.5] });
    targets.forEach(target => observer.observe(target));
  }

  function addAccessibility() {
    $$('.bottomNav button, .topbar button, .heroActions button').forEach(button => {
      if (!button.getAttribute('type')) button.setAttribute('type', 'button');
    });
    $('.bottomNav')?.setAttribute('aria-label', 'Navegación principal');
  }

  function start() {
    injectStyles();
    enhanceHero();
    enhancePromo();
    enhanceReviews();
    enhanceVisit();
    enhanceFeaturedCards();
    enhanceMenuBadges();
    updateOrderNav();
    bindAddFeedback();
    observeDynamicUi();
    activeNavigation();
    addAccessibility();
    setTimeout(updateOrderNav, 500);
    setTimeout(updateOrderNav, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();