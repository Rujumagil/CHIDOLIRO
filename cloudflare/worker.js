const MENU_QUERIES = {
  categories: ["chidoliro_menu_categories", "select=id,name,slug,description,icon,image_url,sort_order&is_active=eq.true&order=sort_order.asc"],
  items: ["chidoliro_menu_items", "select=id,category_id,name,slug,description,price,price_label,image_url,is_available,is_featured,is_alcoholic,sort_order&is_active=eq.true&is_available=eq.true&order=sort_order.asc"],
  promotions: ["chidoliro_promotions", "select=id,title,slug,subtitle,description,promo_price,discount_percent,days_of_week,image_url,terms,is_featured,sort_order&is_active=eq.true&order=sort_order.asc"],
  variants: ["chidoliro_menu_item_variants", "select=id,item_id,name,price,price_label,is_default,sort_order&is_active=eq.true&order=sort_order.asc"],
  itemGroups: ["chidoliro_menu_item_modifier_groups", "select=item_id,group_id,sort_order&order=sort_order.asc"],
  groups: ["chidoliro_modifier_groups", "select=id,name,description,min_select,max_select,is_required,sort_order&is_active=eq.true&order=sort_order.asc"],
  options: ["chidoliro_modifier_options", "select=id,group_id,name,price_delta,sort_order&is_active=eq.true&order=sort_order.asc"]
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0"
    }
  });
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

    if (url.pathname.startsWith("/api/")) {
      return proxyApi(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
