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

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-chidoliro-edge": "cloudflare",
      ...headers
    }
  });
}

function authToken(request, body = null) {
  const auth = String(request.headers.get("authorization") || "");
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return String(body?.session_token || "").trim();
}

function statusFor(result) {
  if (result?.error === "forbidden") return 403;
  if (result?.error === "unauthorized" || result?.error === "staff_session_required") return 401;
  if (result?.error === "too_many_attempts") return 429;
  return 400;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (_) {
    return {};
  }
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
    try { data = JSON.parse(text || "null"); } catch (_) {}
    return { response, text, data };
  } finally {
    clearTimeout(timeout);
  }
}

async function rpcData(env, name, body) {
  const { response, text, data } = await rpc(env, name, body);
  if (!response.ok) throw new Error(`rpc_${name}_${response.status}:${text.slice(0, 200)}`);
  return data;
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function fingerprint(request) {
  const ip = String(
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    ""
  ).split(",")[0].trim();
  const ua = String(request.headers.get("user-agent") || "");
  return sha256Hex(`${ip}|${ua}`);
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
  if (request.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  try {
    const entries = await Promise.all(
      Object.entries(MENU_QUERIES).map(async ([name, tuple]) => [name, await loadMenuResource(env, name, tuple)])
    );
    const data = Object.fromEntries(entries);
    const counts = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
    );
    return json({ ok: true, source: "cloudflare", data, counts });
  } catch (error) {
    console.error("[CHIDOLIRO API] Cloudflare menu load failed", error);
    return json({ ok: false, error: "menu_upstream_failed", detail: String(error?.message || error) }, 502);
  }
}

async function handleOrder(request, env) {
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  try {
    const payload = await readJson(request);
    if (!payload || typeof payload !== "object" || !Array.isArray(payload.items)) {
      return json({ ok: false, error: "invalid_payload", message: "El pedido no tiene el formato correcto." }, 400);
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
    return json({ ok: false, error: "order_api_failed", message: "No pudimos enviar tu pedido. Intenta nuevamente." }, 500);
  }
}

async function handleReservation(request, env) {
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  try {
    const payload = await readJson(request);
    const { response, data } = await rpc(env, "chidoliro_create_reservation", { payload });
    if (!response.ok) return json({ ok: false, error: "reservation_upstream_failed", message: "No pudimos registrar la reservación." }, 502);
    if (!data?.ok) return json(data || { ok: false, error: "reservation_rejected" }, 400);
    return json(data);
  } catch (error) {
    console.error("[CHIDOLIRO API] reservation error", error);
    return json({ ok: false, error: "reservation_api_failed", message: "No pudimos registrar la reservación. Intenta nuevamente." }, 500);
  }
}

async function handleTokenLookup(request, env, rpcName, errors) {
  if (request.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  const token = String(new URL(request.url).searchParams.get("token") || "").trim();
  if (!UUID_RE.test(token)) return json({ ok: false, error: "invalid_token" }, 400);
  try {
    const { response, data } = await rpc(env, rpcName, { p_token: token });
    if (!response.ok) return json({ ok: false, error: errors.upstream }, 502);
    if (!data?.ok) return json(data || { ok: false, error: errors.notFound }, 404);
    return json(data);
  } catch (error) {
    console.error(`[CHIDOLIRO API] ${errors.log}`, error);
    return json({ ok: false, error: errors.failed }, 502);
  }
}

async function handleKitchen(request, env) {
  try {
    const url = new URL(request.url);
    if (request.method === "GET") {
      const session = authToken(request);
      if (!session) return json({ ok: false, error: "missing_session" }, 401);
      const station = String(url.searchParams.get("station") || "kitchen").trim().toLowerCase();
      const result = await rpcData(env, "chidoliro_staff_station_orders", { session_token: session, station_input: station });
      if (!result?.ok) return json(result || { ok: false, error: "station_load_failed" }, statusFor(result));
      return json(result);
    }

    if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
    const body = await readJson(request);
    const action = String(body.action || "").trim();

    if (action === "login") {
      const pin = String(body.pin || "").replace(/\D/g, "").slice(0, 6);
      const username = String(body.username || "").trim().toLowerCase();
      const client_fingerprint = await fingerprint(request);
      const result = username
        ? await rpcData(env, "chidoliro_staff_login", { username_input: username, pin_input: pin, client_fingerprint })
        : await rpcData(env, "chidoliro_kitchen_login", { pin_input: pin, client_fingerprint });
      if (!result?.ok) return json(result || { ok: false, error: "login_failed" }, statusFor(result));
      return json(result);
    }

    const session = authToken(request, body);
    if (!session) return json({ ok: false, error: "missing_session" }, 401);

    let result;
    if (action === "profile") {
      result = await rpcData(env, "chidoliro_staff_session", { session_token: session });
    } else if (action === "list_users") {
      result = await rpcData(env, "chidoliro_staff_list", { session_token: session });
    } else if (action === "save_user") {
      result = await rpcData(env, "chidoliro_staff_save", {
        session_token: session,
        payload: {
          id: body.id || null,
          username: String(body.username || "").trim().toLowerCase(),
          display_name: String(body.display_name || "").trim(),
          role: String(body.role || "").trim().toLowerCase(),
          pin: String(body.pin || "").replace(/\D/g, "").slice(0, 6),
          is_active: body.is_active !== false
        }
      });
    } else if (action === "station_orders") {
      result = await rpcData(env, "chidoliro_staff_station_orders", {
        session_token: session,
        station_input: String(body.station || "kitchen").trim().toLowerCase()
      });
    } else if (action === "station_unit_update") {
      result = await rpcData(env, "chidoliro_staff_station_unit_update", {
        session_token: session,
        target_unit_id: String(body.unit_id || ""),
        new_status: String(body.status || "").trim().toLowerCase()
      });
    } else if (action === "station_item_update") {
      result = body.unit_id
        ? await rpcData(env, "chidoliro_staff_station_unit_update", {
            session_token: session,
            target_unit_id: String(body.unit_id),
            new_status: String(body.status || "").trim().toLowerCase()
          })
        : await rpcData(env, "chidoliro_staff_station_item_update", {
            session_token: session,
            target_order_item_id: String(body.order_item_id || ""),
            new_status: String(body.status || "").trim().toLowerCase()
          });
    } else if (action === "station_update" || action === "update") {
      result = await rpcData(env, "chidoliro_staff_station_update", {
        session_token: session,
        target_order_id: String(body.order_id || ""),
        station_input: String(body.station || "kitchen").trim().toLowerCase(),
        new_status: String(body.status || "").trim().toLowerCase()
      });
    } else if (action === "delivery_list") {
      result = await rpcData(env, "chidoliro_staff_delivery_orders", { session_token: session });
    } else if (action === "mark_unit_delivered") {
      result = await rpcData(env, "chidoliro_staff_mark_unit_delivered", {
        session_token: session,
        target_unit_id: String(body.unit_id || "")
      });
    } else if (action === "mark_item_delivered") {
      result = body.unit_id
        ? await rpcData(env, "chidoliro_staff_mark_unit_delivered", {
            session_token: session,
            target_unit_id: String(body.unit_id)
          })
        : await rpcData(env, "chidoliro_staff_mark_item_delivered", {
            session_token: session,
            target_order_item_id: String(body.order_item_id || "")
          });
    } else if (action === "mark_delivered") {
      result = body.unit_id
        ? await rpcData(env, "chidoliro_staff_mark_unit_delivered", {
            session_token: session,
            target_unit_id: String(body.unit_id)
          })
        : body.order_item_id
          ? await rpcData(env, "chidoliro_staff_mark_item_delivered", {
              session_token: session,
              target_order_item_id: String(body.order_item_id)
            })
          : await rpcData(env, "chidoliro_staff_mark_station_delivered", {
              session_token: session,
              target_order_id: String(body.order_id || ""),
              station_input: String(body.station || "").trim().toLowerCase()
            });
    } else if (action === "waiter_overview") {
      result = await rpcData(env, "chidoliro_pos_overview", { session_token: session });
    } else if (action === "assign_waiter") {
      result = await rpcData(env, "chidoliro_pos_assign_waiter", {
        session_token: session,
        target_table_id: String(body.table_id || ""),
        target_waiter_id: body.waiter_id ? String(body.waiter_id) : null
      });
    } else if (action === "activity") {
      result = await rpcData(env, "chidoliro_staff_activity", {
        session_token: session,
        limit_input: Number(body.limit || 100),
        offset_input: Number(body.offset || 0)
      });
    } else if (action === "change_pin") {
      result = await rpcData(env, "chidoliro_kitchen_change_pin", {
        session_token: session,
        new_pin: String(body.new_pin || "").replace(/\D/g, "").slice(0, 6)
      });
    } else if (action === "logout") {
      result = await rpcData(env, "chidoliro_kitchen_logout", { session_token: session });
      return json(result || { ok: true });
    } else {
      return json({ ok: false, error: "unknown_action" }, 400);
    }

    if (!result?.ok) return json(result || { ok: false, error: "action_failed" }, statusFor(result));
    return json(result);
  } catch (error) {
    console.error("[CHIDOLIRO API] kitchen error", error);
    return json({ ok: false, error: "kitchen_upstream_failed" }, 502);
  }
}

async function handleKitchenReservations(request, env) {
  try {
    const url = new URL(request.url);
    if (request.method === "GET") {
      const session = authToken(request);
      if (!session) return json({ ok: false, error: "missing_session" }, 401);
      const date = String(url.searchParams.get("date") || "").trim() || null;
      const result = await rpcData(env, "chidoliro_staff_reservations", { session_token: session, p_date: date });
      if (!result?.ok) return json(result || { ok: false, error: "reservation_load_failed" }, statusFor(result));
      return json(result);
    }
    if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
    const body = await readJson(request);
    const session = authToken(request, body);
    if (!session) return json({ ok: false, error: "missing_session" }, 401);
    if (String(body.action || "") !== "update") return json({ ok: false, error: "unknown_action" }, 400);
    const result = await rpcData(env, "chidoliro_staff_update_reservation", {
      session_token: session,
      target_reservation_id: String(body.reservation_id || "").trim(),
      new_status: String(body.status || "").trim()
    });
    if (!result?.ok) return json(result || { ok: false, error: "reservation_update_failed" }, statusFor(result));
    return json(result);
  } catch (error) {
    console.error("[CHIDOLIRO API] kitchen reservations error", error);
    return json({ ok: false, error: "reservation_upstream_failed" }, 502);
  }
}

async function callCreateOrder(env, payload) {
  const { response, text, data } = await rpc(env, "chidoliro_create_order", { payload });
  if (!response.ok) {
    const message = data?.message || data?.hint || data?.error || "order_rejected";
    throw new Error(message + ":" + text.slice(0, 180));
  }
  return data;
}

async function handlePos(request, env) {
  const session = authToken(request);
  if (!session) return json({ ok: false, error: "missing_session" }, 401);
  try {
    const url = new URL(request.url);
    const payload = { items: [], session_token: session };
    if (request.method === "GET") {
      const tableId = String(url.searchParams.get("table_id") || "").trim();
      payload.pos_action = tableId ? "detail" : "overview";
      if (tableId) payload.table_id = tableId;
    } else if (request.method === "POST") {
      const body = await readJson(request);
      const action = String(body.action || "").trim();
      if (!["open", "add_order", "close"].includes(action)) return json({ ok: false, error: "unknown_action" }, 400);
      payload.pos_action = action;
      payload.table_id = String(body.table_id || "").trim();
      payload.items = Array.isArray(body.items) ? body.items : [];
      payload.notes = body.notes || null;
      payload.payment_method = body.payment_method || null;
      payload.cash_received = body.cash_received ?? null;
    } else {
      return json({ ok: false, error: "method_not_allowed" }, 405);
    }

    const result = await callCreateOrder(env, payload);
    if (!result?.ok) {
      if (result?.error === "cash_shift_required") {
        return json({ ok: false, error: "Primero abre la caja en /caja.html antes de cerrar una cuenta." }, 400);
      }
      return json(result || { ok: false, error: "pos_failed" }, result?.error === "unauthorized" ? 401 : 400);
    }
    return json(result);
  } catch (error) {
    console.error("[CHIDOLIRO API] pos error", error);
    return json({ ok: false, error: "pos_upstream_failed" }, 502);
  }
}

async function handleCash(request, env) {
  const session = authToken(request);
  if (!session) return json({ ok: false, error: "missing_session" }, 401);
  try {
    const url = new URL(request.url);
    const payload = { items: [], session_token: session };
    if (request.method === "GET") {
      payload.cash_action = "overview";
      const shiftId = url.searchParams.get("shift_id");
      if (shiftId) payload.shift_id = String(shiftId);
    } else if (request.method === "POST") {
      const body = await readJson(request);
      const action = String(body.action || "").trim();
      if (!["open_shift", "movement", "pay_takeout", "close_shift"].includes(action)) {
        return json({ ok: false, error: "unknown_action" }, 400);
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
      return json({ ok: false, error: "method_not_allowed" }, 405);
    }

    const result = await callCreateOrder(env, payload);
    if (!result?.ok) return json(result || { ok: false, error: "cash_failed" }, result?.error === "unauthorized" ? 401 : 400);
    return json(result);
  } catch (error) {
    console.error("[CHIDOLIRO API] cash error", error);
    return json({ ok: false, error: "cash_upstream_failed" }, 502);
  }
}

async function handleInventory(request, env) {
  try {
    const session_token = authToken(request);
    if (!session_token) return json({ ok: false, error: "missing_session" }, 401);

    if (request.method === "GET") {
      const result = await rpcData(env, "chidoliro_staff_inventory_overview", { session_token });
      if (!result?.ok) return json(result || { ok: false, error: "inventory_load_failed" }, statusFor(result));
      return json(result);
    }

    if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
    const body = await readJson(request);
    const action = String(body.action || "").trim();
    let result;
    if (action === "save_item") {
      result = await rpcData(env, "chidoliro_staff_inventory_upsert", {
        session_token,
        item_payload: {
          id: body.id || null,
          name: body.name || "",
          unit: body.unit || "pza",
          reorder_level: body.reorder_level ?? 0,
          unit_cost: body.unit_cost ?? 0
        }
      });
    } else if (action === "movement") {
      result = await rpcData(env, "chidoliro_staff_inventory_adjust", {
        session_token,
        target_item_id: String(body.item_id || ""),
        movement_type_input: String(body.movement_type || ""),
        quantity_input: Number(body.quantity || 0),
        unit_cost_input: body.unit_cost === null || body.unit_cost === undefined || body.unit_cost === "" ? null : Number(body.unit_cost),
        notes_input: body.notes || null
      });
    } else if (action === "save_recipe") {
      result = await rpcData(env, "chidoliro_staff_inventory_recipe", {
        session_token,
        target_menu_item_id: String(body.menu_item_id || ""),
        ingredients: Array.isArray(body.ingredients) ? body.ingredients : []
      });
    } else {
      return json({ ok: false, error: "unknown_action" }, 400);
    }

    if (!result?.ok) return json(result || { ok: false, error: "inventory_action_failed" }, statusFor(result));
    return json(result);
  } catch (error) {
    console.error("[CHIDOLIRO API] inventory error", error);
    return json({ ok: false, error: "inventory_upstream_failed" }, 502);
  }
}

async function handleReports(request, env) {
  try {
    const session_token = authToken(request);
    if (!session_token) return json({ ok: false, error: "missing_session" }, 401);

    const url = new URL(request.url);
    if (request.method === "GET") {
      const start_input = url.searchParams.get("from") || null;
      const end_input = url.searchParams.get("to") || null;
      const result = await rpcData(env, "chidoliro_staff_operational_metrics", { session_token, start_input, end_input });
      if (!result?.ok) return json(result || { ok: false, error: "reports_load_failed" }, statusFor(result));
      return json(result);
    }

    if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
    const body = await readJson(request);
    const action = String(body.action || "").trim();
    let result;
    if (action === "get_targets") {
      result = await rpcData(env, "chidoliro_staff_operational_targets_get", { session_token });
    } else if (action === "save_targets") {
      result = await rpcData(env, "chidoliro_staff_operational_targets_save", {
        session_token,
        payload: {
          kitchen_minutes: body.kitchen_minutes ?? "",
          bar_minutes: body.bar_minutes ?? "",
          delivery_minutes: body.delivery_minutes ?? ""
        }
      });
    } else {
      return json({ ok: false, error: "unknown_action" }, 400);
    }

    if (!result?.ok) return json(result || { ok: false, error: "reports_action_failed" }, statusFor(result));
    return json(result);
  } catch (error) {
    console.error("[CHIDOLIRO API] reports error", error);
    return json({ ok: false, error: "reports_upstream_failed" }, 502);
  }
}

async function handleTables(request, env) {
  try {
    if (request.method === "GET") {
      const token = authToken(request);
      if (!token) return json({ ok: false, error: "missing_session" }, 401);
      const result = await rpcData(env, "chidoliro_staff_tables", { session_token: token });
      if (!result?.ok) return json(result || { ok: false, error: "tables_load_failed" }, statusFor(result));
      return json(result);
    }

    if (request.method === "POST") {
      const body = await readJson(request);
      const token = authToken(request, body);
      if (!token) return json({ ok: false, error: "missing_session" }, 401);
      const count = Math.max(1, Math.min(100, Number(body.count || 0)));
      const result = await rpcData(env, "chidoliro_staff_sync_tables", { session_token: token, target_count: count });
      if (!result?.ok) return json(result, statusFor(result));
      const list = await rpcData(env, "chidoliro_staff_tables", { session_token: token });
      return json(list);
    }

    return json({ ok: false, error: "method_not_allowed" }, 405);
  } catch (error) {
    console.error("[CHIDOLIRO API] tables error", error);
    return json({ ok: false, error: "tables_upstream_failed" }, 502);
  }
}

async function handleMenuAdmin(request, env) {
  try {
    const session_token = authToken(request);
    if (!session_token) return json({ ok: false, error: "missing_session" }, 401);
    const url = new URL(request.url);

    if (request.method === "GET") {
      const dashboard = url.searchParams.get("dashboard") === "1";
      const result = await rpcData(env, dashboard ? "chidoliro_staff_dashboard" : "chidoliro_menu_admin_overview", { session_token });
      if (!result?.ok) return json(result || { ok: false, error: dashboard ? "dashboard_failed" : "menu_admin_load_failed" }, statusFor(result));
      return json(result);
    }

    if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
    const body = await readJson(request);
    const action = String(body.action || "").trim();
    let result;

    if (action === "save_item") {
      result = await rpcData(env, "chidoliro_menu_admin_save_item", {
        session_token,
        payload: {
          id: body.id || null,
          category_id: body.category_id || null,
          name: body.name || "",
          description: body.description || null,
          price: body.price ?? null,
          price_label: body.price_label || null,
          is_available: body.is_available !== false,
          is_featured: !!body.is_featured,
          is_active: body.is_active !== false,
          is_alcoholic: !!body.is_alcoholic,
          prep_station: ["kitchen", "bar"].includes(String(body.prep_station || "")) ? String(body.prep_station) : null,
          sort_order: Number(body.sort_order || 0)
        }
      });
    } else if (action === "upload_image") {
      const base64 = String(body.image_base64 || "");
      if (base64.length > 3500000) return json({ ok: false, error: "image_too_large" }, 413);
      result = await rpcData(env, "chidoliro_menu_admin_upload_image", {
        session_token,
        target_item_id: String(body.item_id || ""),
        mime_input: String(body.mime_type || ""),
        base64_input: base64,
        width_input: body.width ? Number(body.width) : null,
        height_input: body.height ? Number(body.height) : null
      });
    } else if (action === "remove_image") {
      result = await rpcData(env, "chidoliro_menu_admin_remove_image", {
        session_token,
        target_item_id: String(body.item_id || "")
      });
    } else if (action === "save_category") {
      result = await rpcData(env, "chidoliro_menu_admin_save_category", {
        session_token,
        payload: {
          id: body.id || null,
          name: body.name || "",
          description: body.description || null,
          icon: body.icon || null,
          sort_order: Number(body.sort_order || 0),
          is_active: body.is_active !== false
        }
      });
    } else if (action === "save_modifier_group") {
      result = await rpcData(env, "chidoliro_menu_admin_save_modifier_group", {
        session_token,
        payload: {
          id: body.id || null,
          name: body.name || "",
          description: body.description || null,
          min_select: Number(body.min_select || 0),
          max_select: Number(body.max_select || 1),
          is_required: !!body.is_required,
          is_active: body.is_active !== false,
          sort_order: Number(body.sort_order || 0)
        }
      });
    } else if (action === "save_modifier_option") {
      result = await rpcData(env, "chidoliro_menu_admin_save_modifier_option", {
        session_token,
        payload: {
          id: body.id || null,
          group_id: body.group_id || null,
          name: body.name || "",
          price_delta: Number(body.price_delta || 0),
          is_active: body.is_active !== false,
          sort_order: Number(body.sort_order || 0)
        }
      });
    } else if (action === "set_item_modifiers") {
      result = await rpcData(env, "chidoliro_menu_admin_set_item_modifiers", {
        session_token,
        target_item_id: String(body.item_id || ""),
        group_ids: Array.isArray(body.group_ids) ? body.group_ids : []
      });
    } else if (action === "save_promotion") {
      result = await rpcData(env, "chidoliro_menu_admin_save_promotion", {
        session_token,
        payload: {
          id: body.id || null,
          title: body.title || "",
          subtitle: body.subtitle || null,
          description: body.description || null,
          promo_price: body.promo_price ?? null,
          discount_percent: body.discount_percent ?? null,
          days_of_week: Array.isArray(body.days_of_week) ? body.days_of_week : [],
          start_date: body.start_date || null,
          end_date: body.end_date || null,
          start_time: body.start_time || null,
          end_time: body.end_time || null,
          terms: body.terms || null,
          is_featured: !!body.is_featured,
          is_active: body.is_active !== false,
          sort_order: Number(body.sort_order || 0)
        }
      });
    } else {
      return json({ ok: false, error: "unknown_action" }, 400);
    }

    if (!result?.ok) return json(result || { ok: false, error: "menu_admin_action_failed" }, statusFor(result));
    return json(result);
  } catch (error) {
    console.error("[CHIDOLIRO API] menu admin error", error);
    return json({ ok: false, error: "menu_admin_upstream_failed" }, 502);
  }
}

async function handleDashboard(request, env) {
  if (request.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  const session_token = authToken(request);
  if (!session_token) return json({ ok: false, error: "missing_session" }, 401);
  try {
    const result = await rpcData(env, "chidoliro_staff_dashboard", { session_token });
    if (!result?.ok) return json(result || { ok: false, error: "dashboard_failed" }, statusFor(result));
    return json(result);
  } catch (error) {
    console.error("[CHIDOLIRO API] dashboard error", error);
    return json({ ok: false, error: "dashboard_upstream_failed" }, 502);
  }
}

function base64Bytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function handleEvents(request, env) {
  if (request.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  try {
    const result = await rpcData(env, "chidoliro_events_public", {});
    if (!result?.ok) return json(result || { ok: false, error: "events_failed" }, 400);
    return json(result, 200, { "cache-control": "public, max-age=60, stale-while-revalidate=300" });
  } catch (error) {
    console.error("[CHIDOLIRO API] events error", error);
    return json({ ok: false, error: "events_upstream_failed" }, 502);
  }
}

async function handleEventsAdmin(request, env) {
  try {
    const session_token = authToken(request);
    if (!session_token) return json({ ok: false, error: "missing_session" }, 401);

    if (request.method === "GET") {
      const result = await rpcData(env, "chidoliro_events_admin_overview", { session_token });
      if (!result?.ok) return json(result || { ok: false, error: "events_admin_load_failed" }, statusFor(result));
      return json(result);
    }

    if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
    const body = await readJson(request);
    const action = String(body.action || "").trim();
    let result;

    if (action === "save") {
      result = await rpcData(env, "chidoliro_events_admin_save", {
        session_token,
        payload: {
          id: body.id || null,
          title: body.title || "",
          slug: body.slug || "",
          eyebrow: body.eyebrow || null,
          subtitle: body.subtitle || null,
          description: body.description || null,
          event_date: body.event_date || null,
          start_time: body.start_time || null,
          end_time: body.end_time || null,
          location: body.location || null,
          address: body.address || null,
          whatsapp: body.whatsapp || null,
          reservation_message: body.reservation_message || null,
          sponsor: body.sponsor || null,
          artists: Array.isArray(body.artists) ? body.artists : [],
          is_featured: !!body.is_featured,
          is_published: !!body.is_published,
          show_home: !!body.show_home,
          sort_order: Number(body.sort_order || 0)
        }
      });
    } else if (action === "upload_image") {
      const base64 = String(body.image_base64 || "");
      if (base64.length > 3500000) return json({ ok: false, error: "image_too_large" }, 413);
      result = await rpcData(env, "chidoliro_events_admin_upload_image", {
        session_token,
        target_event_id: String(body.event_id || ""),
        mime_input: String(body.mime_type || ""),
        base64_input: base64,
        width_input: body.width ? Number(body.width) : null,
        height_input: body.height ? Number(body.height) : null
      });
    } else if (action === "remove_image") {
      result = await rpcData(env, "chidoliro_events_admin_remove_image", {
        session_token,
        target_event_id: String(body.event_id || "")
      });
    } else if (action === "delete") {
      result = await rpcData(env, "chidoliro_events_admin_delete", {
        session_token,
        target_event_id: String(body.event_id || "")
      });
    } else {
      return json({ ok: false, error: "unknown_action" }, 400);
    }

    if (!result?.ok) return json(result || { ok: false, error: "events_admin_action_failed" }, statusFor(result));
    return json(result);
  } catch (error) {
    console.error("[CHIDOLIRO API] events admin error", error);
    return json({ ok: false, error: "events_admin_upstream_failed" }, 502);
  }
}

async function handleEventImage(request, env) {
  if (request.method !== "GET") return new Response(null, { status: 405 });
  const eventId = String(new URL(request.url).searchParams.get("event_id") || "").trim();
  if (!UUID_RE.test(eventId)) return new Response(null, { status: 404 });
  try {
    const { response, data } = await rpc(env, "chidoliro_event_image_public", { target_event_id: eventId });
    if (!response.ok || !data?.ok || !data.image_base64) return new Response(null, { status: 404 });
    const bytes = base64Bytes(data.image_base64);
    return new Response(bytes, {
      status: 200,
      headers: {
        "content-type": data.mime_type || "image/webp",
        "content-length": String(bytes.length),
        "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
        "etag": `W/"event-${eventId}-${new Date(data.updated_at || 0).getTime()}-${bytes.length}"`,
        "x-chidoliro-edge": "cloudflare"
      }
    });
  } catch (error) {
    console.error("[CHIDOLIRO API] event image error", error);
    return new Response(null, { status: 404 });
  }
}

async function handleMenuImage(request, env) {
  if (request.method !== "GET") return new Response(null, { status: 405 });
  const itemId = String(new URL(request.url).searchParams.get("item_id") || "").trim();
  if (!UUID_RE.test(itemId)) return new Response(null, { status: 404 });
  try {
    const { response, data } = await rpc(env, "chidoliro_menu_image_public", { target_item_id: itemId });
    if (!response.ok || !data?.ok || !data.image_base64) return new Response(null, { status: 404 });
    const bytes = base64Bytes(data.image_base64);
    return new Response(bytes, {
      status: 200,
      headers: {
        "content-type": data.mime_type || "image/webp",
        "content-length": String(bytes.length),
        "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
        "etag": `W/"${itemId}-${new Date(data.updated_at || 0).getTime()}-${bytes.length}"`,
        "x-chidoliro-edge": "cloudflare"
      }
    });
  } catch (error) {
    console.error("[CHIDOLIRO API] menu image error", error);
    return new Response(null, { status: 404 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/menu") return handleMenu(request, env);
    if (url.pathname === "/api/order") return handleOrder(request, env);
    if (url.pathname === "/api/order-status") return handleTokenLookup(request, env, "chidoliro_get_order_status", {
      upstream: "tracking_upstream_failed", notFound: "not_found", failed: "tracking_failed", log: "tracking error"
    });
    if (url.pathname === "/api/reservation") return handleReservation(request, env);
    if (url.pathname === "/api/reservation-status") return handleTokenLookup(request, env, "chidoliro_get_reservation_status", {
      upstream: "reservation_tracking_upstream_failed", notFound: "not_found", failed: "reservation_tracking_failed", log: "reservation tracking error"
    });
    if (url.pathname === "/api/table") return handleTokenLookup(request, env, "chidoliro_resolve_table_qr", {
      upstream: "table_upstream_failed", notFound: "table_not_found", failed: "table_failed", log: "table error"
    });
    if (url.pathname === "/api/kitchen") return handleKitchen(request, env);
    if (url.pathname === "/api/kitchen-reservations") return handleKitchenReservations(request, env);
    if (url.pathname === "/api/pos") return handlePos(request, env);
    if (url.pathname === "/api/cash") return handleCash(request, env);
    if (url.pathname === "/api/inventory") return handleInventory(request, env);
    if (url.pathname === "/api/reports") return handleReports(request, env);
    if (url.pathname === "/api/tables") return handleTables(request, env);
    if (url.pathname === "/api/menu-admin") return handleMenuAdmin(request, env);
    if (url.pathname === "/api/events") return handleEvents(request, env);
    if (url.pathname === "/api/events-admin") return handleEventsAdmin(request, env);
    if (url.pathname === "/api/event-image") return handleEventImage(request, env);
    if (url.pathname === "/api/dashboard") return handleDashboard(request, env);
    if (url.pathname === "/api/menu-image") return handleMenuImage(request, env);

    if (url.pathname.startsWith("/api/")) return json({ ok: false, error: "not_found" }, 404);
    return env.ASSETS.fetch(request);
  }
};
