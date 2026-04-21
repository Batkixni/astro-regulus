import type { APIRoute } from "astro";
import { isAuthenticated } from "@/lib/auth";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const ok = await isAuthenticated(cookies);
  return new Response(JSON.stringify({ authenticated: ok }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
