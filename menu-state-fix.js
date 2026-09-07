(() => {
  'use strict';

  const originalOpenSheet = window.openSheet;
  const originalCloseSheets = window.closeSheets;
  const CART_KEY = 'chidoliro_order_cart_v1';
  const transientIds = ['modifierSheet', 'productDetailSheet'];

  function isShown(id){
    const el = document.getElementById(id);
    return !!el && (el.classList.contains('show') || el.style.display === 'flex');
  }

  function hideTransient(id){
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('show');
    el.style.removeProperty('display');
  }

  function menuIsOpen(){ return isShown('menuSheet'); }

  function showAboveMenu(id){
    const sheet = document.getElementById(id);
    if (!sheet) return false;

    if (id === 'modifierSheet') hideTransient('productDetailSheet');
    sheet.classList.add('show');
    sheet.style.display = 'flex';
    sheet.style.zIndex = id === 'modifierSheet' ? '980' : '960';
    document.body.classList.add('no-scroll');

    requestAnimationFrame(() => {
      const inner = sheet.querySelector('.sheet');
      if (inner) inner.scrollTop = 0;
    });
    return true;
  }

  window.openSheet = function(id){
    if (transientIds.includes(id) && menuIsOpen()) return showAboveMenu(id);
    return typeof originalOpenSheet === 'function' ? originalOpenSheet(id) : false;
  };

  window.closeSheets = function(){
    if (isShown('modifierSheet')) {
      hideTransient('modifierSheet');
      if (menuIsOpen()) document.body.classList.add('no-scroll');
      else document.body.classList.remove('no-scroll');
      return;
    }
    if (isShown('productDetailSheet')) {
      hideTransient('productDetailSheet');
      if (menuIsOpen()) document.body.classList.add('no-scroll');
      else document.body.classList.remove('no-scroll');
      return;
    }
    if (typeof originalCloseSheets === 'function') return originalCloseSheets();
  };

  function persistedCart(){
    try {
      const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function money(n){
    return '$' + Number(n || 0).toLocaleString('es-MX', {minimumFractionDigits:0, maximumFractionDigits:2});
  }

  function syncPersistedCart(){
    const cart = persistedCart();
    const count = cart.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
    const total = cart.reduce((sum, line) => sum + Number(line.unitPrice || 0) * Number(line.quantity || 0), 0);
    const countEl = document.getElementById('cartCount');
    const totalEl = document.getElementById('cartTotal');
    if (countEl && countEl.textContent !== String(count)) countEl.textContent = String(count);
    if (totalEl && totalEl.textContent !== money(total)) totalEl.textContent = money(total);
  }

  function installCartGuard(){
    syncPersistedCart();
    const observer = new MutationObserver(() => {
      clearTimeout(installCartGuard.timer);
      installCartGuard.timer = setTimeout(syncPersistedCart, 30);
    });
    const count = document.getElementById('cartCount');
    const total = document.getElementById('cartTotal');
    if (count) observer.observe(count, {childList:true, characterData:true, subtree:true});
    if (total) observer.observe(total, {childList:true, characterData:true, subtree:true});
    document.addEventListener('click', () => {
      setTimeout(syncPersistedCart, 150);
      setTimeout(syncPersistedCart, 700);
    }, true);
    window.addEventListener('storage', syncPersistedCart);
    setTimeout(syncPersistedCart, 1200);
    setTimeout(syncPersistedCart, 3000);
  }

  function injectStyles(){
    if (document.getElementById('chidoliroMenuStateFixStyles')) return;
    const style = document.createElement('style');
    style.id = 'chidoliroMenuStateFixStyles';
    style.textContent = `
      #productDetailSheet.sheetBg.show{z-index:960!important;display:flex!important}
      #modifierSheet.sheetBg.show{z-index:980!important;display:flex!important}
      #productDetailSheet .sheet,#modifierSheet .sheet{position:relative;z-index:1}
      @media(max-width:700px){
        #productDetailSheet.sheetBg,#modifierSheet.sheetBg{padding:0!important;align-items:stretch!important}
        #productDetailSheet .sheet,#modifierSheet .sheet{width:100%!important;height:100dvh!important;max-height:none!important;border-radius:0!important}
      }
    `;
    document.head.appendChild(style);
  }

  function boot(){
    injectStyles();
    installCartGuard();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
