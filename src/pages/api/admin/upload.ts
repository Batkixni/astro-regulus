import fs from "node:fs/promises";
import path from "node:path";
import type { APIRoute } from "astro";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const prerender = false;

const sanitizeFilename = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^\w.-]/g, "-")
        .replace(/-+/g, "-");

export const POST: APIRoute = async ({ request, cookies }) => {
    if (!isAdminAuthenticated(cookies)) {
        return new Response(JSON.stringify({ ok: false, message: "未授權。" }), {
            status: 401,
            headers: { "content-type": "application/json" },
        });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return new Response(JSON.stringify({ ok: false, message: "請選擇檔案。" }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }

    const allowedPrefix = ["image/", "video/"];
    if (!allowedPrefix.some((prefix) => file.type.startsWith(prefix))) {
        return new Response(
            JSON.stringify({ ok: false, message: "只允許圖片或影片格式。" }),
            { status: 400, headers: { "content-type": "application/json" } },
        );
    }

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const targetDir = path.join(process.cwd(), "public", "uploads", "work", year, month);
    await fs.mkdir(targetDir, { recursive: true });

    const ext = path.extname(file.name) || "";
    const basename = path.basename(file.name, ext);
    const filename = `${Date.now()}-${sanitizeFilename(basename)}${ext.toLowerCase()}`;
    const targetPath = path.join(targetDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(targetPath, buffer);

    const publicUrl = `/uploads/work/${year}/${month}/${filename}`;
    return new Response(JSON.stringify({ ok: true, url: publicUrl }), {
        status: 200,
        headers: { "content-type": "application/json" },
    });
};
