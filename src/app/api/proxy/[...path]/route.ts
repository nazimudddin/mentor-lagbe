import { NextRequest } from "next/server";

import { auth } from "@/lib/auth";

// BetterAuth lives in this Next.js app, so the session cookie is first-party
// here. This Route Handler exchanges that cookie for a short-lived BetterAuth
// JWT and forwards the request (plus the original cookie) to Express.
const API_ORIGIN = (
  process.env.API_ORIGIN ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

const SESSION_COOKIE_PATTERN =
  /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=/;

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;

  // Never let a crafted path escape the configured API origin.
  if (path.some((segment) => segment === ".." || segment === ".")) {
    return Response.json({ message: "Invalid API path." }, { status: 400 });
  }

  const target = new URL(`${API_ORIGIN}/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("transfer-encoding");
  headers.delete("accept-encoding");
  // Never trust a client-supplied bearer token. Only the token minted from the
  // verified BetterAuth session below is allowed through.
  headers.delete("authorization");

  const cookieHeader = request.headers.get("cookie") || "";

  if (SESSION_COOKIE_PATTERN.test(cookieHeader)) {
    try {
      const { token } = await auth.api.getToken({
        headers: request.headers,
      });

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
    } catch (error) {
      // The cookie may be stale/expired. Express still receives the cookie and
      // can answer 401; public endpoints keep working.
      console.error("[api-proxy] Unable to issue JWT:", error);
    }
  }

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD"
    ? undefined
    : await request.arrayBuffer();

  const upstream = await fetch(target, {
    method,
    headers,
    body,
    redirect: "manual",
    cache: "no-store",
  });

  const responseHeaders = new Headers(upstream.headers);
  // Let Next.js negotiate compression/length for the proxied response.
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export {
  proxyRequest as GET,
  proxyRequest as POST,
  proxyRequest as PATCH,
  proxyRequest as PUT,
  proxyRequest as DELETE,
  proxyRequest as OPTIONS,
};
