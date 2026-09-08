const SUPABASE_URL = process.env.CHIDOLIRO_SUPABASE_URL || 'https://qwxydjotwhniahaovrff.supabase.co';
const SUPABASE_ANON_KEY = process.env.CHIDOLIRO_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eHlkam90d2huaWFoYW92cmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTgxOTQsImV4cCI6MjEwMTA5NDE5NH0.bxRhmjNYrxPIXE4-SxS_YCxpWafFdQWVlaj9E1pdLSc';

async function rpc(name, body){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body||{})});
  const text=await r.text();let data=null;try{data=JSON.parse(text||'null')}catch(_){}
  if(!r.ok) throw new Error(`${name}_${r.status}:${text.slice(0,180)}`);
  return data;
}
function sessionFrom(req){const auth=String(req.headers.authorization||'');return auth.toLowerCase().startsWith('bearer ')?auth.slice(7).trim():'';}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  try{
    const session_token=sessionFrom(req);
    if(!session_token) return res.status(401).json({ok:false,error:'missing_session'});
    if(req.method==='GET'){
      const result=await rpc('chidoliro_menu_admin_overview',{session_token});
      if(!result?.ok) return res.status(result?.error==='unauthorized'?401:400).json(result||{ok:false,error:'menu_admin_load_failed'});
      return res.status(200).json(result);
    }
    if(req.method!=='POST') return res.status(405).json({ok:false,error:'method_not_allowed'});
    const body=req.body&&typeof req.body==='object'?req.body:{};
    const action=String(body.action||'').trim();
    let result;
    if(action==='save_item'){
      result=await rpc('chidoliro_menu_admin_save_item',{session_token,payload:{id:body.id||null,category_id:body.category_id||null,name:body.name||'',description:body.description||null,price:body.price??null,price_label:body.price_label||null,is_available:body.is_available!==false,is_featured:!!body.is_featured,is_active:body.is_active!==false,is_alcoholic:!!body.is_alcoholic,sort_order:Number(body.sort_order||0)}});
    }else if(action==='upload_image'){
      const base64=String(body.image_base64||'');
      if(base64.length>3500000) return res.status(413).json({ok:false,error:'image_too_large'});
      result=await rpc('chidoliro_menu_admin_upload_image',{session_token,target_item_id:String(body.item_id||''),mime_input:String(body.mime_type||''),base64_input:base64,width_input:body.width?Number(body.width):null,height_input:body.height?Number(body.height):null});
    }else if(action==='remove_image'){
      result=await rpc('chidoliro_menu_admin_remove_image',{session_token,target_item_id:String(body.item_id||'')});
    }else return res.status(400).json({ok:false,error:'unknown_action'});
    if(!result?.ok) return res.status(result?.error==='unauthorized'?401:400).json(result||{ok:false,error:'menu_admin_action_failed'});
    return res.status(200).json(result);
  }catch(error){
    console.error('[CHIDOLIRO API] menu admin error',error.message||error);
    return res.status(502).json({ok:false,error:'menu_admin_upstream_failed'});
  }
};
