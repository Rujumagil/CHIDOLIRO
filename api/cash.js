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
  if (!r.ok) throw new Error(data?.error || data?.message || 'cash_proxy_failed');
  return data;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const session = sessionFrom(req);
    if (!session) return res.status(401).json({ok:false,error:'missing_session'});

    const payload = {items:[], session_token:session};
    if (req.method === 'GET') {
      payload.cash_action = 'overview';
      if (req.query?.shift_id) payload.shift_id = String(req.query.shift_id);
    } else if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const action = String(body.action || '').trim();
      if (!['open_shift','movement','pay_takeout','close_shift'].includes(action)) {
        return res.status(400).json({ok:false,error:'unknown_action'});
      }
      payload.cash_action = action;
      payload.amount = body.amount ?? null;
      payload.notes = body.notes || null;
      payload.movement_type = body.movement_type || null;
      payload.category = body.category || null;
      payload.order_id = body.order_id || null;
      payload.payment_method = body.payment_method || null;
      payload.cash_received = body.cash_received ?? null;
    } else {
      return res.status(405).json({ok:false,error:'method_not_allowed'});
    }

    const result = await callOrderApi(req, payload);
    if (!result?.ok) return res.status(result?.error==='unauthorized'?401:400).json(result || {ok:false,error:'cash_failed'});
    return res.status(200).json(result);
  } catch (error) {
    console.error('[CHIDOLIRO API] cash proxy error', error.message || error);
    return res.status(502).json({ok:false,error:'cash_upstream_failed'});
  }
};
