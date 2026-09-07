const SUPABASE_URL = process.env.CHIDOLIRO_SUPABASE_URL || 'https://qwxydjotwhniahaovrff.supabase.co';
const SUPABASE_ANON_KEY = process.env.CHIDOLIRO_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eHlkam90d2huaWFoYW92cmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTgxOTQsImV4cCI6MjEwMTA5NDE5NH0.bxRhmjNYrxPIXE4-SxS_YCxpWafFdQWVlaj9E1pdLSc';

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'method_not_allowed'});
  const token=String(req.query?.token||'').trim();
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) return res.status(400).json({ok:false,error:'invalid_token'});
  try{
    const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/chidoliro_get_order_status`,{method:'POST',headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({p_token:token})});
    const text=await r.text(); let data=null; try{data=JSON.parse(text||'{}')}catch(_){}
    if(!r.ok) return res.status(502).json({ok:false,error:'tracking_upstream_failed'});
    if(!data?.ok) return res.status(404).json(data||{ok:false,error:'not_found'});
    return res.status(200).json(data);
  }catch(error){console.error('[CHIDOLIRO API] tracking error',error);return res.status(502).json({ok:false,error:'tracking_failed'});}
};
