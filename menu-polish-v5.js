(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const CART_KEY = 'chidoliro_order_cart_v1';
  let bundleCache = null;
  let timer = null;

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function cart() {
    try {
      const value = window.CHIDOLIRO_ORDER?.getCart?.() || JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function injectStyles() {
    if ($('#chidoliroMenuPolishV5Styles')) return;
    const style = document.createElement('style');
    style.id = 'chidoliroMenuPolishV5Styles';
    style.textContent = `
      #menuSheet .menuTabs{position:relative}
      #menuSheet .menuTabs:not(.tabsAtEnd){
        -webkit-mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 24px),transparent 100%);
        mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 24px),transparent 100%);
      }
      #menuSheet .cartBar.menuCartEmpty{
        width:max-content!important;
        max-width:calc(100% - 18px);
        min-height:40px!important;
        padding:7px 11px!important;
        margin-left:3px!important;
        margin-right:auto!important;
        border-radius:999px!important;
        background:rgba(8,42,49,.94)!important;
      }
      #menuSheet .cartBar.menuCartEmpty b{font-size:0!important;white-space:nowrap}
      #menuSheet .cartBar.menuCartEmpty #cartCount{display:none!important}
      #menuSheet .cartBar.menuCartEmpty .emptyCartLabel{display:inline-flex!important;align-items:center;gap:6px;font-size:.66rem!important;font-weight:800;color:white}
      #menuSheet .cartBar:not(.menuCartEmpty) .emptyCartLabel{display:none!important}
      #menuSheet .cartBar:not(.menuCartEmpty){width:100%}
      #menuSheet .menuScrollTop{right:auto!important;left:14px!important;bottom:calc(78px + env(safe-area-inset-bottom))!important;width:38px!important;height:38px!important;border-radius:13px!important;font-size:.9rem!important;background:rgba(255,255,255,.95)!important}
      #menuSheet .menuItemBody h4{word-break:normal;overflow-wrap:anywhere}
      @media(max-width:700px){
        #menuSheet .sheetHead{
          min-height:82px!important;
          padding:calc(14px + env(safe-area-inset-top)) 14px 10px!important;
          align-items:center!important;
        }
        #menuSheet .sheetHead>div:first-child{width:calc(100% - 54px);min-width:0}
        #menuSheet .sheetHead h3{
          font-size:clamp(2.05rem,8.7vw,2.55rem)!important;
          line-height:.96!important;
          max-width:470px!important;
          letter-spacing:-.035em!important;
        }
        #menuSheet .sheetHead:after{display:none!important}
        #menuSheet .sheetHead .close{position:absolute;right:12px;top:calc(14px + env(safe-area-inset-top));width:42px!important;height:42px!important}
        #menuSheet .sheet.menuScrolled .sheetHead{
          min-height:54px!important;
          padding:calc(8px + env(safe-area-inset-top)) 12px 7px!important;
        }
        #menuSheet .sheet.menuScrolled .sheetHead .close{top:calc(8px + env(safe-area-inset-top));width:38px!important;height:38px!important}
        .menuNavDock{top:82px!important;padding-top:6px!important}
        #menuSheet .sheet.menuScrolled .menuNavDock{top:54px!important}
        #menuSheet .menuSearch{min-height:42px!important}
        #menuSheet .menuLiveBadge{margin-top:4px!important;font-size:.56rem!important}
        #menuSheet .menuTabs{gap:5px!important}
        #menuSheet .menuTabs button{min-height:35px!important;padding:0 10px!important}
        #menuHint{margin:7px 0 9px!important;min-height:36px;padding:8px 10px!important}
        #menuSheet .menuItems{gap:8px!important}
        #menuSheet .menuItem{min-height:108px!important}
        #menuSheet .menuItem .menuItemImageWrap,#menuSheet .menuItem>img{height:108px!important;min-height:108px!important}
        #menuSheet .menuItemBody{min-height:108px!important;padding:8px 10px!important}
        #menuSheet .menuItemBody h4{font-size:1.04rem!important;line-height:1.02!important}
        #menuSheet .menuItemBody p{margin:2px 0 3px!important}
        #menuSheet .menuItemBottom{padding-top:5px!important}
      }
      @media(max-width:390px){
        #menuSheet .sheetHead h3{font-size:2rem!important;max-width:290px!important}
        #menuSheet .sheetHead{min-height:78px!important}
        .menuNavDock{top:78px!important}
      }
    `;
    document.head.appendChild(style);
  }

  async function loadBundle() {
    if (bundleCache) return bundleCache;
    try {
      const response = await fetch('/api/menu', { cache: 'no-store' });
      const payload = await response.json();
      if (response.ok && payload?.ok && payload?.data) bundleCache = payload.data;
    } catch (_) {}
    return bundleCache;
  }

  function setLiveCopy() {
    const badge = $('#menuSheet .menuLiveBadge');
    if (badge && badge.textContent.trim() !== 'Menú actualizado en línea') badge.textContent = 'Menú actualizado en línea';
  }

  async function reorderCategories() {
    const tabs = $('#menuTabs');
    const data = await loadBundle();
    if (!tabs || !data?.categories) return;

    const byId = new Map(data.categories.map(category => [String(category.id), normalize(category.name)]));
    const priority = [
      'aguachiles',
      'mariscos calientes',
      'especialidades del mar',
      'tacos',
      'carnes',
      'ceviches',
      'entradas',
      'tostadas',
      'caldos',
      'cerveza',
      'bebidas con alcohol',
      'sin alcohol',
      'bebidas premium',
      'postres'
    ];
    const rank = name => {
      const index = priority.indexOf(name);
      return index >= 0 ? index + 1 : 60;
    };

    const buttons = $$('button[data-category]', tabs);
    if (buttons.length < 2) return;
    const sorted = [...buttons].sort((a, b) => {
      const aKey = String(a.dataset.category || '');
      const bKey = String(b.dataset.category || '');
      const aRank = aKey === 'featured' ? 0 : aKey === 'all' ? 100 : rank(byId.get(aKey) || '');
      const bRank = bKey === 'featured' ? 0 : bKey === 'all' ? 100 : rank(byId.get(bKey) || '');
      if (aRank !== bRank) return aRank - bRank;
      return buttons.indexOf(a) - buttons.indexOf(b);
    });

    const current = buttons.map(button => button.dataset.category).join('|');
    const next = sorted.map(button => button.dataset.category).join('|');
    if (current !== next) sorted.forEach(button => tabs.appendChild(button));
  }

  function installTabFade() {
    const tabs = $('#menuTabs');
    if (!tabs || tabs.dataset.fadeBound === '1') return;
    tabs.dataset.fadeBound = '1';
    const update = () => {
      const atEnd = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 8;
      tabs.classList.toggle('tabsAtEnd', atEnd);
    };
    tabs.addEventListener('scroll', update, { passive: true });
    requestAnimationFrame(update);
  }

  function polishEmptyCart() {
    const bar = $('#menuSheet .cartBar');
    if (!bar) return;
    const lines = cart();
    const count = lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
    const bold = $('b', bar);
    if (bold && !$('.emptyCartLabel', bold)) {
      const label = document.createElement('span');
      label.className = 'emptyCartLabel';
      label.textContent = '🛍 Tu pedido está vacío';
      bold.appendChild(label);
    }
    bar.classList.toggle('menuCartEmpty', count === 0);
  }

  async function restoreRealImages() {
    const data = await loadBundle();
    if (!data?.items?.length) return;
    const byName = new Map(data.items.filter(item => item.image_url).map(item => [normalize(item.name), item.image_url]));

    const apply = (card, titleSelector) => {
      const name = normalize($(titleSelector, card)?.textContent);
      const real = byName.get(name);
      const img = $('img', card);
      if (!real || !img) return;
      const src = String(real).startsWith('/') ? String(real).slice(1) : String(real);
      if (img.getAttribute('src') !== src) {
        img.src = src;
        img.dataset.realMenuImage = '1';
      }
    };

    $$('#menuItems .menuItem').forEach(card => apply(card, 'h4'));
    $$('#imperdibles .foodCard').forEach(card => apply(card, '.cardTitle'));
  }

  function improveHint() {
    const hint = $('#menuHint');
    if (!hint) return;
    const left = hint.firstElementChild;
    if (left && left.textContent !== 'Toca un platillo para ver detalles.') left.textContent = 'Toca un platillo para ver detalles.';
  }

  function refresh() {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      injectStyles();
      setLiveCopy();
      installTabFade();
      polishEmptyCart();
      improveHint();
      await reorderCategories();
      await restoreRealImages();
    }, 35);
  }

  function observe() {
    const menu = $('#menuSheet');
    if (!menu) return;
    const observer = new MutationObserver(mutations => {
      if (mutations.some(mutation => mutation.target?.closest?.('#menuItems,#menuTabs,.cartBar,#menuSearchWrap') || ['menuItems','menuTabs','cartCount'].includes(mutation.target?.id))) refresh();
    });
    observer.observe(menu, { childList: true, subtree: true, characterData: true });
    document.addEventListener('click', event => {
      if (event.target.closest('#menuTabs button,#menuItems [data-item-id],#modifierSubmit,#productDetailAdd')) {
        setTimeout(refresh, 80);
        setTimeout(refresh, 420);
      }
    }, true);
    window.addEventListener('storage', refresh);
  }

  function start() {
    injectStyles();
    observe();
    refresh();
    setTimeout(refresh, 600);
    setTimeout(refresh, 1800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
