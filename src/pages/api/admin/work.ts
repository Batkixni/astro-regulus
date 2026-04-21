import fs from "node:fs/promises";
import path from "node:path";
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
};

export const prerender = false;

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

export const POST: APIRoute = async ({ request, cookies }) => {
    if (!isAdminAuthenticated(cookies)) {
        return new Response(JSON.stringify({ ok: false, message: "未授權。" }), {
            status: 401,
            headers: { "content-type": "application/json" },
        });
    }

    let input: Partial<WorkInput> = {};
    try {
        input = (await request.json()) as Partial<WorkInput>;
    } catch {
        return new Response(JSON.stringify({ ok: false, message: "資料格式錯誤。" }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }

    const validated = validateInput(input);
    if (!validated.ok) {
        return new Response(JSON.stringify(validated), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }

    const requestedSlug = validated.data.slug || toSlug(validated.data.title);
    const { slug, filePath, genreSlug } = await ensureUniqueWorkFilePath(
        validated.data.genre,
        requestedSlug,
    );

    const content = `${buildFrontmatter(validated.data)}${validated.data.body}\n`;
    await fs.writeFile(filePath, content, "utf-8");

    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
    return new Response(
        JSON.stringify({
            ok: true,
            slug: `${genreSlug}/${slug}`,
            filePath: relativePath,
            message:
                "作品已建立。若你是正式環境部署，通常需要重新 build 才會出現在前台。",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
    );
};
