const SUPABASE_URL = process.env.CHIDOLIRO_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.CHIDOLIRO_SUPABASE_ANON_KEY;

async function rpc(name, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(body || {})
  });
  const text = await r.text();
  let data = null;
  try { data = JSON.parse(text || 'null'); } catch (_) {}
  if (!r.ok) throw new Error(`${name}_${r.status}:${text.slice(0,180)}`);
  return data;
}

function sessionFrom(req) {
  const auth = String(req.headers.authorization || '');
  return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(503).json({ok:false,error:'pos_config_missing'});
    const session = sessionFrom(req);
    if (!session) return res.status(401).json({ok:false,error:'missing_session'});

    if (req.method === 'GET') {
      const tableId = String(req.query?.table_id || '').trim();
      const result = tableId
        ? await rpc('chidoliro_pos_table_detail', {session_token:session,target_table_id:tableId})
        : await rpc('chidoliro_pos_overview', {session_token:session});
      if (!result?.ok) return res.status(result?.error==='unauthorized'?401:400).json(result || {ok:false,error:'pos_load_failed'});
      return res.status(200).json(result);
    }

    if (req.method !== 'POST') return res.status(405).json({ok:false,error:'method_not_allowed'});
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const action = String(body.action || '').trim();
    const tableId = String(body.table_id || '').trim();
    let result;

    if (action === 'open') {
      result = await rpc('chidoliro_pos_open_table', {session_token:session,target_table_id:tableId});
    } else if (action === 'add_order') {
      result = await rpc('chidoliro_pos_add_order', {session_token:session,target_table_id:tableId,payload:{items:Array.isArray(body.items)?body.items:[],notes:body.notes||null}});
    } else if (action === 'close') {
      result = await rpc('chidoliro_pos_close_table', {
        session_token:session,
        target_table_id:tableId,
        payment_method_input:String(body.payment_method||''),
        cash_received_input:body.cash_received===null||body.cash_received===undefined||body.cash_received===''?null:Number(body.cash_received)
      });
    } else {
      return res.status(400).json({ok:false,error:'unknown_action'});
    }

    if (!result?.ok) return res.status(result?.error==='unauthorized'?401:400).json(result || {ok:false,error:'pos_action_failed'});
    return res.status(200).json(result);
  } catch (error) {
    console.error('[CHIDOLIRO API] pos error', error.message || error);
    return res.status(502).json({ok:false,error:'pos_upstream_failed'});
  }
};
