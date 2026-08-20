/** @format */

import { auth } from "@/lib/auth/auth.middleware";
import { canAdmin, getPermissaoCoordenadoria } from "@/lib/access-control";
import { NextResponse } from "next/server";

export async function middleware(request: any) {
  const session = await auth();

  // Rotas que requerem DEV e ADM
  const adminRoutes = ["/unidades", "/interessados", "/usuarios"];
  // Rotas que requerem apenas DEV
  const devOnlyRoutes = ["/logs", "/grupos-acesso"];

  const pathname = request.nextUrl.pathname;

  // Verificar se é uma rota protegida
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
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

  const userPermission = session.usuario?.permissao;
  const userCoordenadoriaPermission = getPermissaoCoordenadoria(session);

  // Verificar rotas que requerem DEV e ADM
  if (isAdminRoute && !canAdmin(session)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Verificar rotas que requerem apenas DEV
  if (
    isDevOnlyRoute &&
    userPermission !== "DEV" &&
    userCoordenadoriaPermission !== "ADMINISTRADOR"
  ) {
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
