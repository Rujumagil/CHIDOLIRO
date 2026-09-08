const crypto = require('crypto');

const SUPABASE_URL = process.env.CHIDOLIRO_SUPABASE_URL || 'https://qwxydjotwhniahaovrff.supabase.co';
const SUPABASE_ANON_KEY = process.env.CHIDOLIRO_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eHlkam90d2huaWFoYW92cmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTgxOTQsImV4cCI6MjEwMTA5NDE5NH0.bxRhmjNYrxPIXE4-SxS_YCxpWafFdQWVlaj9E1pdLSc';

function fingerprint(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const ua = String(req.headers['user-agent'] || '');
  return crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex');
}

async function rpc(name, body) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(body || {})
  });
  const text = await response.text();
  let payload = null;
  try { payload = JSON.parse(text || 'null'); } catch (_) {}
  if (!response.ok) throw new Error(`rpc_${name}_${response.status}:${text.slice(0,160)}`);
  return payload;
}

function tokenFrom(req, body) {
  const auth = String(req.headers.authorization || '');
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return String(body?.session_token || '').trim();
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    if (req.method === 'GET') {
      const session = tokenFrom(req, null);
      if (!session) return res.status(401).json({ok:false,error:'missing_session'});
      const result = await rpc('chidoliro_staff_kitchen_orders', {session_token: session});
      if (!result?.ok) return res.status(result?.error === 'forbidden' ? 403 : result?.error === 'unauthorized' ? 401 : 400).json(result || {ok:false,error:'kitchen_load_failed'});
      return res.status(200).json(result);
    }

    if (req.method !== 'POST') return res.status(405).json({ok:false,error:'method_not_allowed'});
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const action = String(body.action || '').trim();

    if (action === 'login') {
      const pin = String(body.pin || '').replace(/\D/g,'').slice(0,6);
      const username = String(body.username || '').trim().toLowerCase();
      const result = username
        ? await rpc('chidoliro_staff_login', {username_input:username,pin_input:pin,client_fingerprint:fingerprint(req)})
        : await rpc('chidoliro_kitchen_login', {pin_input:pin,client_fingerprint:fingerprint(req)});
      if (!result?.ok) return res.status(result?.error === 'too_many_attempts' ? 429 : 401).json(result || {ok:false,error:'login_failed'});
      return res.status(200).json(result);
    }

    const session = tokenFrom(req, body);
    if (!session) return res.status(401).json({ok:false,error:'missing_session'});

    if (action === 'profile') {
      const result = await rpc('chidoliro_staff_session', {session_token:session});
      if (!result?.ok) return res.status(401).json(result || {ok:false,error:'unauthorized'});
      return res.status(200).json(result);
    }

    if (action === 'update') {
      const orderId = String(body.order_id || '').trim();
      const status = String(body.status || '').trim();
      const result = await rpc('chidoliro_staff_kitchen_update_order', {session_token: session, target_order_id: orderId, new_status: status});
      if (!result?.ok) return res.status(result?.error === 'forbidden' ? 403 : result?.error === 'unauthorized' ? 401 : 400).json(result || {ok:false,error:'update_failed'});
      return res.status(200).json(result);
    }

    if (action === 'change_pin') {
      const newPin = String(body.new_pin || '').replace(/\D/g,'').slice(0,6);
      const result = await rpc('chidoliro_kitchen_change_pin', {session_token: session, new_pin: newPin});
      if (!result?.ok) return res.status(result?.error === 'forbidden' ? 403 : result?.error === 'unauthorized' ? 401 : 400).json(result || {ok:false,error:'pin_change_failed'});
      return res.status(200).json(result);
    }

    if (action === 'logout') {
      const result = await rpc('chidoliro_kitchen_logout', {session_token: session});
      return res.status(200).json(result || {ok:true});
    }

    return res.status(400).json({ok:false,error:'unknown_action'});
  } catch (error) {
    console.error('[CHIDOLIRO API] kitchen error', error);
    return res.status(502).json({ok:false,error:'kitchen_upstream_failed'});
  }
};
