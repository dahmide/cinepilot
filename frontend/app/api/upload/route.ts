import { API_BASE } from "@/config/api";
import { AUTH_COOKIE_NAME } from "@/config/auth";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    // 1. Extract token from local Next.js server cookie store
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    console.log("Cookie: ", cookieToken)

    if (!cookieToken) {
        return NextResponse.json(
            { detail: "Not authenticated" },
            { status: 401 }
        );
    }

    // 2. Extract content-type header (critical for keeping boundary info in multipart/form-data)
    const contentType = req.headers.get("content-type") || "";

    try {
        // 3. Forward request from Next.js server -> Cloud Run
        const apiRes = await fetch(`${API_BASE}/upload`, {
            method: "POST",
            headers: {
                Cookie: `${AUTH_COOKIE_NAME}=${cookieToken}`,
                "Content-Type": contentType,
            },
            // Stream raw request body (formData) directly to Cloud Run
            body: req.body,
            // @ts-ignore - Required by Node/Next.js fetch when body is a ReadableStream
            duplex: "half",
        });

        if (!apiRes.ok) {
            const errorText = await apiRes.text();
            return new NextResponse(errorText, { status: apiRes.status });
        }

        // 4. Pipe SSE stream directly back to frontend browser
        const { readable, writable } = new TransformStream();
        if (apiRes.body) {
            apiRes.body.pipeTo(writable);
        }

        return new NextResponse(readable, {
            status: 200,
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
                "X-Accel-Buffering": "no", // Disables proxy buffering
            },
        });
    } catch (error) {
        console.error("Proxy upload error:", error);
        return NextResponse.json(
            { detail: "Internal proxy error" },
            { status: 500 }
        );
    }
}
