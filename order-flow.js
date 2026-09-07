(() => {
  'use strict';

  const STORAGE_KEY = 'chidoliro_order_cart_v1';
  const MODE_KEY = 'chidoliro_order_mode_v1';
  const state = {
    cart: [],
    mode: localStorage.getItem(MODE_KEY) || '',
    bundle: null,
    bundlePromise: null,
    submitting: false
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(saved)) state.cart = saved;
  } catch (_) {}

  function money(n){ return '$' + Number(n || 0).toLocaleString('es-MX', {minimumFractionDigits:0, maximumFractionDigits:2}); }
  function esc(v){ return String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
  function toast(message){
    const existing = document.getElementById('dynamicToast');
    if (existing) {
      existing.textContent = message;
      existing.classList.add('show');
      clearTimeout(toast.timer);
      toast.timer = setTimeout(() => existing.classList.remove('show'), 2200);
      return;
    }
    alert(message);
  }

  async function bundle(){
    if (state.bundle) return state.bundle;
    if (!state.bundlePromise) {
      state.bundlePromise = fetch('/api/menu', {cache:'no-store'})
        .then(async r => {
          const p = await r.json().catch(() => null);
          if (!r.ok || !p?.ok || !p?.data) throw new Error('menu_unavailable');
          state.bundle = p.data;
          return state.bundle;
        })
        .catch(e => { state.bundlePromise = null; throw e; });
    }
    return state.bundlePromise;
  }

  function save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
    if (state.mode) localStorage.setItem(MODE_KEY, state.mode); else localStorage.removeItem(MODE_KEY);
    syncCartBar();
  }

  function cartCount(){ return state.cart.reduce((sum, line) => sum + Number(line.quantity || 0), 0); }
  function cartTotal(){ return state.cart.reduce((sum, line) => sum + Number(line.unitPrice || 0) * Number(line.quantity || 0), 0); }
  function syncCartBar(){
    const count = document.getElementById('cartCount');
    const total = document.getElementById('cartTotal');
    if (count) count.textContent = cartCount();
    if (total) total.textContent = money(cartTotal());
  }

  function lineSignature(itemId, optionIds){ return `${itemId}|${[...(optionIds || [])].sort().join(',')}`; }
  async function addLine(itemId, optionIds = []){
    const data = await bundle();
    const item = data.items.find(x => x.id === itemId);
    if (!item || item.price === null || item.price === undefined) return;
    const options = (optionIds || []).map(id => data.options.find(x => x.id === id)).filter(Boolean);
    const unitPrice = Number(item.price) + options.reduce((s,o) => s + Number(o.price_delta || 0), 0);
    const sig = lineSignature(item.id, options.map(o => o.id));
    const existing = state.cart.find(x => x.signature === sig);
    if (existing) existing.quantity += 1;
    else state.cart.push({
      signature: sig,
      itemId: item.id,
      name: item.name,
      unitPrice,
      quantity: 1,
      optionIds: options.map(o => o.id),
      optionNames: options.map(o => o.name),
      image: item.image_url || ''
    });
    save();
  }

  async function itemHasModifiers(itemId){
    const data = await bundle();
    return data.itemGroups.some(x => x.item_id === itemId);
  }

  function validateModifierSelection(itemId, optionIds, data){
    const links = data.itemGroups.filter(x => x.item_id === itemId);
    for (const link of links) {
      const group = data.groups.find(g => g.id === link.group_id && g.is_active !== false);
      if (!group) continue;
      const count = optionIds.filter(id => data.options.some(o => o.id === id && o.group_id === group.id && o.is_active !== false)).length;
      const min = Math.max(Number(group.min_select || 0), group.is_required ? 1 : 0);
      if (count < min || count > Number(group.max_select || 1)) return false;
    }
    return true;
  }

  function injectStyles(){
    if (document.getElementById('chidoliroOrderStyles')) return;
    const style = document.createElement('style');
    style.id = 'chidoliroOrderStyles';
    style.textContent = `
      #checkoutSheet{z-index:820}.checkoutSheet{max-width:720px}.checkoutMode{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:4px 0 16px}.checkoutMode button{border:1px solid var(--line);border-radius:17px;background:white;padding:13px;text-align:left;color:var(--ink)}.checkoutMode button.active{background:var(--ocean);color:white;border-color:var(--ocean)}.checkoutMode b{display:block;font-size:.82rem}.checkoutMode small{display:block;margin-top:3px;font-size:.65rem;opacity:.7}.checkoutList{display:grid;gap:9px;margin:12px 0}.checkoutLine{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;background:white;border:1px solid var(--line);border-radius:17px;padding:12px}.checkoutLine h4{font-family:"Fraunces",serif;font-size:1.15rem;line-height:1.05;margin:0}.checkoutOptions{color:var(--muted);font-size:.66rem;margin-top:5px}.checkoutPrice{font-size:.72rem;font-weight:900;margin-top:5px}.qty{display:flex;align-items:center;gap:8px}.qty button{width:32px;height:32px;border:0;border-radius:10px;background:#eef0e9;color:var(--ocean);font-weight:900}.qty b{min-width:17px;text-align:center;font-size:.78rem}.checkoutForm{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}.checkoutField{display:grid;gap:5px;font-size:.7rem;font-weight:800}.checkoutField input,.checkoutField textarea{width:100%;border:1px solid var(--line);background:white;border-radius:13px;color:var(--ink);padding:11px 12px;outline:none}.checkoutField input{min-height:48px}.checkoutField textarea{min-height:78px;resize:vertical}.checkoutField.full{grid-column:1/-1}.checkoutSummary{margin-top:13px;background:var(--ocean);color:white;border-radius:18px;padding:14px}.checkoutSummaryRow{display:flex;justify-content:space-between;gap:12px;align-items:center}.checkoutSummaryRow strong{font-size:1.25rem}.sendOrder{width:100%;margin-top:10px;min-height:54px;border:0;border-radius:15px;background:var(--amber);color:#25160b;font-weight:900}.sendOrder:disabled{opacity:.55;cursor:wait}.orderSuccess{text-align:center;padding:28px 8px 10px}.orderSuccessIcon{width:66px;height:66px;border-radius:50%;display:grid;place-items:center;background:#def2e6;color:#12663b;font-size:1.8rem;margin:0 auto 15px}.orderSuccess h3{font-size:2.4rem!important}.orderNumber{display:inline-block;margin:8px 0 14px;padding:10px 15px;border-radius:999px;background:var(--ocean);color:white;font-weight:900}.orderSuccess p{color:var(--muted);font-size:.8rem;line-height:1.55;max-width:440px;margin:0 auto 18px}.emptyCart{text-align:center;padding:28px 12px;color:var(--muted)}
      @media(max-width:700px){#checkoutSheet{padding:0;align-items:stretch}#checkoutSheet .sheet{width:100%;height:100dvh;max-height:none;border-radius:0;padding:calc(16px + env(safe-area-inset-top)) 12px calc(16px + env(safe-area-inset-bottom))}.checkoutForm{grid-template-columns:1fr}.checkoutField.full{grid-column:auto}.checkoutMode{position:sticky;top:0;z-index:3;background:var(--cream);padding-top:2px}}
    `;
    document.head.appendChild(style);
  }

  function ensureSheet(){
    if (document.getElementById('checkoutSheet')) return;
    const bg = document.createElement('div');
    bg.className = 'sheetBg';
    bg.id = 'checkoutSheet';
    bg.innerHTML = `<div class="sheet checkoutSheet"><div class="sheetHead"><div><h3>Revisa tu pedido</h3><div class="soldPrice">Confirma cómo lo quieres recibir</div></div><button class="close" type="button" data-close-checkout>✕</button></div><div id="checkoutBody"></div></div>`;
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-close-checkout]')) closeCheckout(); });
  }

  function closeCheckout(){
    const el = document.getElementById('checkoutSheet');
    if (el) el.classList.remove('show');
    document.body.classList.remove('no-scroll');
  }

  function openCheckout(){
    ensureSheet();
    renderCheckout();
    if (typeof closeSheets === 'function') closeSheets();
    const el = document.getElementById('checkoutSheet');
    el.classList.add('show');
    document.body.classList.add('no-scroll');
  }

  function setMode(mode){
    state.mode = mode;
    save();
    renderCheckout();
  }

  function renderCheckout(){
    ensureSheet();
    const body = document.getElementById('checkoutBody');
    if (!state.cart.length) {
      body.innerHTML = `<div class="emptyCart"><div style="font-size:2rem">🛍</div><b>Tu pedido está vacío</b><p>Agrega algo del menú para continuar.</p><button class="btn btnDark" type="button" id="checkoutBackMenu">Ver menú</button></div>`;
      document.getElementById('checkoutBackMenu')?.addEventListener('click', () => { closeCheckout(); if (typeof openSheet === 'function') openSheet('menuSheet'); });
      return;
    }

    body.innerHTML = `
      <div class="checkoutMode">
        <button type="button" data-checkout-mode="table" class="${state.mode==='table'?'active':''}"><b>🍽 Para mi mesa</b><small>Envía la comanda al restaurante</small></button>
        <button type="button" data-checkout-mode="takeout" class="${state.mode==='takeout'?'active':''}"><b>🛍 Para llevar</b><small>Recógelo cuando esté listo</small></button>
      </div>
      <div class="checkoutList">${state.cart.map((line, index) => `
        <article class="checkoutLine">
          <div><h4>${esc(line.name)}</h4>${line.optionNames?.length?`<div class="checkoutOptions">${esc(line.optionNames.join(' · '))}</div>`:''}<div class="checkoutPrice">${money(line.unitPrice * line.quantity)}</div></div>
          <div class="qty"><button type="button" data-qty="-1" data-index="${index}">−</button><b>${line.quantity}</b><button type="button" data-qty="1" data-index="${index}">＋</button></div>
        </article>`).join('')}</div>
      <div class="checkoutForm">
        ${state.mode==='table' ? `<label class="checkoutField"><span>Número de mesa *</span><input id="orderTable" inputmode="numeric" placeholder="Ej. 8" maxlength="40"></label><label class="checkoutField"><span>Nombre (opcional)</span><input id="orderName" autocomplete="name" placeholder="Tu nombre"></label>` : state.mode==='takeout' ? `<label class="checkoutField"><span>Nombre *</span><input id="orderName" autocomplete="name" placeholder="¿A nombre de quién?"></label><label class="checkoutField"><span>Teléfono *</span><input id="orderPhone" inputmode="tel" autocomplete="tel" placeholder="10 dígitos"></label>` : `<div class="checkoutField full"><div class="menuStatus">Elige si tu pedido es para mesa o para llevar.</div></div>`}
        <label class="checkoutField full"><span>Notas para el pedido</span><textarea id="orderNotes" placeholder="Ej. sin cebolla, alergias o indicaciones generales"></textarea></label>
      </div>
      <div class="checkoutSummary"><div class="checkoutSummaryRow"><span>${cartCount()} producto${cartCount()===1?'':'s'}</span><strong>${money(cartTotal())}</strong></div><button class="sendOrder" type="button" id="sendOrder" ${state.mode?'':'disabled'}>Enviar pedido</button></div>`;

    body.querySelectorAll('[data-checkout-mode]').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.checkoutMode)));
    body.querySelectorAll('[data-qty]').forEach(btn => btn.addEventListener('click', () => {
      const index = Number(btn.dataset.index);
      const delta = Number(btn.dataset.qty);
      if (!state.cart[index]) return;
      state.cart[index].quantity += delta;
      if (state.cart[index].quantity <= 0) state.cart.splice(index, 1);
      save(); renderCheckout();
    }));
    document.getElementById('sendOrder')?.addEventListener('click', submitOrder);
  }

  async function submitOrder(){
    if (state.submitting || !state.cart.length || !state.mode) return;
    const table = document.getElementById('orderTable')?.value.trim() || '';
    const name = document.getElementById('orderName')?.value.trim() || '';
    const phone = document.getElementById('orderPhone')?.value.trim() || '';
    const notes = document.getElementById('orderNotes')?.value.trim() || '';
    if (state.mode === 'table' && !table) { toast('Indica tu número de mesa.'); return; }
    if (state.mode === 'takeout' && (!name || !phone)) { toast('Para llevar necesitamos nombre y teléfono.'); return; }

    const button = document.getElementById('sendOrder');
    state.submitting = true;
    if (button) { button.disabled = true; button.textContent = 'Enviando pedido…'; }
    try {
      const response = await fetch('/api/order', {
        method:'POST', cache:'no-store', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          order_type: state.mode,
          table_reference: state.mode === 'table' ? table : null,
          customer_name: name || null,
          customer_phone: phone || null,
          notes: notes || null,
          items: state.cart.map(line => ({ menu_item_id:line.itemId, quantity:line.quantity, option_ids:line.optionIds || [] }))
        })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.message || 'No pudimos registrar tu pedido.');
      const total = result.total ?? cartTotal();
      state.cart = [];
      localStorage.removeItem(STORAGE_KEY);
      syncCartBar();
      document.getElementById('checkoutBody').innerHTML = `<div class="orderSuccess"><div class="orderSuccessIcon">✓</div><h3>¡Pedido enviado!</h3><div class="orderNumber">Pedido #${esc(result.order_number)}</div><p>${result.order_type==='table'?'Tu pedido fue enviado al restaurante para preparar la comanda de tu mesa.':'Recibimos tu pedido para llevar. En la siguiente etapa mostraremos aquí el avance: recibido, preparando y listo.'}</p><div style="font-weight:900;font-size:1.1rem;margin-bottom:16px">Total ${money(total)}</div><button class="btn btnDark" type="button" id="orderDone">Volver al inicio</button></div>`;
      document.getElementById('orderDone')?.addEventListener('click', () => { localStorage.removeItem(MODE_KEY); location.href = '/#inicio'; location.reload(); });
    } catch (error) {
      toast(error.message || 'No pudimos enviar el pedido.');
      if (button) { button.disabled = false; button.textContent = 'Enviar pedido'; }
    } finally {
      state.submitting = false;
    }
  }

  async function captureAddClick(event){
    const button = event.target.closest('[data-item-id],[data-featured-item]');
    if (!button) return;
    const itemId = button.dataset.itemId || button.dataset.featuredItem;
    if (!itemId) return;
    try {
      if (await itemHasModifiers(itemId)) return;
      setTimeout(() => addLine(itemId, []).catch(() => {}), 0);
    } catch (_) {}
  }

  async function captureModifierSubmit(event){
    if (!event.target.closest('#modifierSubmit')) return;
    try {
      const data = await bundle();
      const name = document.getElementById('modifierTitle')?.textContent?.trim();
      const item = data.items.find(x => x.name === name);
      if (!item) return;
      const optionIds = [...document.querySelectorAll('#modifierBody input:checked')].map(x => x.value);
      if (!validateModifierSelection(item.id, optionIds, data)) return;
      setTimeout(() => addLine(item.id, optionIds).catch(() => {}), 0);
    } catch (_) {}
  }

  function overrideLegacyActions(){
    window.setOrderMode = function(mode){
      state.mode = String(mode).toLowerCase().includes('mesa') ? 'table' : 'takeout';
      save();
      if (typeof closeSheets === 'function') closeSheets();
      if (typeof openSheet === 'function') openSheet('menuSheet');
    };
    window.checkoutDemo = function(){ openCheckout(); };
  }

  function start(){
    injectStyles(); ensureSheet(); overrideLegacyActions();
    document.addEventListener('click', captureAddClick, true);
    document.addEventListener('click', captureModifierSubmit, false);
    syncCartBar();
    bundle().catch(() => {});
    setTimeout(syncCartBar, 1000);
    setTimeout(syncCartBar, 2500);
  }

  window.CHIDOLIRO_ORDER = { openCheckout, getCart:() => state.cart.slice(), clear:() => {state.cart=[];save();} };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
