const SUPABASE_URL = process.env.CHIDOLIRO_SUPABASE_URL || 'https://qwxydjotwhniahaovrff.supabase.co';
const SUPABASE_ANON_KEY = process.env.CHIDOLIRO_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6InF3eHlkam90d2huaWFoYW92cmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTgxOTQsImV4cCI6MjEwMTA5NDE5NH0.bxRhmjNYrxPIXE4-SxS_YCxpWafFdQWVlaj9E1pdLSc';

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
      const dashboard=String(req.query?.dashboard||'')==='1';
      const result=await rpc(dashboard?'chidoliro_dashboard_overview':'chidoliro_menu_admin_overview',{session_token});
      if(!result?.ok) return res.status(result?.error==='unauthorized'?401:400).json(result||{ok:false,error:dashboard?'dashboard_failed':'menu_admin_load_failed'});
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
    }else if(action==='save_category'){
      result=await rpc('chidoliro_menu_admin_save_category',{session_token,payload:{id:body.id||null,name:body.name||'',description:body.description||null,icon:body.icon||null,sort_order:Number(body.sort_order||0),is_active:body.is_active!==false}});
    }else if(action==='save_modifier_group'){
      result=await rpc('chidoliro_menu_admin_save_modifier_group',{session_token,payload:{id:body.id||null,name:body.name||'',description:body.description||null,min_select:Number(body.min_select||0),max_select:Number(body.max_select||1),is_required:!!body.is_required,is_active:body.is_active!==false,sort_order:Number(body.sort_order||0)}});
    }else if(action==='save_modifier_option'){
      result=await rpc('chidoliro_menu_admin_save_modifier_option',{session_token,payload:{id:body.id||null,group_id:body.group_id||null,name:body.name||'',price_delta:Number(body.price_delta||0),is_active:body.is_active!==false,sort_order:Number(body.sort_order||0)}});
    }else if(action==='set_item_modifiers'){
      result=await rpc('chidoliro_menu_admin_set_item_modifiers',{session_token,target_item_id:String(body.item_id||''),group_ids:Array.isArray(body.group_ids)?body.group_ids:[]});
    }else if(action==='save_promotion'){
      result=await rpc('chidoliro_menu_admin_save_promotion',{session_token,payload:{id:body.id||null,title:body.title||'',subtitle:body.subtitle||null,description:body.description||null,promo_price:body.promo_price??null,discount_percent:body.discount_percent??null,days_of_week:Array.isArray(body.days_of_week)?body.days_of_week:[],start_date:body.start_date||null,end_date:body.end_date||null,start_time:body.start_time||null,end_time:body.end_time||null,terms:body.terms||null,is_featured:!!body.is_featured,is_active:body.is_active!==false,sort_order:Number(body.sort_order||0)}});
    }else return res.status(400).json({ok:false,error:'unknown_action'});
    if(!result?.ok) return res.status(result?.error==='unauthorized'?401:400).json(result||{ok:false,error:'menu_admin_action_failed'});
    return res.status(200).json(result);
  }catch(error){
    console.error('[CHIDOLIRO API] menu admin error',error.message||error);
    return res.status(502).json({ok:false,error:'menu_admin_upstream_failed'});
  }
};
