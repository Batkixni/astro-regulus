import type { APIRoute } from "astro";
import { isAuthenticated } from "@/lib/auth";
import { getWorkBySlug, saveWork, deleteWork, type WorkFrontmatter } from "@/lib/mdx";
import { commitFileToGitHub } from "@/lib/github";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug as string;
  const work = await getWorkBySlug(slug);
  if (!work) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ work }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request, cookies, params }) => {
  const ok = await isAuthenticated(cookies);
  if (!ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const slug = params.slug as string;
    const body = await request.json();
    const { frontmatter, content, commitToGitHub = false } = body;

    const fm = frontmatter as WorkFrontmatter;
    await saveWork(slug, fm, content);

    if (commitToGitHub) {
      try {
        const fileContent = await saveWork(slug, fm, content);
        await commitFileToGitHub(
          `src/content/work/${slug}.mdx`,
          fileContent,
          `Update work: ${fm.title}`
        );
      } catch (gitErr: any) {
        return new Response(
          JSON.stringify({
            error: `Saved locally but GitHub commit failed: ${gitErr.message}`,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(JSON.stringify({ success: true, slug }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ cookies, params }) => {
  const ok = await isAuthenticated(cookies);
  if (!ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const slug = params.slug as string;
    await deleteWork(slug);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
