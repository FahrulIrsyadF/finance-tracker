import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuth = !!token;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");

  if (!isAuth && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/wallets/:path*",
    "/categories/:path*",
    "/reports/:path*",
    "/import/:path*",
    "/login",
  ],
};
