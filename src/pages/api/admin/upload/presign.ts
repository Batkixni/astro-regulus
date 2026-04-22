import type { APIRoute } from "astro";
import { json, getClientIp, requireAdminApiSession } from "@/lib/admin/api";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_SIZE,
  createImagePresign,
} from "@/lib/admin/s3";
import { insertAuditLog } from "@/lib/admin/db";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { session, response } = await requireAdminApiSession(request);
  if (response) return response;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const slug = typeof payload.slug === "string" ? payload.slug : "untitled";
  const filename = typeof payload.filename === "string" ? payload.filename : "image.jpg";
  const contentType = typeof payload.contentType === "string" ? payload.contentType : "";
  const size = typeof payload.size === "number" ? payload.size : 0;

  if (!ALLOWED_MIME_TYPES.includes(contentType as (typeof ALLOWED_MIME_TYPES)[number])) {
    return json({ error: "Unsupported file type" }, { status: 415 });
  }

  if (size <= 0 || size > MAX_UPLOAD_SIZE) {
    return json({ error: "Invalid file size" }, { status: 400 });
  }

  try {
    const result = await createImagePresign({
      slug,
      filename,
      contentType,
      size,
    });

    insertAuditLog({
      action: "upload.presign",
      actor: session?.user.email || session?.user.name,
      ip: getClientIp(request),
      detail: {
        slug,
        filename,
        key: result.key,
        contentType,
        size,
      },
    });

    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create upload URL";
    return json({ error: message }, { status: 500 });
  }
};
