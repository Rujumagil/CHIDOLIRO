const SUPABASE_URL = process.env.CHIDOLIRO_SUPABASE_URL || 'https://qwxydjotwhniahaovrff.supabase.co';
const SUPABASE_ANON_KEY = process.env.CHIDOLIRO_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eHlkam90d2huaWFoYW92cmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTgxOTQsImV4cCI6MjEwMTA5NDE5NH0.bxRhmjNYrxPIXE4-SxS_YCxpWafFdQWVlaj9E1pdLSc';

async function rpc(name, body){
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method:'POST',
    headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(body||{})
  });
  const text = await r.text();
  let data = null; try{ data = JSON.parse(text||'null'); }catch(_){ }
  if(!r.ok) throw new Error(`${name}_${r.status}:${text.slice(0,180)}`);
  return data;
}
function sessionFrom(req){ const auth=String(req.headers.authorization||''); return auth.toLowerCase().startsWith('bearer ')?auth.slice(7).trim():''; }

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  try{
    const session_token=sessionFrom(req);
    if(!session_token) return res.status(401).json({ok:false,error:'missing_session'});
    if(req.method==='GET'){
      const result=await rpc('chidoliro_inventory_overview',{session_token});
      if(!result?.ok) return res.status(result?.error==='unauthorized'?401:400).json(result||{ok:false,error:'inventory_load_failed'});
      return res.status(200).json(result);
    }
    if(req.method!=='POST') return res.status(405).json({ok:false,error:'method_not_allowed'});
    const body=req.body&&typeof req.body==='object'?req.body:{};
    const action=String(body.action||'').trim();
    let result;
    if(action==='save_item'){
      result=await rpc('chidoliro_inventory_upsert_item',{session_token,item_payload:{id:body.id||null,name:body.name||'',unit:body.unit||'pza',reorder_level:body.reorder_level??0,unit_cost:body.unit_cost??0}});
    }else if(action==='movement'){
      result=await rpc('chidoliro_inventory_adjust',{session_token,target_item_id:String(body.item_id||''),movement_type_input:String(body.movement_type||''),quantity_input:Number(body.quantity||0),unit_cost_input:body.unit_cost===null||body.unit_cost===undefined||body.unit_cost===''?null:Number(body.unit_cost),notes_input:body.notes||null});
    }else if(action==='save_recipe'){
      result=await rpc('chidoliro_inventory_set_recipe',{session_token,target_menu_item_id:String(body.menu_item_id||''),ingredients:Array.isArray(body.ingredients)?body.ingredients:[]});
    }else return res.status(400).json({ok:false,error:'unknown_action'});
    if(!result?.ok) return res.status(result?.error==='unauthorized'?401:400).json(result||{ok:false,error:'inventory_action_failed'});
    return res.status(200).json(result);
  }catch(error){
    console.error('[CHIDOLIRO API] inventory error',error.message||error);
    return res.status(502).json({ok:false,error:'inventory_upstream_failed'});
  }
};
