import type { APIRoute } from "astro";
import { isAuthenticated } from "@/lib/auth";
import { getAllWorks, saveWork, type WorkFrontmatter } from "@/lib/mdx";
import { commitFileToGitHub } from "@/lib/github";

export const prerender = false;

export const GET: APIRoute = async () => {
  const works = await getAllWorks();
  return new Response(JSON.stringify({ works }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const ok = await isAuthenticated(cookies);
  if (!ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { slug, frontmatter, content, commitToGitHub = false } = body;

    if (!slug || !frontmatter || !content) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fm = frontmatter as WorkFrontmatter;
    await saveWork(slug, fm, content);

    if (commitToGitHub) {
      try {
        const fileContent = await saveWork(slug, fm, content);
        await commitFileToGitHub(
          `src/content/work/${slug}.mdx`,
          fileContent,
          `Add/Update work: ${fm.title}`
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
