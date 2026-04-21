import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { APIRoute } from "astro";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { ensureUniqueWorkFilePath, toSlug } from "@/lib/admin-work";

type Credit = {
    name: string;
    role: string;
};

type WorkInput = {
    title: string;
    client: string;
    role: string[];
    date: string;
    genre: string;
    thumbnail: string;
    videoUrl?: string;
    description: string;
    credits?: Credit[];
    body: string;
    slug?: string;
    targetSlug?: string;
};

export const prerender = false;

const WORK_ROOT = path.resolve(process.cwd(), "src", "content", "work");

const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
        status,
        headers: { "content-type": "application/json" },
    });

const yamlQuote = (value: string) => JSON.stringify(value ?? "");

const buildFrontmatter = (input: WorkInput) => {
    const lines: string[] = [
        "---",
        `title: ${yamlQuote(input.title)}`,
        `client: ${yamlQuote(input.client)}`,
        "role:",
        ...input.role.map((item) => `  - ${yamlQuote(item)}`),
        `date: ${yamlQuote(input.date)}`,
        `genre: ${yamlQuote(input.genre || "Motion")}`,
        `thumbnail: ${yamlQuote(input.thumbnail)}`,
    ];

    if (input.videoUrl) {
        lines.push(`videoUrl: ${yamlQuote(input.videoUrl)}`);
    }

    lines.push(`description: ${yamlQuote(input.description)}`);

    if (input.credits && input.credits.length > 0) {
        lines.push("credits:");
        for (const credit of input.credits) {
            lines.push(`  - name: ${yamlQuote(credit.name)}`);
            lines.push(`    role: ${yamlQuote(credit.role)}`);
        }
    }

    lines.push("---", "");
    return lines.join("\n");
};

const validateInput = (input: Partial<WorkInput>) => {
    const role = Array.isArray(input.role)
        ? input.role.map((item) => String(item).trim()).filter(Boolean)
        : [];

    const credits = Array.isArray(input.credits)
        ? input.credits
              .map((credit) => ({
                  name: String(credit?.name ?? "").trim(),
                  role: String(credit?.role ?? "").trim(),
              }))
              .filter((credit) => credit.name && credit.role)
        : [];

    const validated: WorkInput = {
        title: String(input.title ?? "").trim(),
        client: String(input.client ?? "").trim(),
        role,
        date: String(input.date ?? "").trim(),
        genre: String(input.genre ?? "Motion").trim() || "Motion",
        thumbnail: String(input.thumbnail ?? "").trim(),
        videoUrl: String(input.videoUrl ?? "").trim() || undefined,
        description: String(input.description ?? "").trim(),
        body: String(input.body ?? "").trim(),
        credits,
        slug: String(input.slug ?? "").trim() || undefined,
        targetSlug: String(input.targetSlug ?? "").trim() || undefined,
    };

    if (!validated.title) return { ok: false, message: "請輸入作品標題。" } as const;
    if (!validated.client) return { ok: false, message: "請輸入客戶名稱。" } as const;
    if (!validated.date) return { ok: false, message: "請選擇日期。" } as const;
    if (!validated.thumbnail)
        return { ok: false, message: "請先上傳縮圖並填入連結。" } as const;
    if (!validated.description)
        return { ok: false, message: "請輸入作品描述。" } as const;
    if (!validated.body) return { ok: false, message: "請輸入內容。" } as const;
    if (validated.role.length === 0)
        return { ok: false, message: "至少要有一個角色欄位。" } as const;

    return { ok: true, data: validated } as const;
};

const normalizeSlug = (slug: string) => slug.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");

const resolveWorkPath = (slug: string) => {
    const normalized = normalizeSlug(slug);
    if (!normalized || normalized.includes("..")) return null;

    const filePath = path.resolve(WORK_ROOT, `${normalized}.mdx`);
    const relative = path.relative(WORK_ROOT, filePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
    return filePath;
};

const parseStringArray = (value: unknown) =>
    Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];

const parseCredits = (value: unknown): Credit[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => ({
            name: String((item as { name?: unknown })?.name ?? "").trim(),
            role: String((item as { role?: unknown })?.role ?? "").trim(),
        }))
        .filter((item) => item.name && item.role);
};

export const GET: APIRoute = async ({ url, cookies }) => {
    if (!isAdminAuthenticated(cookies)) {
        return json({ ok: false, message: "未授權。" }, 401);
    }

    const slug = url.searchParams.get("slug") ?? "";
    const filePath = resolveWorkPath(slug);
    if (!filePath) {
        return json({ ok: false, message: "文件路徑不合法。" }, 400);
    }

    try {
        const raw = await fs.readFile(filePath, "utf-8");
        const parsed = matter(raw);

        return json({
            ok: true,
            work: {
                slug: normalizeSlug(slug),
                title: String(parsed.data.title ?? ""),
                client: String(parsed.data.client ?? ""),
                role: parseStringArray(parsed.data.role),
                date: String(parsed.data.date ?? ""),
                genre: String(parsed.data.genre ?? "Motion"),
                thumbnail: String(parsed.data.thumbnail ?? ""),
                videoUrl: String(parsed.data.videoUrl ?? ""),
                description: String(parsed.data.description ?? ""),
                credits: parseCredits(parsed.data.credits),
                body: parsed.content.trimStart(),
            },
        });
    } catch {
        return json({ ok: false, message: "找不到該文件。" }, 404);
    }
};

export const POST: APIRoute = async ({ request, cookies }) => {
    if (!isAdminAuthenticated(cookies)) {
        return json({ ok: false, message: "未授權。" }, 401);
    }

    let input: Partial<WorkInput> = {};
    try {
        input = (await request.json()) as Partial<WorkInput>;
    } catch {
        return json({ ok: false, message: "資料格式錯誤。" }, 400);
    }

    const validated = validateInput(input);
    if (!validated.ok) {
        return json(validated, 400);
    }

    const requestedSlug = validated.data.slug || toSlug(validated.data.title);
    const { slug, filePath, genreSlug } = await ensureUniqueWorkFilePath(
        validated.data.genre,
        requestedSlug,
    );

    const content = `${buildFrontmatter(validated.data)}${validated.data.body}\n`;
    await fs.writeFile(filePath, content, "utf-8");

    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
    return json({
        ok: true,
        slug: `${genreSlug}/${slug}`,
        filePath: relativePath,
        message: "作品已建立。",
    });
};

export const PUT: APIRoute = async ({ request, cookies }) => {
    if (!isAdminAuthenticated(cookies)) {
        return json({ ok: false, message: "未授權。" }, 401);
    }

    let input: Partial<WorkInput> = {};
    try {
        input = (await request.json()) as Partial<WorkInput>;
    } catch {
        return json({ ok: false, message: "資料格式錯誤。" }, 400);
    }

    const validated = validateInput(input);
    if (!validated.ok) {
        return json(validated, 400);
    }

    const targetSlug = validated.data.targetSlug;
    if (!targetSlug) {
        return json({ ok: false, message: "缺少要更新的文件。" }, 400);
    }

    const filePath = resolveWorkPath(targetSlug);
    if (!filePath) {
        return json({ ok: false, message: "文件路徑不合法。" }, 400);
    }

    try {
        await fs.access(filePath);
    } catch {
        return json({ ok: false, message: "找不到要更新的文件。" }, 404);
    }

    const content = `${buildFrontmatter(validated.data)}${validated.data.body}\n`;
    await fs.writeFile(filePath, content, "utf-8");

    return json({ ok: true, slug: normalizeSlug(targetSlug), message: "作品已更新。" });
};
