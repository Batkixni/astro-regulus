import type { APIRoute } from 'astro';

export const POST: APIRoute = () => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'admin_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
    },
  });
};
