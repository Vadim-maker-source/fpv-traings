import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req, secret });
  
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/admin")) {
    if (!token || token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (token && token.role === "TEACHER" && token.isChecked === false) {
    
    const allowedPaths = ["/", "/waiting-verification", "/api/auth"];
    const isAllowed = allowedPaths.some(path => pathname.startsWith(path));

    if (!isAllowed) {
      return NextResponse.redirect(new URL("/waiting-verification", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};