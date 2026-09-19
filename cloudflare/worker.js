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
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = request.body;
  }

  const response = await fetch(target, init);
  const headers = new Headers(response.headers);
  headers.set("x-chidoliro-edge", "cloudflare");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return proxyApi(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
