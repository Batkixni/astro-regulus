import Database from "better-sqlite3";
import { adminDbPath } from "@/lib/admin/paths";

export type Credit = {
  name: string;
  role: string;
};

export type DraftStatus = "draft" | "published";

export type DraftRecord = {
  id: string;
  slug: string;
  title: string;
  client: string;
  role: string[];
  date: string;
  genre: string;
  thumbnail: string;
  videoUrl?: string;
  description: string;
  credits?: Credit[];
  markdown: string;
  rawMdx: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedSha?: string;
  publishedBranch?: string;
};

const db = new Database(adminDbPath());

const parseJSON = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const nowIso = () => new Date().toISOString();

const emptyDraft = (): DraftRecord => {
  const timestamp = nowIso();
  return {
    id: crypto.randomUUID(),
    slug: "",
    title: "",
    client: "",
    role: [],
    date: new Date().toISOString().slice(0, 10),
    genre: "Motion",
    thumbnail: "",
    description: "",
    markdown: "",
    rawMdx: "",
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

const mapDraft = (row: Record<string, unknown>): DraftRecord => ({
  id: String(row.id),
  slug: row.slug ? String(row.slug) : "",
  title: String(row.title || ""),
  client: String(row.client || ""),
  role: parseJSON<string[]>(String(row.role_json || "[]"), []),
  date: String(row.date || new Date().toISOString().slice(0, 10)),
  genre: String(row.genre || "Motion"),
  thumbnail: String(row.thumbnail || ""),
  videoUrl: row.video_url ? String(row.video_url) : undefined,
  description: String(row.description || ""),
  credits: parseJSON<Credit[]>(row.credits_json ? String(row.credits_json) : null, []),
  markdown: String(row.markdown || ""),
  rawMdx: String(row.raw_mdx || ""),
  status: (row.status as DraftStatus) || "draft",
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
  publishedAt: row.published_at ? String(row.published_at) : undefined,
  publishedSha: row.published_sha ? String(row.published_sha) : undefined,
  publishedBranch: row.published_branch ? String(row.published_branch) : undefined,
});

export const initializeAdminDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE,
      title TEXT NOT NULL,
      client TEXT NOT NULL,
      role_json TEXT NOT NULL,
      date TEXT NOT NULL,
      genre TEXT NOT NULL,
      thumbnail TEXT NOT NULL,
      video_url TEXT,
      description TEXT NOT NULL,
      credits_json TEXT,
      markdown TEXT NOT NULL,
      raw_mdx TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      published_at TEXT,
      published_sha TEXT,
      published_branch TEXT
    );

    CREATE TABLE IF NOT EXISTS publish_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draft_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      branch TEXT NOT NULL,
      commit_sha TEXT NOT NULL,
      actor TEXT,
      created_at TEXT NOT NULL,
      result TEXT NOT NULL,
      message TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      actor TEXT,
      ip TEXT,
      detail_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_drafts_updated_at ON drafts(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
  `);
};

initializeAdminDb();

export const listDrafts = (): DraftRecord[] => {
  const rows = db
    .prepare("SELECT * FROM drafts ORDER BY datetime(updated_at) DESC")
    .all() as Record<string, unknown>[];

  if (rows.length === 0) {
    const first = emptyDraft();
    createDraft(first);
    return [first];
  }

  return rows.map(mapDraft);
};

export const getDraftById = (id: string): DraftRecord | null => {
  const row = db.prepare("SELECT * FROM drafts WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;
  return mapDraft(row);
};

export const getDraftBySlug = (slug: string): DraftRecord | null => {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return null;
  const row = db.prepare("SELECT * FROM drafts WHERE slug = ?").get(normalizedSlug) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;
  return mapDraft(row);
};

export const createDraft = (draft?: Partial<DraftRecord>): DraftRecord => {
  const base = {
    ...emptyDraft(),
    ...(draft || {}),
  } as DraftRecord;

  db.prepare(
    `INSERT INTO drafts (
      id, slug, title, client, role_json, date, genre, thumbnail, video_url,
      description, credits_json, markdown, raw_mdx, status, created_at, updated_at
    ) VALUES (
      @id, @slug, @title, @client, @role_json, @date, @genre, @thumbnail, @video_url,
      @description, @credits_json, @markdown, @raw_mdx, @status, @created_at, @updated_at
    )`,
  ).run({
    id: base.id,
    slug: base.slug.trim() || null,
    title: base.title,
    client: base.client,
    role_json: JSON.stringify(base.role || []),
    date: base.date,
    genre: base.genre,
    thumbnail: base.thumbnail,
    video_url: base.videoUrl || null,
    description: base.description,
    credits_json: JSON.stringify(base.credits || []),
    markdown: base.markdown,
    raw_mdx: base.rawMdx,
    status: base.status,
    created_at: base.createdAt,
    updated_at: base.updatedAt,
  });

  return base;
};

export const updateDraft = (
  id: string,
  updates: Partial<Omit<DraftRecord, "id" | "createdAt">>,
): DraftRecord | null => {
  const existing = getDraftById(id);
  if (!existing) return null;

  const merged: DraftRecord = {
    ...existing,
    ...updates,
    updatedAt: nowIso(),
  };

  db.prepare(
    `UPDATE drafts
      SET slug = @slug,
          title = @title,
          client = @client,
          role_json = @role_json,
          date = @date,
          genre = @genre,
          thumbnail = @thumbnail,
          video_url = @video_url,
          description = @description,
          credits_json = @credits_json,
          markdown = @markdown,
          raw_mdx = @raw_mdx,
          status = @status,
          updated_at = @updated_at,
          published_at = @published_at,
          published_sha = @published_sha,
          published_branch = @published_branch
      WHERE id = @id`,
  ).run({
    id: merged.id,
    slug: merged.slug.trim() || null,
    title: merged.title,
    client: merged.client,
    role_json: JSON.stringify(merged.role || []),
    date: merged.date,
    genre: merged.genre,
    thumbnail: merged.thumbnail,
    video_url: merged.videoUrl || null,
    description: merged.description,
    credits_json: JSON.stringify(merged.credits || []),
    markdown: merged.markdown,
    raw_mdx: merged.rawMdx,
    status: merged.status,
    updated_at: merged.updatedAt,
    published_at: merged.publishedAt || null,
    published_sha: merged.publishedSha || null,
    published_branch: merged.publishedBranch || null,
  });

  return merged;
};

export const markDraftPublished = (
  id: string,
  branch: string,
  commitSha: string,
): DraftRecord | null => {
  const now = nowIso();
  return updateDraft(id, {
    status: "published",
    publishedAt: now,
    publishedSha: commitSha,
    publishedBranch: branch,
    updatedAt: now,
  });
};

export const insertPublishLog = (entry: {
  draftId: string;
  slug: string;
  branch: string;
  commitSha: string;
  actor?: string;
  result: "success" | "failed";
  message: string;
}) => {
  db.prepare(
    `INSERT INTO publish_logs (draft_id, slug, branch, commit_sha, actor, created_at, result, message)
     VALUES (@draft_id, @slug, @branch, @commit_sha, @actor, @created_at, @result, @message)`,
  ).run({
    draft_id: entry.draftId,
    slug: entry.slug,
    branch: entry.branch,
    commit_sha: entry.commitSha,
    actor: entry.actor || null,
    created_at: nowIso(),
    result: entry.result,
    message: entry.message,
  });
};

export const insertAuditLog = (entry: {
  action: string;
  actor?: string;
  ip?: string;
  detail?: unknown;
}) => {
  db.prepare(
    `INSERT INTO audit_logs (action, actor, ip, detail_json, created_at)
     VALUES (@action, @actor, @ip, @detail_json, @created_at)`,
  ).run({
    action: entry.action,
    actor: entry.actor || null,
    ip: entry.ip || null,
    detail_json: entry.detail ? JSON.stringify(entry.detail) : null,
    created_at: nowIso(),
  });
};
