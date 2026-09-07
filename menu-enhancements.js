(() => {
  'use strict';

  const BANK = () => window.CHIDOLIRO_GENERATED_IMAGES || {};
  const ALIASES = {
    'Baja Style · Pescado': 'Baja Style · Camarón'
  };

  function imageFor(name, category='') {
    const bank = BANK();
    if (name === 'Arrachera' && !/carnes/i.test(category)) return '';
    return bank[name] || bank[ALIASES[name]] || '';
  }

  function injectStyles() {
    if (document.getElementById('chidoliroMenuEnhancementStyles')) return;
    const style = document.createElement('style');
    style.id = 'chidoliroMenuEnhancementStyles';
    style.textContent = `
      #menuSheet .sheet{position:relative}
      #menuSheet .sheetHead{position:sticky;top:-22px;z-index:12;background:linear-gradient(180deg,var(--cream) 78%,rgba(246,240,231,0));padding:22px 0 15px;margin-top:-22px}
      #menuSheet .sheetHead h3{margin-bottom:4px}
      #menuSheet .sheetHead:after{content:'Menú vivo · precios y disponibilidad actualizados';display:block;color:var(--muted);font-size:.68rem;font-family:"DM Sans",sans-serif;margin-top:5px;font-weight:600}
      #menuSheet .menuTabs{padding-bottom:4px}
      #menuSheet .menuItem{cursor:pointer;transition:transform .18s ease,box-shadow .18s ease;border-radius:20px;box-shadow:0 8px 24px rgba(5,27,31,.07)}
      #menuSheet .menuItem:active{transform:scale(.985)}
      #menuSheet .menuItem img{height:190px;background:#e7dfd2;transition:opacity .2s ease}
      #menuSheet .menuItemBody{padding:13px 13px 14px}
      #menuSheet .menuItemBody h4{font-size:1.32rem;line-height:1.05}
      #menuSheet .menuItemBody p{min-height:0;line-height:1.45;margin:7px 0;color:var(--muted)}
      #menuSheet .menuItemBottom{border-top:1px solid var(--line);padding-top:10px;margin-top:10px}
      #menuSheet .menuItemBottom b{font-size:.92rem}
      #menuSheet .menuItemBottom button{width:auto;min-width:42px;padding:0 12px;font-weight:900;background:var(--amber);color:#25160b}
      #menuSheet .cartBar{z-index:10;box-shadow:0 12px 38px rgba(0,0,0,.2)}
      .menuHint{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:7px 0 12px;padding:11px 12px;border-radius:15px;background:#e9f0ec;border:1px solid rgba(19,122,126,.12);color:var(--ocean);font-size:.71rem;font-weight:700}
      .menuHint span:last-child{color:var(--teal);white-space:nowrap}
      #productDetailSheet .sheet{padding:0;overflow:hidden;background:var(--cream)}
      .productDetailHero{height:min(46vh,420px);position:relative;background:#ddd}
      .productDetailHero img{width:100%;height:100%;object-fit:cover}
      .productDetailHero:after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(3,25,29,.7),transparent 58%)}
      .productDetailClose{position:absolute;z-index:3;top:14px;right:14px;width:42px;height:42px;border:0;border-radius:14px;background:rgba(255,255,255,.92);color:var(--ocean);font-size:1.05rem}
      .productDetailTag{position:absolute;z-index:2;left:18px;bottom:18px;color:#aee3db;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;font-weight:900}
      .productDetailBody{padding:20px 20px calc(20px + env(safe-area-inset-bottom))}
      .productDetailBody h3{font-family:"Fraunces",serif;font-size:2.25rem;line-height:.95;margin:0 0 9px}
      .productDetailBody p{color:var(--muted);font-size:.83rem;line-height:1.55;margin:0 0 17px}
      .productDetailFooter{display:flex;gap:10px;align-items:center}
      .productDetailPrice{font-size:1.25rem;font-weight:900;min-width:92px}
      .productDetailAdd{flex:1;border:0;border-radius:16px;min-height:52px;background:var(--amber);color:#25160b;font-weight:900}
      #imperdibles .foodCard img{background:#dcd3c6}
      @media(max-width:700px){
        #menuSheet{padding:0;align-items:stretch}
        #menuSheet .sheet{width:100%;height:100dvh;max-height:none;border-radius:0;padding:calc(16px + env(safe-area-inset-top)) 12px calc(14px + env(safe-area-inset-bottom));}
        #menuSheet .sheetHead{top:calc(-16px - env(safe-area-inset-top));padding:calc(16px + env(safe-area-inset-top)) 2px 14px;margin-top:calc(-16px - env(safe-area-inset-top));}
        #menuSheet .menuItems{grid-template-columns:1fr;gap:12px}
        #menuSheet .menuItem{display:grid;grid-template-columns:132px 1fr;min-height:132px;overflow:hidden}
        #menuSheet .menuItem img{height:100%;min-height:132px}
        #menuSheet .menuItemBody{display:flex;flex-direction:column;min-width:0}
        #menuSheet .menuItemBody h4{font-size:1.24rem}
        #menuSheet .menuItemBody p{font-size:.7rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        #menuSheet .menuItemBottom{margin-top:auto}
        #productDetailSheet{padding:0;align-items:stretch}
        #productDetailSheet .sheet{width:100%;height:100dvh;max-height:none;border-radius:0}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureHint() {
    const searchWrap = document.getElementById('menuSearchWrap');
    if (!searchWrap || document.getElementById('menuHint')) return;
    const hint = document.createElement('div');
    hint.className = 'menuHint';
    hint.id = 'menuHint';
    hint.innerHTML = '<span>Toca un platillo para verlo a detalle.</span><span>Desliza categorías →</span>';
    searchWrap.insertAdjacentElement('afterend', hint);
  }

  function ensureDetailSheet() {
    if (document.getElementById('productDetailSheet')) return;
    const sheet = document.createElement('div');
    sheet.className = 'sheetBg';
    sheet.id = 'productDetailSheet';
    sheet.innerHTML = `<div class="sheet"><div class="productDetailHero"><img id="productDetailImage" alt=""><button class="productDetailClose" type="button">✕</button><div class="productDetailTag" id="productDetailCategory"></div></div><div class="productDetailBody"><h3 id="productDetailName"></h3><p id="productDetailDescription"></p><div class="productDetailFooter"><div class="productDetailPrice" id="productDetailPrice"></div><button class="productDetailAdd" id="productDetailAdd" type="button">Agregar al pedido</button></div></div></div>`;
    document.body.appendChild(sheet);
    sheet.addEventListener('click', e => { if (e.target === sheet && typeof closeSheets === 'function') closeSheets(); });
    sheet.querySelector('.productDetailClose').addEventListener('click', () => { if (typeof closeSheets === 'function') closeSheets(); });
  }

  function enhanceMenuCards() {
    const root = document.getElementById('menuItems');
    if (!root) return;
    root.querySelectorAll('.menuItem').forEach(card => {
      const name = card.querySelector('h4')?.textContent?.trim() || '';
      const category = card.querySelector('.foodTag')?.textContent?.trim() || '';
      const generated = imageFor(name, category);
      const img = card.querySelector('img');
      if (generated && img && img.dataset.generatedImage !== generated.slice(0,30)) {
        img.src = generated;
        img.dataset.generatedImage = generated.slice(0,30);
      }
      if (card.dataset.enhanced === '1') return;
      card.dataset.enhanced = '1';
      card.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        openProductDetail(card);
      });
    });
  }

  function enhanceFeatured() {
    document.querySelectorAll('#imperdibles .foodCard').forEach(card => {
      const name = card.querySelector('.cardTitle')?.textContent?.trim() || '';
      const category = card.querySelector('.foodTag')?.textContent?.trim() || '';
      const generated = imageFor(name, category);
      const img = card.querySelector('img');
      if (generated && img) img.src = generated;
    });
  }

  function openProductDetail(card) {
    ensureDetailSheet();
    const name = card.querySelector('h4')?.textContent?.trim() || '';
    const category = card.querySelector('.foodTag')?.textContent?.trim() || '';
    const description = card.querySelector('.menuItemBody p')?.textContent?.trim() || 'Uno de los sabores de CHIDOLIRO.';
    const price = card.querySelector('.menuItemBottom b')?.textContent?.trim() || 'Consultar';
    const img = card.querySelector('img')?.src || '';
    document.getElementById('productDetailName').textContent = name;
    document.getElementById('productDetailCategory').textContent = category;
    document.getElementById('productDetailDescription').textContent = description;
    document.getElementById('productDetailPrice').textContent = price;
    const hero = document.getElementById('productDetailImage'); hero.src = img; hero.alt = name;
    const originalButton = card.querySelector('.menuItemBottom button');
    const add = document.getElementById('productDetailAdd');
    const canAdd = originalButton && originalButton.textContent.trim() !== '?';
    add.textContent = canAdd ? 'Agregar al pedido' : 'Consultar precio';
    add.onclick = () => {
      if (typeof closeSheets === 'function') closeSheets();
      if (originalButton) setTimeout(() => originalButton.click(), 60);
    };
    if (typeof openSheet === 'function') openSheet('productDetailSheet');
  }

  function observe() {
    const observer = new MutationObserver(() => {
      ensureHint();
      enhanceMenuCards();
      enhanceFeatured();
    });
    observer.observe(document.body, {childList:true,subtree:true});
    ensureHint(); enhanceMenuCards(); enhanceFeatured();
  }

  injectStyles();
  ensureDetailSheet();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, {once:true}); else observe();
})();