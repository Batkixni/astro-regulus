import type { APIRoute } from 'astro';
import { signToken } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  let password: string;
  try {
    ({ password } = await request.json());
  } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }

  if (!password || password !== import.meta.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Invalid password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = await signToken();
  const isProd = import.meta.env.PROD;
  const cookie = [
    `admin_token=${token}`,
    'Path=/',
    `Max-Age=${60 * 60 * 24 * 7}`,
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : '',
  ].filter(Boolean).join('; ');

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  });
};
