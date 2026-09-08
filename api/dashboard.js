function sessionFrom(req){
  const auth=String(req.headers.authorization||'');
  return auth.toLowerCase().startsWith('bearer ')?auth.slice(7).trim():'';
}
function originFrom(req){
  const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
  const host=String(req.headers.host||'chidoliro.vercel.app');
  return `${proto}://${host}`;
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'method_not_allowed'});
  const session=sessionFrom(req);
  if(!session) return res.status(401).json({ok:false,error:'missing_session'});
  try{
    const r=await fetch(`${originFrom(req)}/api/menu-admin?dashboard=1`,{cache:'no-store',headers:{Authorization:`Bearer ${session}`,Accept:'application/json'}});
    const data=await r.json().catch(()=>null);
    if(!r.ok) return res.status(r.status).json(data||{ok:false,error:'dashboard_failed'});
    return res.status(200).json(data);
  }catch(error){
    console.error('[CHIDOLIRO API] dashboard error',error.message||error);
    return res.status(502).json({ok:false,error:'dashboard_upstream_failed'});
  }
};
