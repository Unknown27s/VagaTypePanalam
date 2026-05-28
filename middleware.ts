import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
    if (req.nextUrl.pathname.startsWith("/admin") && req.auth?.user?.role !== "ADMIN") {
        const url = new URL("/", req.nextUrl.origin);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/admin/:path*"],
};