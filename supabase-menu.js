(() => {
  'use strict';

  const SUPABASE_URL = 'https://qwxydjotwhniahaovrff.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eHlkam90d2huaWFoYW92cmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTgxOTQsImV4cCI6MjEwMTA5NDE5NH0.bxRhmjNYrxPIXE4-SxS_YCxpWafFdQWVlaj9E1pdLSc';
  const API = `${SUPABASE_URL}/rest/v1`;

  const state = { categories: [], items: [], promotions: [], variants: [], itemGroups: [], groups: [], options: [], selectedCategory: 'featured', search: '', cart: [], promoDay: null, configuringItem: null };

  const fallbackImages = {
    entradas:'assets/dishwide.webp', aguachiles:'assets/aguachile.webp', ceviches:'assets/molcajete.webp', tostadas:'assets/gallery-07.webp', caldos:'assets/dishwide.webp',
    'mariscos-calientes':'assets/pulpo.webp', carnes:'assets/dishwide.webp', tacos:'assets/promo-tacos.webp', snacks:'assets/dishwide.webp', 'especialidades-del-mar':'assets/torre.webp',
    charolas:'assets/molcajete.webp', cerveza:'assets/citric.webp', 'bebidas-con-alcohol':'assets/carajillo.webp', 'sin-alcohol':'assets/citric.webp', 'bebidas-premium':'assets/citric.webp', postres:'assets/carajillo.webp'
  };
  const promoFallbackImages = {1:'assets/promo-michelada.webp',2:'assets/molcajete.webp',3:'assets/gallery-07.webp',4:'assets/dishwide.webp',5:'assets/promo-tacos.webp',6:'assets/hero.webp'};
  const dayNames = {1:'Lun',2:'Mar',3:'Mié',4:'Jue',5:'Vie',6:'Sáb'};

  function injectStyles(){
    if(document.getElementById('chidoliroDynamicStyles')) return;
    const style=document.createElement('style'); style.id='chidoliroDynamicStyles';
    style.textContent=`.menuSearchWrap{position:sticky;top:-1px;z-index:4;background:var(--cream);padding:4px 0 8px}.menuSearch{width:100%;min-height:48px;border:1px solid var(--line);border-radius:15px;background:white;color:var(--ink);padding:0 14px;outline:none}.menuSearch:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(19,122,126,.10)}.menuStatus{padding:18px;border-radius:16px;background:#fffaf3;border:1px solid var(--line);color:var(--muted);font-size:.78rem;text-align:center;grid-column:1/-1}.menuLiveBadge{display:inline-flex;align-items:center;gap:6px;font-size:.64rem;font-weight:800;color:var(--teal);margin-top:4px}.menuLiveBadge:before{content:'';width:7px;height:7px;border-radius:50%;background:#3cb371;box-shadow:0 0 0 4px rgba(60,179,113,.12)}.soldPrice{font-size:.73rem;color:var(--muted);font-weight:800}.modifierGroup{margin-top:14px;padding:14px;border:1px solid var(--line);border-radius:17px;background:white}.modifierGroup h4{margin:0 0 4px;font-family:"Fraunces",serif;font-size:1.15rem}.modifierGroup small{color:var(--muted);font-size:.68rem}.modifierOptions{display:grid;gap:7px;margin-top:10px}.modifierOption{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--line);border-radius:13px;padding:10px 11px;font-size:.76rem}.modifierOption label{display:flex;align-items:center;gap:8px;flex:1;cursor:pointer}.modifierOption input{accent-color:var(--teal)}.modifierSubmit{width:100%;margin-top:14px}.promoExtra{margin-top:9px;display:inline-flex;padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.12);font-size:.67rem;color:rgba(255,255,255,.82)}.dynamicToast{position:fixed;left:50%;bottom:92px;z-index:700;transform:translate(-50%,20px);opacity:0;background:#05282e;color:white;padding:11px 14px;border-radius:14px;font-size:.75rem;font-weight:800;box-shadow:0 14px 35px rgba(0,0,0,.25);transition:.22s;pointer-events:none;max-width:calc(100% - 32px);text-align:center}.dynamicToast.show{opacity:1;transform:translate(-50%,0)}@media(max-width:700px){.menuSearchWrap{padding-top:0}.modifierGroup{padding:12px}}`;
    document.head.appendChild(style);
  }

  function ensureDynamicUi(){
    injectStyles();
    const tabs=document.getElementById('menuTabs');
    if(tabs&&!document.getElementById('menuSearchWrap')){
      const wrap=document.createElement('div'); wrap.className='menuSearchWrap'; wrap.id='menuSearchWrap';
      wrap.innerHTML='<input class="menuSearch" id="menuSearch" type="search" placeholder="Buscar aguachile, camarón, taco, bebida..." autocomplete="off"><div class="menuLiveBadge">Menú actualizado en línea</div>';
      tabs.parentNode.insertBefore(wrap,tabs);
      wrap.querySelector('#menuSearch').addEventListener('input',event=>{state.search=event.target.value.trim().toLowerCase();renderDynamicMenu()});
    }
    if(!document.getElementById('modifierSheet')){
      const sheet=document.createElement('div'); sheet.className='sheetBg'; sheet.id='modifierSheet';
      sheet.innerHTML='<div class="sheet"><div class="sheetHead"><div><h3 id="modifierTitle">Personaliza tu platillo</h3><div id="modifierPrice" class="soldPrice"></div></div><button class="close" type="button" onclick="closeSheets()">✕</button></div><div id="modifierBody"></div><button class="btn btnOrange modifierSubmit" id="modifierSubmit" type="button">Agregar al pedido</button></div>';
      document.body.appendChild(sheet); sheet.addEventListener('click',event=>{if(event.target===sheet&&typeof closeSheets==='function')closeSheets()}); sheet.querySelector('#modifierSubmit').addEventListener('click',addConfiguredItem);
    }
    if(!document.getElementById('dynamicToast')){const toast=document.createElement('div');toast.className='dynamicToast';toast.id='dynamicToast';document.body.appendChild(toast)}
  }

  function toast(message){const el=document.getElementById('dynamicToast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),1800)}
  async function apiFetch(table,query=''){const response=await fetch(`${API}/${table}${query?`?${query}`:''}`,{cache:'no-store',headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,Accept:'application/json'}});if(!response.ok)throw new Error(`${table}: ${response.status}`);return response.json()}
  function normalizeImage(url,categorySlug){if(url)return url.startsWith('/')?url.slice(1):url;return fallbackImages[categorySlug]||'assets/molcajete.webp'}
  function formatPrice(item){if(item.price!==null&&item.price!==undefined&&item.price!=='')return money(Number(item.price));return item.price_label||'Consultar'}
  function categoryFor(item){return state.categories.find(c=>c.id===item.category_id)}
  function itemImage(item){const cat=categoryFor(item);return normalizeImage(item.image_url,cat?.slug)}
  function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
  function getVisibleItems(){let rows=state.items;if(state.selectedCategory==='featured')rows=rows.filter(item=>item.is_featured);else if(state.selectedCategory!=='all')rows=rows.filter(item=>item.category_id===state.selectedCategory);if(state.search)rows=rows.filter(item=>{const cat=categoryFor(item);return `${item.name} ${item.description||''} ${cat?.name||''}`.toLowerCase().includes(state.search)});return rows}

  function renderDynamicTabs(){
    const tabs=document.getElementById('menuTabs');if(!tabs)return;
    const virtual=[{id:'featured',name:'✦ Destacados'},{id:'all',name:'Todo'}];const all=[...virtual,...state.categories.map(c=>({id:c.id,name:c.name}))];
    tabs.innerHTML=all.map(cat=>`<button class="${state.selectedCategory===cat.id?'active':''}" type="button" data-category="${escapeHtml(cat.id)}">${escapeHtml(cat.name)}</button>`).join('');
    tabs.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{state.selectedCategory=button.dataset.category;state.search='';const search=document.getElementById('menuSearch');if(search)search.value='';renderDynamicTabs();renderDynamicMenu()}));
  }

  function renderDynamicMenu(){
    const target=document.getElementById('menuItems');if(!target)return;const rows=getVisibleItems();if(!rows.length){target.innerHTML='<div class="menuStatus">No encontramos productos con ese filtro.</div>';return}
    target.innerHTML=rows.map(item=>{const cat=categoryFor(item);const price=formatPrice(item);const canAdd=item.price!==null&&item.price!==undefined;return `<article class="menuItem"><img src="${escapeHtml(itemImage(item))}" alt="${escapeHtml(item.name)}" loading="lazy"><div class="menuItemBody"><div class="foodTag" style="color:var(--teal)">${escapeHtml(cat?.name||'')}</div><h4>${escapeHtml(item.name)}</h4><p>${escapeHtml(item.description||'')}</p><div class="menuItemBottom"><b class="${canAdd?'':'soldPrice'}">${escapeHtml(price)}</b><button type="button" aria-label="${canAdd?'Agregar':'Consultar precio'}" data-item-id="${escapeHtml(item.id)}">${canAdd?'＋':'?'}</button></div></div></article>`}).join('');
    target.querySelectorAll('[data-item-id]').forEach(button=>button.addEventListener('click',()=>addItemById(button.dataset.itemId)));
  }

  function renderFeaturedRail(){
    const rail=document.querySelector('#imperdibles .rail');if(!rail)return;const featured=state.items.filter(item=>item.is_featured&&item.price!==null).slice(0,7);if(!featured.length)return;
    rail.innerHTML=featured.map(item=>{const cat=categoryFor(item);return `<article class="foodCard"><img src="${escapeHtml(itemImage(item))}" alt="${escapeHtml(item.name)}" loading="lazy"><div class="foodOverlay"><div class="foodTag">${escapeHtml(cat?.name||'CHIDOLIRO')}</div><h3 class="cardTitle">${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description||'Uno de los favoritos de la casa.')}</p><div class="foodBottom"><span>${escapeHtml(formatPrice(item))}</span><button class="plus" type="button" data-featured-item="${escapeHtml(item.id)}">＋</button></div></div></article>`}).join('');
    rail.querySelectorAll('[data-featured-item]').forEach(button=>button.addEventListener('click',()=>addItemById(button.dataset.featuredItem)));
  }

  function groupDataForItem(itemId){const links=state.itemGroups.filter(link=>link.item_id===itemId).sort((a,b)=>a.sort_order-b.sort_order);return links.map(link=>{const group=state.groups.find(g=>g.id===link.group_id);if(!group)return null;return {...group,options:state.options.filter(option=>option.group_id===group.id).sort((a,b)=>a.sort_order-b.sort_order)}}).filter(Boolean)}
  function addItemById(itemId){
    const item=state.items.find(row=>row.id===itemId);if(!item)return;if(item.price===null||item.price===undefined){toast(`${item.name}: ${item.price_label||'precio por confirmar'}`);return}
    const groups=groupDataForItem(item.id);if(!groups.length){state.cart.push({...item,unitPrice:Number(item.price),selectedOptions:[]});updateDynamicCart();toast(`${item.name} agregado`);return}
    state.configuringItem=item;document.getElementById('modifierTitle').textContent=item.name;document.getElementById('modifierPrice').textContent=formatPrice(item);const body=document.getElementById('modifierBody');
    body.innerHTML=groups.map(group=>`<section class="modifierGroup" data-group-id="${escapeHtml(group.id)}"><h4>${escapeHtml(group.name)}</h4><small>${group.is_required?'Elige una opción':'Opcional'}</small><div class="modifierOptions">${group.options.map(option=>`<div class="modifierOption"><label><input type="${group.max_select===1?'radio':'checkbox'}" name="modifier_${escapeHtml(group.id)}" value="${escapeHtml(option.id)}"><span>${escapeHtml(option.name)}</span></label>${Number(option.price_delta)?`<b>+${money(Number(option.price_delta))}</b>`:''}</div>`).join('')}</div></section>`).join('');
    if(typeof openSheet==='function')openSheet('modifierSheet');
  }

  function addConfiguredItem(){
    const item=state.configuringItem;if(!item)return;const groups=groupDataForItem(item.id);const selections=[];
    for(const group of groups){const section=document.querySelector(`#modifierBody [data-group-id="${CSS.escape(group.id)}"]`);const selected=section?[...section.querySelectorAll('input:checked')]:[];if(group.is_required&&selected.length<Math.max(1,group.min_select)){toast(`Selecciona: ${group.name}`);return}selected.forEach(input=>{const option=state.options.find(row=>row.id===input.value);if(option)selections.push(option)})}
    const optionDelta=selections.reduce((sum,option)=>sum+Number(option.price_delta||0),0);state.cart.push({...item,unitPrice:Number(item.price)+optionDelta,selectedOptions:selections});state.configuringItem=null;updateDynamicCart();if(typeof closeSheets==='function')closeSheets();toast(`${item.name} agregado`);
  }

  function updateDynamicCart(){const count=document.getElementById('cartCount');const total=document.getElementById('cartTotal');if(count)count.textContent=state.cart.length;if(total)total.textContent=money(state.cart.reduce((sum,item)=>sum+Number(item.unitPrice||0),0))}
  function promoImage(promo,day){if(promo?.image_url)return promo.image_url.startsWith('/')?promo.image_url.slice(1):promo.image_url;return promoFallbackImages[day]||'assets/hero.webp'}
  function promoPrice(promo){if(promo.promo_price!==null&&promo.promo_price!==undefined)return money(Number(promo.promo_price));if(promo.discount_percent!==null&&promo.discount_percent!==undefined)return `${Number(promo.discount_percent)}% OFF`;return promo.subtitle||'Promoción'}
  function availablePromoDays(){const days=new Set();state.promotions.forEach(promo=>(promo.days_of_week||[]).forEach(day=>{if(day>=1&&day<=6)days.add(day)}));return [...days].sort((a,b)=>a-b)}
  function renderDynamicPromos(){
    const tabs=document.getElementById('promoTabs'),focus=document.getElementById('promoFocus');if(!tabs||!focus||!state.promotions.length)return;const days=availablePromoDays();if(!days.length)return;if(!days.includes(state.promoDay)){const today=new Date().getDay();state.promoDay=days.includes(today)?today:days[0]}
    tabs.innerHTML=days.map(day=>`<button type="button" class="${day===state.promoDay?'active':''}" data-promo-day="${day}">${dayNames[day]}</button>`).join('');tabs.querySelectorAll('[data-promo-day]').forEach(button=>button.addEventListener('click',()=>{state.promoDay=Number(button.dataset.promoDay);renderDynamicPromos()}));
    const matches=state.promotions.filter(promo=>(promo.days_of_week||[]).includes(state.promoDay));const primary=matches.find(promo=>promo.is_featured)||matches[0];if(!primary)return;focus.style.backgroundImage=`url('${promoImage(primary,state.promoDay)}')`;const extras=matches.filter(promo=>promo.id!==primary.id);focus.innerHTML=`<small>${dayNames[state.promoDay]}</small><h3>${escapeHtml(primary.title)}</h3><div class="promoPrice">${escapeHtml(promoPrice(primary))}</div><p>${escapeHtml(primary.description||primary.terms||'')}</p>${extras.map(promo=>`<div class="promoExtra">También: ${escapeHtml(promo.title)} · ${escapeHtml(promoPrice(promo))}</div>`).join('')}`;
  }

  async function loadDynamicData(){
    ensureDynamicUi();const target=document.getElementById('menuItems');if(target)target.innerHTML='<div class="menuStatus">Actualizando menú…</div>';
    try{
      const [categories,items,promotions,variants,itemGroups,groups,options]=await Promise.all([
        apiFetch('chidoliro_menu_categories','select=id,name,slug,description,icon,image_url,sort_order&is_active=eq.true&order=sort_order.asc'),
        apiFetch('chidoliro_menu_items','select=id,category_id,name,slug,description,price,price_label,image_url,is_available,is_featured,is_alcoholic,sort_order&is_active=eq.true&is_available=eq.true&order=sort_order.asc'),
        apiFetch('chidoliro_promotions','select=id,title,slug,subtitle,description,promo_price,discount_percent,days_of_week,image_url,terms,is_featured,sort_order&is_active=eq.true&order=sort_order.asc'),
        apiFetch('chidoliro_menu_item_variants','select=id,item_id,name,price,price_label,is_default,sort_order&is_active=eq.true&order=sort_order.asc'),
        apiFetch('chidoliro_menu_item_modifier_groups','select=item_id,group_id,sort_order&order=sort_order.asc'),
        apiFetch('chidoliro_modifier_groups','select=id,name,description,min_select,max_select,is_required,sort_order&is_active=eq.true&order=sort_order.asc'),
        apiFetch('chidoliro_modifier_options','select=id,group_id,name,price_delta,sort_order&is_active=eq.true&order=sort_order.asc')
      ]);
      state.categories=categories;state.items=items;state.promotions=promotions;state.variants=variants;state.itemGroups=itemGroups;state.groups=groups;state.options=options;renderDynamicTabs();renderDynamicMenu();renderFeaturedRail();renderDynamicPromos();updateDynamicCart();document.documentElement.dataset.menuSource='supabase';
    }catch(error){console.error('[CHIDOLIRO] No se pudo cargar el menú dinámico',error);document.documentElement.dataset.menuSource='fallback';if(target&&!target.children.length)target.innerHTML='<div class="menuStatus">No pudimos actualizar el menú. Intenta de nuevo en unos segundos.</div>'}
  }

  window.chidoliroReloadMenu=loadDynamicData;window.chidoliroAddItemById=addItemById;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadDynamicData,{once:true});else loadDynamicData();
})();