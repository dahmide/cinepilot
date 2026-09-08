import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/config/auth";

const PUBLIC_ROUTES = ["/signin", "/signup"];
const SECRET_ROUTES = ["/app"];

export function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    // console.log(token);
    const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
    const isSecret = SECRET_ROUTES.some(route => pathname.startsWith(route));

    if (isPublic && token !== undefined) {
        const req = "/app/projects/new";
        const url = new URL(req, request.url);
        return NextResponse.redirect(url);
    }

    if (isSecret && token === undefined) {
        const req = "/signin";
        const url = new URL(req, request.url);
        url.searchParams.set("from", pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Exclude API routes, static files, image optimizations, and .png files
        "/((?!api|_next/static|_next/image|.*\\.png$).*)"
    ]
};
