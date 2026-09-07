function sessionFrom(req) {
  const auth = String(req.headers.authorization || '');
  return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
}

async function callOrderApi(req, payload) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers.host || 'chidoliro.vercel.app');
  const r = await fetch(`${proto}://${host}/api/order`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.error || 'order_proxy_failed');
  return data;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const session = sessionFrom(req);
    if (!session) return res.status(401).json({ok:false,error:'missing_session'});

    let payload = {items:[],session_token:session};
    if (req.method === 'GET') {
      const tableId = String(req.query?.table_id || '').trim();
      payload.pos_action = tableId ? 'detail' : 'overview';
      if (tableId) payload.table_id = tableId;
    } else if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const action = String(body.action || '').trim();
      if (!['open','add_order','close'].includes(action)) return res.status(400).json({ok:false,error:'unknown_action'});
      payload.pos_action = action;
      payload.table_id = String(body.table_id || '').trim();
      payload.items = Array.isArray(body.items) ? body.items : [];
      payload.notes = body.notes || null;
      payload.payment_method = body.payment_method || null;
      payload.cash_received = body.cash_received ?? null;
    } else {
      return res.status(405).json({ok:false,error:'method_not_allowed'});
    }

    const result = await callOrderApi(req, payload);
    if (!result?.ok) {
      if (result?.error === 'cash_shift_required') {
        return res.status(400).json({ok:false,error:'Primero abre la caja en /caja.html antes de cerrar una cuenta.'});
      }
      return res.status(result?.error==='unauthorized'?401:400).json(result || {ok:false,error:'pos_failed'});
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error('[CHIDOLIRO API] pos proxy error', error.message || error);
    return res.status(502).json({ok:false,error:'pos_upstream_failed'});
  }
};
