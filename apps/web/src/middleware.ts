import { SLUG_PATTERN } from "@honeymoney/agents/format";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/app", "/onboarding"];
const AUTH_PAGES = ["/login", "/signup"];

function sitesCsp(nonce: string): string {
  const dev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    `connect-src 'self'${dev ? " ws:" : ""}`,
    "frame-ancestors 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    "object-src 'none'",
  ].join("; ");
}

/** Published pages: rendered with a nonce-based CSP and no session handling at all. */
function servePublishedPage(req: NextRequest, slug: string, rewrite: boolean) {
  const nonce = btoa(crypto.randomUUID());
  const csp = sitesCsp(nonce);
  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const res = rewrite
    ? NextResponse.rewrite(new URL(`/sites/${slug}`, req.url), { request: { headers } })
    : NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Robots-Tag", "index, follow");
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0] ?? "";
  const pagesDomain = process.env.NEXT_PUBLIC_PAGES_DOMAIN?.trim().toLowerCase();

  // 1) <slug>.<pages domain> serves only the published page (cookie-isolated from the app).
  if (pagesDomain && host.endsWith(`.${pagesDomain}`)) {
    const slug = host.slice(0, -(pagesDomain.length + 1));
    if (pathname !== "/" || !SLUG_PATTERN.test(slug)) return new NextResponse("Not found", { status: 404 });
    return servePublishedPage(req, slug, true);
  }

  if (pathname.startsWith("/sites/")) {
    const slug = pathname.split("/")[2] ?? "";
    // In production, pages live on their own subdomain.
    if (pagesDomain && SLUG_PATTERN.test(slug)) {
      return NextResponse.redirect(`https://${slug}.${pagesDomain}/`, 308);
    }
    return servePublishedPage(req, slug, false);
  }

  // 2) Session refresh + route protection only where it matters. robots.txt, sitemap.xml,
  //    the landing page and legal pages stay public and cache-friendly.
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.includes(pathname);
  if (!isProtected && !isAuthPage) return NextResponse.next();

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) req.cookies.set(name, value);
        res = NextResponse.next({ request: req });
        for (const { name, value, options } of toSet) res.cookies.set(name, value, options);
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  if (isAuthPage && user) {
    const url = req.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|api/).*)"],
};
