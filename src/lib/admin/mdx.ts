import yaml from "js-yaml";
import slugify from "slugify";
import type { DraftRecord } from "@/lib/admin/db";

export const genreToSegment = (genre: string) =>
  slugify(genre || "motion", { lower: true, strict: true });

const normalizeCredits = (credits: DraftRecord["credits"]) => {
  if (!credits || credits.length === 0) return undefined;
  return credits
    .filter((credit) => credit.name.trim() && credit.role.trim())
    .map((credit) => ({ name: credit.name.trim(), role: credit.role.trim() }));
};

export const validateDraftForPublish = (draft: DraftRecord): string[] => {
  const errors: string[] = [];

  if (!draft.slug.trim()) errors.push("slug is required");
  if (!draft.title.trim()) errors.push("title is required");
  if (!draft.client.trim()) errors.push("client is required");
  if (draft.role.length === 0) errors.push("at least one role is required");
  if (!draft.date.trim()) errors.push("date is required");
  if (!draft.genre.trim()) errors.push("genre is required");
  if (!draft.thumbnail.trim()) errors.push("thumbnail is required");
  if (!draft.description.trim()) errors.push("description is required");

  return errors;
};

export const buildMdxFromDraft = (draft: DraftRecord): { path: string; content: string } => {
  const frontmatter = {
    title: draft.title,
    client: draft.client,
    role: draft.role,
    date: draft.date,
    genre: draft.genre,
    thumbnail: draft.thumbnail,
    videoUrl: draft.videoUrl || undefined,
    description: draft.description,
    credits: normalizeCredits(draft.credits),
  };

  const yamlBlock = yaml.dump(frontmatter, {
    lineWidth: -1,
    noRefs: true,
    forceQuotes: false,
    skipInvalid: true,
  });

  const body = [draft.markdown.trim(), draft.rawMdx.trim()]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  const mdx = `---\n${yamlBlock}---\n\n${body}\n`;
  const path = `src/content/work/${genreToSegment(draft.genre)}/${draft.slug}.mdx`;

  return { path, content: mdx };
};
