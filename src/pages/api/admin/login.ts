import type { APIRoute } from "astro";
import {
    ADMIN_COOKIE_NAME,
    createAdminSessionToken,
    getSessionMaxAge,
    isValidAdminPassword,
} from "@/lib/admin-auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
    const contentType = request.headers.get("content-type") ?? "";
    let password = "";

    if (contentType.includes("application/json")) {
        const body = await request.json();
        password = String(body?.password ?? "");
    } else {
        const formData = await request.formData();
        password = String(formData.get("password") ?? "");
    }

    try {
        if (!password || !isValidAdminPassword(password)) {
            return new Response(
                JSON.stringify({ ok: false, message: "帳號或密碼不正確。" }),
                { status: 401, headers: { "content-type": "application/json" } },
            );
        }
    } catch (error) {
        return new Response(
            JSON.stringify({
                ok: false,
                message:
                    error instanceof Error ? error.message : "登入設定錯誤，請檢查環境變數。",
            }),
            { status: 500, headers: { "content-type": "application/json" } },
        );
    }

    cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "strict",
        path: "/",
        maxAge: getSessionMaxAge(),
    });

    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
    });
};
