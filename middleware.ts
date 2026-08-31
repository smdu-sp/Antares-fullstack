/** @format */

import { auth } from "@/lib/auth/auth.middleware";
import { NextResponse } from "next/server";

export async function middleware(request: any) {
  const session = await auth();

  // Rotas restritas a DEV (usuários, unidades, interessados, permissões e logs
  // são gestão de sistema — não fazem mais parte do escopo de um ADM de grupo comum)
  const devOnlyRoutes = [
    "/unidades",
    "/interessados",
    "/usuarios",
    "/permissoes",
    "/logs",
  ];

  const pathname = request.nextUrl.pathname;

  const isDevOnlyRoute = devOnlyRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Se não está autenticado
  if (!session) {
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  const isDev = session.usuario?.dev;

  if (isDevOnlyRoute && !isDev) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
