import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const WORK_ROOT = path.join(process.cwd(), "src", "content", "work");

export type AdminWorkSummary = {
    slug: string;
    filePath: string;
    title: string;
    client: string;
    genre: string;
    date: string;
    thumbnail: string;
};

export const toSlug = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

const walkDir = async (dir: string): Promise<string[]> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async (entry) => {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) return walkDir(fullPath);
            if (entry.isFile() && fullPath.endsWith(".mdx")) return [fullPath];
            return [];
        }),
    );
    return files.flat();
};

export const listExistingWorks = async (): Promise<AdminWorkSummary[]> => {
    try {
        await fs.access(WORK_ROOT);
    } catch {
        return [];
    }

    const files = await walkDir(WORK_ROOT);
    const works = await Promise.all(
        files.map(async (filePath) => {
            const raw = await fs.readFile(filePath, "utf-8");
            const parsed = matter(raw);
            const relativePath = path.relative(WORK_ROOT, filePath).replace(/\\/g, "/");
            const slug = relativePath.replace(/\.mdx$/, "");
            return {
                slug,
                filePath: relativePath,
                title: String(parsed.data.title ?? slug),
                client: String(parsed.data.client ?? ""),
                genre: String(parsed.data.genre ?? "Motion"),
                date: String(parsed.data.date ?? ""),
                thumbnail: String(parsed.data.thumbnail ?? ""),
            } satisfies AdminWorkSummary;
        }),
    );

    return works.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const ensureUniqueWorkFilePath = async (genre: string, requestedSlug: string) => {
    const genreSlug = toSlug(genre) || "uncategorized";
    const baseSlug = toSlug(requestedSlug) || `work-${Date.now()}`;
    const targetDir = path.join(WORK_ROOT, genreSlug);
    await fs.mkdir(targetDir, { recursive: true });

    let slug = baseSlug;
    let index = 1;
    let filePath = path.join(targetDir, `${slug}.mdx`);

    while (true) {
        try {
            await fs.access(filePath);
            index += 1;
            slug = `${baseSlug}-${index}`;
            filePath = path.join(targetDir, `${slug}.mdx`);
        } catch {
            break;
        }
    }

    return { genreSlug, slug, filePath };
};
