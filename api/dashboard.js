function sessionFrom(req){
  const auth=String(req.headers.authorization||'');
  return auth.toLowerCase().startsWith('bearer ')?auth.slice(7).trim():'';
}
function originFrom(req){
  const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
  const host=String(req.headers.host||'chidoliro.vercel.app');
  return `${proto}://${host}`;
}
async function readJson(url,session){
  const r=await fetch(url,{cache:'no-store',headers:{Authorization:`Bearer ${session}`,Accept:'application/json'}});
  const data=await r.json().catch(()=>null);
  if(r.status===401) return {ok:false,error:'unauthorized'};
  if(!r.ok) return {ok:false,error:data?.error||`http_${r.status}`};
  return data||{ok:false,error:'empty_response'};
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'method_not_allowed'});
  const session=sessionFrom(req);
  if(!session) return res.status(401).json({ok:false,error:'missing_session'});
  try{
    const origin=originFrom(req);
    const targets={
      pos:'/api/pos',cash:'/api/cash',inventory:'/api/inventory',menu:'/api/menu-admin',kitchen:'/api/kitchen',reservations:'/api/kitchen-reservations'
    };
    const entries=await Promise.all(Object.entries(targets).map(async([key,path])=>[key,await readJson(origin+path,session)]));
    const data=Object.fromEntries(entries);
    if(Object.values(data).every(x=>x?.error==='unauthorized')) return res.status(401).json({ok:false,error:'unauthorized'});
    return res.status(200).json({ok:true,generated_at:new Date().toISOString(),data});
  }catch(error){
    console.error('[CHIDOLIRO API] dashboard error',error.message||error);
    return res.status(502).json({ok:false,error:'dashboard_upstream_failed'});
  }
};
