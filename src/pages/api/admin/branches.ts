import type { APIRoute } from "astro";
import { json, requireAdminApiSession } from "@/lib/admin/api";
import { listBranches } from "@/lib/admin/github";
import { env } from "@/lib/server/env";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const { response } = await requireAdminApiSession(request);
  if (response) return response;

  try {
    const branches = await listBranches();
    return json({ branches, defaultBranch: env.githubDefaultBranch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list branches";
    return json({ error: message }, { status: 500 });
  }
};
