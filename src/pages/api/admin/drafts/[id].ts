import type { APIRoute } from "astro";
import { getDraftById, getDraftBySlug, updateDraft } from "@/lib/admin/db";
import { json, requireAdminApiSession } from "@/lib/admin/api";

export const prerender = false;

export const PUT: APIRoute = async ({ request, params }) => {
  const { response } = await requireAdminApiSession(request);
  if (response) return response;

  const draftId = params.id;
  if (!draftId) return json({ error: "Draft id is required" }, { status: 400 });

  const current = getDraftById(draftId);
  if (!current) return json({ error: "Draft not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  const nextSlug = typeof payload.slug === "string" ? payload.slug.trim() : current.slug;
  if (nextSlug) {
    const existed = getDraftBySlug(nextSlug);
    if (existed && existed.id !== current.id) {
      return json({ error: "Slug already exists" }, { status: 409 });
    }
  }

  const updated = updateDraft(draftId, {
    slug: nextSlug,
    title: typeof payload.title === "string" ? payload.title : current.title,
    client: typeof payload.client === "string" ? payload.client : current.client,
    role: Array.isArray(payload.role)
      ? payload.role.filter((value): value is string => typeof value === "string")
      : current.role,
    date: typeof payload.date === "string" ? payload.date : current.date,
    genre: typeof payload.genre === "string" ? payload.genre : current.genre,
    thumbnail: typeof payload.thumbnail === "string" ? payload.thumbnail : current.thumbnail,
    videoUrl:
      typeof payload.videoUrl === "string"
        ? payload.videoUrl
        : payload.videoUrl === null
          ? undefined
          : current.videoUrl,
    description: typeof payload.description === "string" ? payload.description : current.description,
    credits: Array.isArray(payload.credits)
      ? payload.credits
          .filter((item): item is { name: string; role: string } => {
            if (!item || typeof item !== "object") return false;
            const entry = item as Record<string, unknown>;
            return typeof entry.name === "string" && typeof entry.role === "string";
          })
          .map((item) => ({ name: item.name, role: item.role }))
      : current.credits,
    markdown: typeof payload.markdown === "string" ? payload.markdown : current.markdown,
    rawMdx: typeof payload.rawMdx === "string" ? payload.rawMdx : current.rawMdx,
    status: payload.status === "published" ? "published" : "draft",
  });

  if (!updated) {
    return json({ error: "Failed to update draft" }, { status: 500 });
  }

  return json({ draft: updated });
};
