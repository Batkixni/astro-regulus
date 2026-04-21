import type { APIRoute } from 'astro';
import { getFile, upsertFile, removeFile } from '../../../../lib/github';
import { composeMdx, decodeGithubContent, parseMdx, slugify } from '../../../../lib/mdx';

// GET /api/admin/works/[slug] — fetch single work for editing
export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!;
  const path = `src/content/work/${slug}.mdx`;
  const data = await getFile(path);
  if (!data) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  const content = decodeGithubContent(data.content);
  const { fm, body } = parseMdx(content);
  return new Response(JSON.stringify({ slug, sha: data.sha, fm, body }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST /api/admin/works/[slug] — create new (slug = "new")
// PUT /api/admin/works/[slug] — update existing
export const POST: APIRoute = async ({ request }) => {
  const { fm, body, customSlug } = await request.json();
  const genre = fm.genre?.toLowerCase() ?? 'cinematic';
  const slug = customSlug || slugify(fm.title);
  const path = `src/content/work/${genre}/${slug}.mdx`;
  const content = composeMdx(fm, body);
  await upsertFile(path, content, `add: ${fm.title}`);
  return new Response(JSON.stringify({ slug: `${genre}/${slug}` }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;
  const { fm, body, sha } = await request.json();
  const path = `src/content/work/${slug}.mdx`;
  const content = composeMdx(fm, body);
  await upsertFile(path, content, `update: ${fm.title}`, sha);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;
  const { sha } = await request.json();
  const path = `src/content/work/${slug}.mdx`;
  await removeFile(path, sha, `delete: ${slug}`);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
