const SUPABASE_URL = process.env.CHIDOLIRO_SUPABASE_URL || 'https://qwxydjotwhniahaovrff.supabase.co';
const SUPABASE_ANON_KEY = process.env.CHIDOLIRO_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eHlkam90d2huaWFoYW92cmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTgxOTQsImV4cCI6MjEwMTA5NDE5NH0.bxRhmjNYrxPIXE4-SxS_YCxpWafFdQWVlaj9E1pdLSc';

async function rpc(name,body){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:'POST',headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(body||{})
  });
  const text=await r.text(); let data=null; try{data=JSON.parse(text||'{}')}catch(_){}
  if(!r.ok) throw new Error(`rpc_${name}_${r.status}`);
  return data;
}
function tokenFrom(req,body){
  const auth=String(req.headers.authorization||'');
  if(auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return String(body?.session_token||'').trim();
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  try{
    if(req.method==='GET'){
      const session=tokenFrom(req,null);
      if(!session) return res.status(401).json({ok:false,error:'missing_session'});
      const date=String(req.query?.date||'').trim()||null;
      const result=await rpc('chidoliro_kitchen_reservations',{session_token:session,p_date:date});
      if(!result?.ok) return res.status(result?.error==='unauthorized'?401:400).json(result||{ok:false,error:'reservation_load_failed'});
      return res.status(200).json(result);
    }
    if(req.method!=='POST') return res.status(405).json({ok:false,error:'method_not_allowed'});
    const body=req.body&&typeof req.body==='object'?req.body:{};
    const session=tokenFrom(req,body);
    if(!session) return res.status(401).json({ok:false,error:'missing_session'});
    if(String(body.action||'')!=='update') return res.status(400).json({ok:false,error:'unknown_action'});
    const result=await rpc('chidoliro_kitchen_update_reservation',{
      session_token:session,
      target_reservation_id:String(body.reservation_id||'').trim(),
      new_status:String(body.status||'').trim()
    });
    if(!result?.ok) return res.status(result?.error==='unauthorized'?401:400).json(result||{ok:false,error:'reservation_update_failed'});
    return res.status(200).json(result);
  }catch(error){
    console.error('[CHIDOLIRO API] kitchen reservations error',error);
    return res.status(502).json({ok:false,error:'reservation_upstream_failed'});
  }
};
