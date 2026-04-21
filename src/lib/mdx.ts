import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";

const WORK_DIR = path.resolve("src/content/work");

export interface WorkFrontmatter {
  title: string;
  client: string;
  role: string[];
  date: string;
  genre: string;
  thumbnail: string;
  videoUrl?: string;
  description: string;
  credits?: Array<{ name: string; role: string }>;
}

export interface WorkEntry {
  slug: string;
  genre: string;
  frontmatter: WorkFrontmatter;
  body: string;
}

export async function getAllWorks(): Promise<WorkEntry[]> {
  const works: WorkEntry[] = [];
  const genres = await fs.readdir(WORK_DIR).catch(() => [] as string[]);

  for (const genre of genres) {
    const genrePath = path.join(WORK_DIR, genre);
    const stat = await fs.stat(genrePath).catch(() => null);
    if (!stat?.isDirectory()) continue;

    const files = await fs.readdir(genrePath);
    for (const file of files) {
      if (!file.endsWith(".mdx")) continue;
      const filePath = path.join(genrePath, file);
      const content = await fs.readFile(filePath, "utf-8");
      const parsed = matter(content);
      const slug = `${genre}/${file.replace(/\.mdx$/, "")}`;
      works.push({
        slug,
        genre,
        frontmatter: parsed.data as WorkFrontmatter,
        body: parsed.content,
      });
    }
  }

  return works.sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
  );
}

export async function getWorkBySlug(slug: string): Promise<WorkEntry | null> {
  const parts = slug.split("/");
  const genre = parts[0];
  const name = parts.slice(1).join("/");
  const filePath = path.join(WORK_DIR, genre, `${name}.mdx`);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    const parsed = matter(content);
    return {
      slug,
      genre,
      frontmatter: parsed.data as WorkFrontmatter,
      body: parsed.content,
    };
  } catch {
    return null;
  }
}

export function generateMdxContent(
  frontmatter: WorkFrontmatter,
  body: string
): string {
  const fm = { ...frontmatter };
  const yamlStr = yaml.dump(fm, { lineWidth: -1, noCompatMode: true });
  return `---\n${yamlStr}---\n\n${body.trim()}\n`;
}

export async function saveWork(
  slug: string,
  frontmatter: WorkFrontmatter,
  body: string
) {
  const parts = slug.split("/");
  const genre = parts[0];
  const name = parts.slice(1).join("/");
  const genrePath = path.join(WORK_DIR, genre);

  await fs.mkdir(genrePath, { recursive: true });
  const filePath = path.join(genrePath, `${name}.mdx`);
  const content = generateMdxContent(frontmatter, body);
  await fs.writeFile(filePath, content, "utf-8");
  return content;
}

export async function deleteWork(slug: string) {
  const parts = slug.split("/");
  const genre = parts[0];
  const name = parts.slice(1).join("/");
  const filePath = path.join(WORK_DIR, genre, `${name}.mdx`);
  await fs.unlink(filePath);
}
