import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "some-super-secret-fallback-for-development-bidwest",
  });
  const isLoggedIn = !!token;
  const { pathname } = request.nextUrl;

  // Protected pages
  const protectedPaths = [
    "/dashboard",
    "/products",
    "/sales",
    "/suppliers",
    "/reports",
    "/settings",
  ];

  const isPathProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (!isLoggedIn && isPathProtected) {
    // Redirect to login if trying to access protected paths while logged out
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/")) {
    // Redirect to dashboard if logged in and trying to access login page
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/") {
    // Redirect / to login if not logged in, otherwise dashboard
    return NextResponse.redirect(new URL(isLoggedIn ? "/dashboard" : "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/products/:path*",
    "/sales/:path*",
    "/suppliers/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
