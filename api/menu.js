const SUPABASE_URL = process.env.CHIDOLIRO_SUPABASE_URL || 'https://qwxydjotwhniahaovrff.supabase.co';
const SUPABASE_ANON_KEY = process.env.CHIDOLIRO_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eHlkam90d2huaWFoYW92cmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTgxOTQsImV4cCI6MjEwMTA5NDE5NH0.bxRhmjNYrxPIXE4-SxS_YCxpWafFdQWVlaj9E1pdLSc';

const QUERIES = {
  categories: ['chidoliro_menu_categories','select=id,name,slug,description,icon,image_url,sort_order&is_active=eq.true&order=sort_order.asc'],
  items: ['chidoliro_menu_items','select=id,category_id,name,slug,description,price,price_label,image_url,is_available,is_featured,is_alcoholic,sort_order&is_active=eq.true&is_available=eq.true&order=sort_order.asc'],
  promotions: ['chidoliro_promotions','select=id,title,slug,subtitle,description,promo_price,discount_percent,days_of_week,image_url,terms,is_featured,sort_order&is_active=eq.true&order=sort_order.asc'],
  variants: ['chidoliro_menu_item_variants','select=id,item_id,name,price,price_label,is_default,sort_order&is_active=eq.true&order=sort_order.asc'],
  itemGroups: ['chidoliro_menu_item_modifier_groups','select=item_id,group_id,sort_order&order=sort_order.asc'],
  groups: ['chidoliro_modifier_groups','select=id,name,description,min_select,max_select,is_required,sort_order&is_active=eq.true&order=sort_order.asc'],
  options: ['chidoliro_modifier_options','select=id,group_id,name,price_delta,sort_order&is_active=eq.true&order=sort_order.asc']
};

async function loadResource(name, tuple) {
  const [table, query] = tuple;
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json'
      }
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`${name}:${response.status}:${text.slice(0,180)}`);
    return JSON.parse(text || '[]');
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') return res.status(405).json({ ok:false, error:'method_not_allowed' });
  try {
    const entries = await Promise.all(Object.entries(QUERIES).map(async ([name, tuple]) => [name, await loadResource(name, tuple)]));
    const data = Object.fromEntries(entries);
    return res.status(200).json({ ok:true, data, counts:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,Array.isArray(v)?v.length:0])) });
  } catch (error) {
    console.error('[CHIDOLIRO API] menu load failed', error);
    return res.status(502).json({ ok:false, error:'menu_upstream_failed', detail:String(error && error.message || error) });
  }
};
