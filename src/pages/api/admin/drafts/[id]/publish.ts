import type { APIRoute } from "astro";
import {
  getDraftById,
  getDraftBySlug,
  insertAuditLog,
  insertPublishLog,
  markDraftPublished,
} from "@/lib/admin/db";
import { json, getClientIp, requireAdminApiSession } from "@/lib/admin/api";
import { buildMdxFromDraft, validateDraftForPublish } from "@/lib/admin/mdx";
import { upsertRepositoryFile } from "@/lib/admin/github";

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
  const { session, response } = await requireAdminApiSession(request);
  if (response) return response;

  const draftId = params.id;
  if (!draftId) return json({ error: "Draft id is required" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const branch =
    body && typeof body === "object" && typeof (body as Record<string, unknown>).branch === "string"
      ? String((body as Record<string, unknown>).branch).trim()
      : "";

  if (!branch) return json({ error: "Branch is required" }, { status: 400 });

  const draft = getDraftById(draftId);
  if (!draft) return json({ error: "Draft not found" }, { status: 404 });

  if (draft.slug) {
    const collision = getDraftBySlug(draft.slug);
    if (collision && collision.id !== draft.id) {
      return json({ error: "Slug already exists" }, { status: 409 });
    }
  }

  const validationErrors = validateDraftForPublish(draft);
  if (validationErrors.length > 0) {
    return json({ error: "Validation failed", details: validationErrors }, { status: 422 });
  }

  const { path, content } = buildMdxFromDraft(draft);

  try {
    const result = await upsertRepositoryFile({
      path,
      content,
      branch,
      message: `chore(cms): publish work ${draft.slug}`,
    });

    markDraftPublished(draft.id, branch, result.commitSha);
    insertPublishLog({
      draftId: draft.id,
      slug: draft.slug,
      branch,
      commitSha: result.commitSha,
      actor: session?.user.email || session?.user.name,
      result: "success",
      message: "Published successfully",
    });

    insertAuditLog({
      action: "publish.success",
      actor: session?.user.email || session?.user.name,
      ip: getClientIp(request),
      detail: {
        draftId: draft.id,
        slug: draft.slug,
        branch,
        commitSha: result.commitSha,
        path,
      },
    });

    return json({
      ok: true,
      commitSha: result.commitSha,
      commitUrl: result.htmlUrl,
      path,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown publish error";
    insertPublishLog({
      draftId: draft.id,
      slug: draft.slug,
      branch,
      commitSha: "-",
      actor: session?.user.email || session?.user.name,
      result: "failed",
      message,
    });

    insertAuditLog({
      action: "publish.failed",
      actor: session?.user.email || session?.user.name,
      ip: getClientIp(request),
      detail: {
        draftId: draft.id,
        slug: draft.slug,
        branch,
        message,
      },
    });

    return json({ error: message }, { status: 500 });
  }
};
