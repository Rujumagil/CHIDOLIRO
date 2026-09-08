const SUPABASE_URL = process.env.CHIDOLIRO_SUPABASE_URL || 'https://qwxydjotwhniahaovrff.supabase.co';
const SUPABASE_ANON_KEY = process.env.CHIDOLIRO_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eHlkam90d2huaWFoYW92cmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTgxOTQsImV4cCI6MjEwMTA5NDE5NH0.bxRhmjNYrxPIXE4-SxS_YCxpWafFdQWVlaj9E1pdLSc';

module.exports=async function handler(req,res){
  if(req.method!=='GET') return res.status(405).end();
  const itemId=String(req.query?.item_id||'').trim();
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(itemId)) return res.status(404).end();
  try{
    const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/chidoliro_menu_image_public`,{method:'POST',headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({target_item_id:itemId})});
    const data=await r.json().catch(()=>null);
    if(!r.ok||!data?.ok||!data.image_base64) return res.status(404).end();
    const buffer=Buffer.from(data.image_base64,'base64');
    res.setHeader('Content-Type',data.mime_type||'image/webp');
    res.setHeader('Content-Length',String(buffer.length));
    res.setHeader('Cache-Control','public, max-age=3600, stale-while-revalidate=86400');
    res.setHeader('ETag',`W/\"${itemId}-${new Date(data.updated_at||0).getTime()}-${buffer.length}\"`);
    return res.status(200).send(buffer);
  }catch(error){
    console.error('[CHIDOLIRO API] menu image error',error.message||error);
    return res.status(404).end();
  }
};
