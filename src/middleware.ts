import { defineMiddleware } from 'astro:middleware';
import { verifyToken } from './lib/auth';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;

  const needsAuth =
    (pathname.startsWith('/admin') && pathname !== '/admin') ||
    (pathname.startsWith('/api/admin') && pathname !== '/api/admin/login');

  if (!needsAuth) return next();

  const token = ctx.cookies.get('admin_token')?.value;

  if (!token) {
    return pathname.startsWith('/api/')
      ? new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      : ctx.redirect('/admin');
  }

  try {
    await verifyToken(token);
    return next();
  } catch {
    return pathname.startsWith('/api/')
      ? new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      : ctx.redirect('/admin');
  }
});
