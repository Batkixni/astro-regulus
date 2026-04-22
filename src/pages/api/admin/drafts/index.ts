import type { APIRoute } from "astro";
import { createDraft, listDrafts } from "@/lib/admin/db";
import { json, requireAdminApiSession } from "@/lib/admin/api";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const { response } = await requireAdminApiSession(request);
  if (response) return response;

  return json({ drafts: listDrafts() });
};

export const POST: APIRoute = async ({ request }) => {
  const { session, response } = await requireAdminApiSession(request);
  if (response) return response;

  const body = await request.json().catch(() => ({}));
  const draft = createDraft({
    title: typeof body.title === "string" ? body.title : "",
    slug: typeof body.slug === "string" ? body.slug : "",
    client: typeof body.client === "string" ? body.client : "",
    genre: typeof body.genre === "string" ? body.genre : "Motion",
  });

  return json({ draft, actor: session?.user.email || session?.user.name });
};
