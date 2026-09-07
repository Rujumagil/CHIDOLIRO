(() => {
  'use strict';
  const originalFetch = window.fetch.bind(window);
  const tableMap = {
    chidoliro_menu_categories: 'categories',
    chidoliro_menu_items: 'items',
    chidoliro_promotions: 'promotions',
    chidoliro_menu_item_variants: 'variants',
    chidoliro_menu_item_modifier_groups: 'itemGroups',
    chidoliro_modifier_groups: 'groups',
    chidoliro_modifier_options: 'options'
  };
  let bundlePromise = null;
  function getBundle(){
    if(!bundlePromise){
      bundlePromise = originalFetch('/api/menu', {cache:'no-store'})
        .then(async response => {
          const payload = await response.json().catch(()=>null);
          if(!response.ok || !payload?.ok || !payload?.data) throw new Error(payload?.detail || `menu_api_${response.status}`);
          return payload.data;
        })
        .catch(error => { bundlePromise = null; throw error; });
    }
    return bundlePromise;
  }
  window.fetch = async function(input, init){
    try{
      const raw = typeof input === 'string' ? input : input?.url;
      const url = raw ? new URL(raw, location.href) : null;
      if(url && /\.supabase\.co$/i.test(url.hostname) && url.pathname.startsWith('/rest/v1/chidoliro_')){
        const table = url.pathname.split('/').filter(Boolean).pop();
        const key = tableMap[table];
        if(key){
          const data = await getBundle();
          return new Response(JSON.stringify(data[key] || []), {
            status: 200,
            headers: {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
          });
        }
      }
    }catch(error){
      console.warn('[CHIDOLIRO] API bridge fallback', error);
    }
    return originalFetch(input, init);
  };
})();
