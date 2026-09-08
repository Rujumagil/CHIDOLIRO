const SUPABASE_URL = process.env.CHIDOLIRO_SUPABASE_URL || 'https://qwxydjotwhniahaovrff.supabase.co';
const SUPABASE_ANON_KEY = process.env.CHIDOLIRO_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6InF3eHlkam90d2huaWFoYW92cmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTgxOTQsImV4cCI6MjEwMTA5NDE5NH0.bxRhmjNYrxPIXE4-SxS_YCxpWafFdQWVlaj9E1pdLSc';

async function rpc(name, body){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:'POST',
    headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(body||{})
  });
  const text=await r.text();let data=null;try{data=JSON.parse(text||'null')}catch(_){}
  if(!r.ok) throw new Error(`${name}_${r.status}:${text.slice(0,180)}`);
  return data;
}
function sessionFrom(req){const auth=String(req.headers.authorization||'');return auth.toLowerCase().startsWith('bearer ')?auth.slice(7).trim():''}
function statusFor(r){return r?.error==='forbidden'?403:(r?.error==='staff_session_required'||r?.error==='unauthorized')?401:400}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  try{
    const session_token=sessionFrom(req);
    if(!session_token)return res.status(401).json({ok:false,error:'missing_session'});
    if(req.method==='GET'){
      const start_input=req.query?.from?String(req.query.from):null;
      const end_input=req.query?.to?String(req.query.to):null;
      const result=await rpc('chidoliro_staff_operational_metrics',{session_token,start_input,end_input});
      if(!result?.ok)return res.status(statusFor(result)).json(result||{ok:false,error:'reports_load_failed'});
      return res.status(200).json(result);
    }
    if(req.method!=='POST')return res.status(405).json({ok:false,error:'method_not_allowed'});
    const body=req.body&&typeof req.body==='object'?req.body:{};
    const action=String(body.action||'').trim();
    let result;
    if(action==='get_targets'){
      result=await rpc('chidoliro_staff_operational_targets_get',{session_token});
    }else if(action==='save_targets'){
      result=await rpc('chidoliro_staff_operational_targets_save',{session_token,payload:{kitchen_minutes:body.kitchen_minutes??'',bar_minutes:body.bar_minutes??'',delivery_minutes:body.delivery_minutes??''}});
    }else{
      return res.status(400).json({ok:false,error:'unknown_action'});
    }
    if(!result?.ok)return res.status(statusFor(result)).json(result||{ok:false,error:'reports_action_failed'});
    return res.status(200).json(result);
  }catch(error){
    console.error('[CHIDOLIRO API] reports error',error.message||error);
    return res.status(502).json({ok:false,error:'reports_upstream_failed'});
  }
};
