import { defineMiddleware } from 'astro:middleware';
import { verifyToken } from './lib/auth';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;

  const isLoginPage = pathname === '/admin' || pathname === '/admin/';
  const isLoginApi = pathname === '/api/admin/login';
  const isAdminArea = pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/');

  if (!isAdminArea || isLoginApi) return next();

  const token = ctx.cookies.get('admin_token')?.value;

  if (!token) {
    return isLoginPage
      ? next()
      : pathname.startsWith('/api/')
        ? new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
        : ctx.redirect('/admin');
  }

  try {
    await verifyToken(token);
    return next();
  } catch {
    ctx.cookies.delete('admin_token', { path: '/' });
    return pathname.startsWith('/api/')
      ? new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      : ctx.redirect('/admin');
  }
});
