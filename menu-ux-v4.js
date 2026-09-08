(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const CART_KEY = 'chidoliro_order_cart_v1';
  let menuBundle = null;
  let refreshTimer = null;

  function cart() {
    try {
      const value = window.CHIDOLIRO_ORDER?.getCart?.() || JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function money(value) {
    return '$' + Number(value || 0).toLocaleString('es-MX', { maximumFractionDigits: 2 });
  }

  function injectStyles() {
    if ($('#chidoliroMenuUxV4Styles')) return;
    const style = document.createElement('style');
    style.id = 'chidoliroMenuUxV4Styles';
    style.textContent = `
      #menuSheet .sheet{scroll-padding-top:150px}
      #menuSheet .menuItem{overflow:hidden}
      #menuSheet .menuItemBody p:empty{display:none}
      #menuSheet .menuItemBottom button{display:inline-flex;align-items:center;justify-content:center;gap:3px;transition:.16s ease}
      #menuSheet .menuItemBottom button.inCart{min-width:54px;background:var(--ocean);color:white}
      .cardQty{font-size:.68rem;font-weight:900;line-height:1}
      .menuNavDock{background:var(--cream);z-index:15}
      .categoryCount{display:inline-grid;place-items:center;min-width:20px;height:20px;margin-left:5px;padding:0 5px;border-radius:999px;background:rgba(8,42,49,.07);font-size:.57rem;font-weight:900;color:inherit}
      #menuSheet .menuTabs button.active .categoryCount{background:rgba(255,255,255,.16)}
      #menuHint .resultCount{color:var(--teal);font-weight:900}
      #menuSheet .cartBar{transition:.2s ease}
      #menuSheet .cartBar.menuCartEmpty{min-height:46px;padding:8px 12px;border-radius:15px;background:rgba(8,42,49,.92);box-shadow:0 8px 22px rgba(0,0,0,.14)}
      #menuSheet .cartBar.menuCartEmpty>div>div{display:none}
      #menuSheet .cartBar.menuCartEmpty button{display:none}
      #menuSheet .cartBar:not(.menuCartEmpty) button{min-width:116px}
      .menuScrollTop{display:none;position:fixed;z-index:925;right:14px;bottom:92px;width:42px;height:42px;border:0;border-radius:14px;background:white;color:var(--ocean);box-shadow:0 10px 26px rgba(0,0,0,.18);font-weight:900}
      #menuSheet.menuDeepScroll .menuScrollTop{display:grid;place-items:center}
      .menuItemImageWrap{position:relative;overflow:hidden;background:#e7dfd2}
      .menuItemImageWrap img{width:100%!important;height:100%!important;object-fit:cover!important}
      .menuPhotoBadge{position:absolute;left:7px;bottom:7px;padding:4px 7px;border-radius:999px;background:rgba(3,25,29,.72);backdrop-filter:blur(8px);color:white;font-size:.51rem;font-weight:900;letter-spacing:.04em}
      @media(max-width:700px){
        #menuSheet .sheet{padding:calc(10px + env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom))!important}
        #menuSheet .sheetHead{top:0!important;margin:calc(-10px - env(safe-area-inset-top)) -10px 0!important;padding:calc(18px + env(safe-area-inset-top)) 16px 12px!important;background:rgba(246,240,231,.97)!important;backdrop-filter:blur(18px);border-bottom:1px solid transparent;transition:.2s ease;min-height:104px;align-items:flex-start}
        #menuSheet .sheetHead h3{font-size:clamp(2.35rem,10.5vw,3rem)!important;max-width:270px;transition:.2s ease;margin:0!important}
        #menuSheet .sheetHead:after{position:absolute;right:18px;top:calc(26px + env(safe-area-inset-top));width:190px;max-width:34vw;line-height:1.25;margin:0!important;text-align:left}
        #menuSheet .sheetHead .close{flex:0 0 42px;margin-left:auto;z-index:2}
        #menuSheet .sheet.menuScrolled .sheetHead{min-height:58px;padding:calc(9px + env(safe-area-inset-top)) 12px 8px!important;border-bottom-color:var(--line);align-items:center}
        #menuSheet .sheet.menuScrolled .sheetHead h3{font-size:0!important;line-height:1;max-width:none}
        #menuSheet .sheet.menuScrolled .sheetHead h3:after{content:'Menú CHIDOLIRO';font-family:'DM Sans',sans-serif;font-size:.92rem;letter-spacing:.05em;font-weight:900;color:var(--ocean)}
        #menuSheet .sheet.menuScrolled .sheetHead:after{display:none}
        #menuSheet .sheet.menuScrolled .sheetHead .close{width:38px;height:38px;margin-left:auto}
        .menuNavDock{position:sticky;top:104px;margin:0 -2px;padding:8px 2px 7px;transition:top .2s ease;border-bottom:1px solid transparent}
        #menuSheet .sheet.menuScrolled .menuNavDock{top:58px;border-bottom-color:rgba(21,39,40,.07);box-shadow:0 10px 18px rgba(246,240,231,.92)}
        #menuSheet .menuSearchWrap{position:relative!important;top:auto!important;padding:0 0 7px!important;background:transparent!important}
        #menuSheet .menuSearch{min-height:44px;border-radius:14px;padding:0 13px;font-size:.84rem}
        #menuSheet .menuLiveBadge{font-size:.58rem;margin:5px 0 0 2px}
        #menuSheet .menuTabs{margin:0!important;padding:0 0 2px!important;gap:6px}
        #menuSheet .menuTabs button{min-height:37px;padding:0 11px!important;font-size:.64rem!important;display:inline-flex;align-items:center}
        #menuHint{margin:9px 0 10px;padding:9px 10px;font-size:.64rem}
        #menuSheet .menuItems{gap:9px!important}
        #menuSheet .menuItem{grid-template-columns:106px minmax(0,1fr)!important;min-height:112px!important;border-radius:18px!important;box-shadow:0 6px 18px rgba(5,27,31,.065)!important}
        #menuSheet .menuItem>img{height:112px!important;min-height:112px!important}
        #menuSheet .menuItem .menuItemImageWrap{height:112px;min-height:112px}
        #menuSheet .menuItemBody{padding:9px 10px 9px!important;min-height:112px}
        #menuSheet .menuItemBody .foodTag{font-size:.52rem!important;letter-spacing:.12em;line-height:1.1;margin-bottom:2px}
        #menuSheet .menuItemBody h4{font-size:1.08rem!important;line-height:1.02!important;margin:0 0 3px!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        #menuSheet .menuItemBody p{font-size:.61rem!important;line-height:1.28!important;margin:3px 0 4px!important;-webkit-line-clamp:1!important}
        #menuSheet .menuBadge{font-size:.47rem!important;padding:3px 6px!important;margin:0 0 3px!important}
        #menuSheet .menuItemBottom{padding-top:6px!important;margin-top:auto!important}
        #menuSheet .menuItemBottom b{font-size:.8rem!important}
        #menuSheet .menuItemBottom button{min-width:38px!important;width:38px!important;height:36px!important;padding:0 7px!important;border-radius:11px!important;font-size:.98rem}
        #menuSheet .menuItemBottom button.inCart{width:auto!important;min-width:48px!important}
        #menuSheet .cartBar{bottom:4px!important;margin-top:9px!important;border-radius:16px!important;padding:9px 11px!important}
        #menuSheet .cartBar b{font-size:.72rem}
        #menuSheet .cartBar>div>div{font-size:.58rem!important}
        #menuSheet .cartBar button{padding:9px 12px!important;font-size:.72rem!important}
        #productDetailSheet .productDetailHero{height:38vh!important;max-height:340px!important}
        #productDetailSheet .productDetailBody{padding:17px 16px calc(18px + env(safe-area-inset-bottom))!important}
        #productDetailSheet .productDetailBody h3{font-size:1.9rem!important}
        #productDetailSheet .productDetailBody p{font-size:.76rem!important;margin-bottom:13px!important}
      }
      @media(max-width:380px){
        #menuSheet .sheetHead h3{font-size:2.25rem!important;max-width:240px}
        #menuSheet .sheetHead:after{max-width:31vw;font-size:.58rem}
        #menuSheet .menuItem{grid-template-columns:96px minmax(0,1fr)!important;min-height:106px!important}
        #menuSheet .menuItem>img,#menuSheet .menuItem .menuItemImageWrap{height:106px!important;min-height:106px!important}
        #menuSheet .menuItemBody{min-height:106px}
        #menuSheet .menuItemBody h4{font-size:1rem!important}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureNavDock() {
    const sheet = $('#menuSheet .sheet');
    const search = $('#menuSearchWrap');
    const tabs = $('#menuTabs');
    if (!sheet || !search || !tabs) return;
    let dock = $('#menuNavDock');
    if (!dock) {
      dock = document.createElement('div');
      dock.id = 'menuNavDock';
      dock.className = 'menuNavDock';
      const hint = $('#menuHint');
      const anchor = search.parentNode;
      anchor.insertBefore(dock, search);
      dock.appendChild(search);
      dock.appendChild(tabs);
      if (hint) dock.insertAdjacentElement('afterend', hint);
    }
  }

  async function loadBundle() {
    if (menuBundle) return menuBundle;
    try {
      const response = await fetch('/api/menu', { cache: 'no-store' });
      const payload = await response.json();
      if (response.ok && payload?.ok && payload?.data) menuBundle = payload.data;
    } catch (_) {}
    return menuBundle;
  }

  async function decorateCategoryCounts() {
    const data = await loadBundle();
    if (!data?.items?.length) return;
    const counts = new Map();
    data.items.forEach(item => {
      if (item.is_active === false) return;
      counts.set(item.category_id, (counts.get(item.category_id) || 0) + 1);
    });
    const featured = data.items.filter(item => item.is_active !== false && item.is_featured).length;
    const all = data.items.filter(item => item.is_active !== false).length;
    $$('#menuTabs button[data-category]').forEach(button => {
      if ($('.categoryCount', button)) return;
      const key = button.dataset.category;
      const count = key === 'featured' ? featured : key === 'all' ? all : (counts.get(key) || 0);
      if (!count) return;
      const badge = document.createElement('span');
      badge.className = 'categoryCount';
      badge.textContent = count;
      button.appendChild(badge);
    });
  }

  function centerActiveCategory() {
    const active = $('#menuTabs button.active');
    if (!active) return;
    requestAnimationFrame(() => active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }));
  }

  function updateResultHint() {
    const hint = $('#menuHint');
    if (!hint) return;
    const count = $$('#menuItems .menuItem').length;
    const right = hint.lastElementChild;
    if (right) {
      right.classList.add('resultCount');
      right.textContent = count ? `${count} platillo${count === 1 ? '' : 's'}` : 'Sin resultados';
    }
  }

  function wrapImages() {
    $$('#menuItems .menuItem').forEach(card => {
      const img = card.querySelector(':scope > img');
      if (!img || img.parentElement?.classList.contains('menuItemImageWrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'menuItemImageWrap';
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
      const name = $('h4', card)?.textContent || '';
      if (/molcajete|torre|charola|grosería|aguachilón/i.test(name)) {
        const badge = document.createElement('span');
        badge.className = 'menuPhotoBadge';
        badge.textContent = /charola|molcajete|torre|grosería/i.test(name) ? 'Para compartir' : 'Favorito';
        wrap.appendChild(badge);
      }
    });
  }

  function updateCartUi() {
    const lines = cart();
    const count = lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
    const total = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0);
    const bar = $('#menuSheet .cartBar');
    if (bar) {
      bar.classList.toggle('menuCartEmpty', count === 0);
      const button = $('button', bar);
      if (button && count > 0) button.textContent = `Ver pedido · ${money(total)}`;
    }
    $$('#menuItems [data-item-id]').forEach(button => {
      const qty = lines.filter(line => String(line.itemId) === String(button.dataset.itemId)).reduce((sum, line) => sum + Number(line.quantity || 0), 0);
      button.classList.toggle('inCart', qty > 0);
      if (qty > 0) {
        button.innerHTML = `＋<span class="cardQty">${qty}</span>`;
        button.setAttribute('aria-label', `Agregar otra unidad. ${qty} en el pedido`);
      } else {
        button.textContent = button.textContent.trim() === '?' ? '?' : '＋';
      }
    });
  }

  function installScrollBehavior() {
    const sheet = $('#menuSheet .sheet');
    const bg = $('#menuSheet');
    if (!sheet || sheet.dataset.compactScrollBound === '1') return;
    sheet.dataset.compactScrollBound = '1';
    let ticking = false;
    const apply = () => {
      ticking = false;
      const y = sheet.scrollTop;
      sheet.classList.toggle('menuScrolled', y > 76);
      bg?.classList.toggle('menuDeepScroll', y > 520);
    };
    sheet.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }, { passive: true });
    apply();
  }

  function ensureScrollTop() {
    const bg = $('#menuSheet');
    const sheet = $('#menuSheet .sheet');
    if (!bg || !sheet || $('#menuScrollTop', bg)) return;
    const button = document.createElement('button');
    button.id = 'menuScrollTop';
    button.className = 'menuScrollTop';
    button.type = 'button';
    button.setAttribute('aria-label', 'Volver arriba del menú');
    button.textContent = '↑';
    button.addEventListener('click', () => sheet.scrollTo({ top: 0, behavior: 'smooth' }));
    bg.appendChild(button);
  }

  function lazyAndAccessible() {
    $$('#menuItems img').forEach(img => {
      img.loading = 'lazy';
      img.decoding = 'async';
    });
    $$('#menuTabs button').forEach(button => button.setAttribute('aria-label', `Filtrar por ${button.textContent.trim()}`));
  }

  function refreshDynamicUi() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      ensureNavDock();
      wrapImages();
      updateResultHint();
      updateCartUi();
      lazyAndAccessible();
      decorateCategoryCounts();
    }, 30);
  }

  function bindCategoryCentering() {
    document.addEventListener('click', event => {
      if (!event.target.closest('#menuTabs button')) return;
      setTimeout(() => {
        centerActiveCategory();
        refreshDynamicUi();
      }, 30);
    }, true);
  }

  function bindAddFeedback() {
    document.addEventListener('click', event => {
      const button = event.target.closest('#menuItems [data-item-id], #modifierSubmit, #productDetailAdd');
      if (!button) return;
      if (navigator.vibrate) navigator.vibrate(10);
      const original = button.innerHTML;
      if (button.matches('#menuItems [data-item-id]')) button.innerHTML = '✓';
      setTimeout(() => {
        if (button.isConnected && button.matches('#menuItems [data-item-id]') && !button.classList.contains('inCart')) button.innerHTML = original;
        updateCartUi();
      }, 260);
      setTimeout(updateCartUi, 700);
    }, true);
  }

  function observe() {
    const target = $('#menuSheet');
    if (!target) return;
    const observer = new MutationObserver(mutations => {
      const relevant = mutations.some(m => {
        const node = m.target;
        return node?.id === 'menuItems' || node?.id === 'menuTabs' || node?.id === 'cartCount' || node?.closest?.('#menuItems,#menuTabs,.cartBar');
      });
      if (relevant) refreshDynamicUi();
    });
    observer.observe(target, { childList: true, subtree: true, characterData: true });
  }

  function start() {
    injectStyles();
    ensureNavDock();
    installScrollBehavior();
    ensureScrollTop();
    bindCategoryCentering();
    bindAddFeedback();
    observe();
    refreshDynamicUi();
    setTimeout(refreshDynamicUi, 600);
    setTimeout(refreshDynamicUi, 1800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();