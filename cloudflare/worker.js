const MENU_QUERIES = {
  categories: ["chidoliro_menu_categories", "select=id,name,slug,description,icon,image_url,sort_order&is_active=eq.true&order=sort_order.asc"],
  items: ["chidoliro_menu_items", "select=id,category_id,name,slug,description,price,price_label,image_url,is_available,is_featured,is_alcoholic,sort_order&is_active=eq.true&is_available=eq.true&order=sort_order.asc"],
  promotions: ["chidoliro_promotions", "select=id,title,slug,subtitle,description,promo_price,discount_percent,days_of_week,image_url,terms,is_featured,sort_order&is_active=eq.true&order=sort_order.asc"],
  variants: ["chidoliro_menu_item_variants", "select=id,item_id,name,price,price_label,is_default,sort_order&is_active=eq.true&order=sort_order.asc"],
  itemGroups: ["chidoliro_menu_item_modifier_groups", "select=item_id,group_id,sort_order&order=sort_order.asc"],
  groups: ["chidoliro_modifier_groups", "select=id,name,description,min_select,max_select,is_required,sort_order&is_active=eq.true&order=sort_order.asc"],
  options: ["chidoliro_modifier_options", "select=id,group_id,name,price_delta,sort_order&is_active=eq.true&order=sort_order.asc"]
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-chidoliro-edge": "cloudflare"
    }
  });
}

async function rpc(env, name, body, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(
      `${env.CHIDOLIRO_SUPABASE_URL}/rest/v1/rpc/${name}`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          apikey: env.CHIDOLIRO_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.CHIDOLIRO_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(body || {})
      }
    );
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text || "{}"); } catch (_) {}
    return { response, text, data };
  } finally {
    clearTimeout(timeout);
  }
}

async function loadMenuResource(env, name, tuple) {
  const [table, query] = tuple;
  const url = `${env.CHIDOLIRO_SUPABASE_URL}/rest/v1/${table}?${query}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        apikey: env.CHIDOLIRO_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.CHIDOLIRO_SUPABASE_ANON_KEY}`,
        Accept: "application/json"
      }
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`${name}:${response.status}:${body.slice(0, 180)}`);
    return JSON.parse(body || "[]");
  } finally {
    clearTimeout(timeout);
  }
}

async function handleMenu(request, env) {
  if (request.method !== "GET") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }
  try {
    const entries = await Promise.all(
      Object.entries(MENU_QUERIES).map(async ([name, tuple]) => [
        name,
        await loadMenuResource(env, name, tuple)
      ])
    );
    const data = Object.fromEntries(entries);
    const counts = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.length : 0
      ])
    );
    return json({ ok: true, source: "cloudflare", data, counts });
  } catch (error) {
    console.error("[CHIDOLIRO API] Cloudflare menu load failed", error);
    return json({
      ok: false,
      error: "menu_upstream_failed",
      detail: String(error?.message || error)
    }, 502);
  }
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (_) {
    return {};
  }
}

async function handleOrder(request, env) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }
  try {
    const payload = await readJson(request);
    if (!payload || typeof payload !== "object" || !Array.isArray(payload.items)) {
      return json({
        ok: false,
        error: "invalid_payload",
        message: "El pedido no tiene el formato correcto."
      }, 400);
    }

    const { response, text, data } = await rpc(env, "chidoliro_create_order", { payload });
    if (!response.ok) {
      const message = data?.message || data?.hint || "No fue posible registrar el pedido.";
      console.error("[CHIDOLIRO API] order failed", response.status, text.slice(0, 300));
      return json({ ok: false, error: "order_rejected", message }, response.status >= 500 ? 502 : 400);
    }
    return json(data && typeof data === "object" ? data : { ok: true });
  } catch (error) {
    console.error("[CHIDOLIRO API] order exception", error);
    return json({
      ok: false,
      error: "order_api_failed",
      message: "No pudimos enviar tu pedido. Intenta nuevamente."
    }, 500);
  }
}

async function handleReservation(request, env) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }
  try {
    const payload = await readJson(request);
    const { response, data } = await rpc(env, "chidoliro_create_reservation", { payload });
    if (!response.ok) {
      return json({
        ok: false,
        error: "reservation_upstream_failed",
        message: "No pudimos registrar la reservación."
      }, 502);
    }
    if (!data?.ok) {
      return json(data || { ok: false, error: "reservation_rejected" }, 400);
    }
    return json(data);
  } catch (error) {
    console.error("[CHIDOLIRO API] reservation error", error);
    return json({
      ok: false,
      error: "reservation_api_failed",
      message: "No pudimos registrar la reservación. Intenta nuevamente."
    }, 500);
  }
}

async function handleTokenLookup(request, env, rpcName, errors) {
  if (request.method !== "GET") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  const token = String(new URL(request.url).searchParams.get("token") || "").trim();
  if (!UUID_RE.test(token)) {
    return json({ ok: false, error: "invalid_token" }, 400);
  }

  try {
    const { response, data } = await rpc(env, rpcName, { p_token: token });
    if (!response.ok) {
      return json({ ok: false, error: errors.upstream }, 502);
    }
    if (!data?.ok) {
      return json(data || { ok: false, error: errors.notFound }, 404);
    }
    return json(data);
  } catch (error) {
    console.error(`[CHIDOLIRO API] ${errors.log}`, error);
    return json({ ok: false, error: errors.failed }, 502);
  }
}

function copyRequestHeaders(request) {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("x-forwarded-proto", "https");
  return headers;
}

async function proxyApi(request, env) {
  const origin = (env.API_ORIGIN || "https://chidoliro.vercel.app").replace(/\/$/, "");
  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, origin);

  const init = {
    method: request.method,
    headers: copyRequestHeaders(request),
    redirect: "manual"
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = request.body;
  }

  const response = await fetch(target, init);
  const headers = new Headers(response.headers);
  headers.set("x-chidoliro-edge", "cloudflare-proxy");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/menu") {
      return handleMenu(request, env);
    }

    if (url.pathname === "/api/order") {
      return handleOrder(request, env);
    }

    if (url.pathname === "/api/order-status") {
      return handleTokenLookup(request, env, "chidoliro_get_order_status", {
        upstream: "tracking_upstream_failed",
        notFound: "not_found",
        failed: "tracking_failed",
        log: "tracking error"
      });
    }

    if (url.pathname === "/api/reservation") {
      return handleReservation(request, env);
    }

    if (url.pathname === "/api/reservation-status") {
      return handleTokenLookup(request, env, "chidoliro_get_reservation_status", {
        upstream: "reservation_tracking_upstream_failed",
        notFound: "not_found",
        failed: "reservation_tracking_failed",
        log: "reservation tracking error"
      });
    }

    if (url.pathname === "/api/table") {
      return handleTokenLookup(request, env, "chidoliro_resolve_table_qr", {
        upstream: "table_upstream_failed",
        notFound: "table_not_found",
        failed: "table_failed",
        log: "table error"
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return proxyApi(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
