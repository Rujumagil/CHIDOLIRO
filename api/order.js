const SUPABASE_URL = process.env.CHIDOLIRO_SUPABASE_URL || 'https://qwxydjotwhniahaovrff.supabase.co';
const SUPABASE_ANON_KEY = process.env.CHIDOLIRO_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eHlkam90d2huaWFoYW92cmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MTgxOTQsImV4cCI6MjEwMTA5NDE5NH0.bxRhmjNYrxPIXE4-SxS_YCxpWafFdQWVlaj9E1pdLSc';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'method_not_allowed' });

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.items)) {
      return res.status(400).json({ ok:false, error:'invalid_payload', message:'El pedido no tiene el formato correcto.' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/chidoliro_create_order`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ payload })
      });
      const text = await response.text();
      let data = null;
      try { data = JSON.parse(text || '{}'); } catch (_) {}
      if (!response.ok) {
        const message = data?.message || data?.hint || 'No fue posible registrar el pedido.';
        console.error('[CHIDOLIRO API] order failed', response.status, text.slice(0,300));
        return res.status(response.status >= 500 ? 502 : 400).json({ ok:false, error:'order_rejected', message });
      }
      return res.status(200).json(data && typeof data === 'object' ? data : { ok:true });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('[CHIDOLIRO API] order exception', error);
    return res.status(500).json({ ok:false, error:'order_api_failed', message:'No pudimos enviar tu pedido. Intenta nuevamente.' });
  }
};
