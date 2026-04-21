import type { APIRoute } from 'astro';
import { listDirectory, getFile } from '../../../../lib/github';
import { decodeGithubContent, parseMdx } from '../../../../lib/mdx';

export const GET: APIRoute = async () => {
  const workDir = 'src/content/work';
  const categories = await listDirectory(workDir);
  const works: unknown[] = [];

  await Promise.all(
    categories
      .filter(c => c.type === 'dir')
      .map(async cat => {
        const files = await listDirectory(cat.path);
        await Promise.all(
          files
            .filter(f => f.name.endsWith('.mdx'))
            .map(async file => {
              const data = await getFile(file.path);
              if (!data) return;
              const content = decodeGithubContent(data.content);
              const { fm } = parseMdx(content);
              const slug = file.path.replace('src/content/work/', '').replace('.mdx', '');
              works.push({ slug, sha: data.sha, path: file.path, ...fm });
            })
        );
      })
  );

  works.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return new Response(JSON.stringify(works), {
    headers: { 'Content-Type': 'application/json' },
  });
};
