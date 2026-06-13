import { NextResponse, type NextRequest } from "next/server";

/**
 * Guarda rasa: barra acesso a /platform e /admin sem cookie de sessão.
 * A checagem de papel acontece nos guards de servidor (auth-guard).
 */
export function proxy(req: NextRequest) {
  const hasSession = req.cookies.has("beautly_session");
  const { pathname } = req.nextUrl;

  const isLogin = pathname === "/platform/login" || pathname === "/admin/login";
  const isProtected =
    pathname.startsWith("/platform") || pathname.startsWith("/admin");

  if (isProtected && !isLogin && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.startsWith("/admin")
      ? "/admin/login"
      : "/platform/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/platform/:path*", "/admin/:path*"],
};
