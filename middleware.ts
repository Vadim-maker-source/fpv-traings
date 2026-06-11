import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req, secret });
  
  const pathname = req.nextUrl.pathname;

  // 1. Защита админки
  if (pathname.startsWith("/admin")) {
    if (!token || token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // 2. Проверка неподтвержденных тренеров
  if (token && token.role === "TEACHER" && token.isChecked === false) {
    const allowedPaths = ["/", "/waiting-verification", "/api/auth", "/game"]; // Добавил /game сюда на всякий случай
    const isAllowed = allowedPaths.some(path => pathname.startsWith(path));

    if (!isAllowed) {
      return NextResponse.redirect(new URL("/waiting-verification", req.url));
    }
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
     * - game (Unity build files) <-- ВАЖНО: Исключаем папку с игрой
     */
    "/((?!api|_next/static|_next/image|favicon.ico|game|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|html|wasm|data)$).*)",
  ],
};