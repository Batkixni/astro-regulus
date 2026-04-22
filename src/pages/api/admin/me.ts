import type { APIRoute } from "astro";
import { json, requireAdminApiSession } from "@/lib/admin/api";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const { session, response } = await requireAdminApiSession(request);
  if (response) return response;

  return json({ user: session?.user });
};
