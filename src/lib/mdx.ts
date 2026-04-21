export interface WorkFrontmatter {
  title: string;
  client: string;
  role: string[];
  date: string;
  genre: string;
  thumbnail: string;
  videoUrl?: string;
  description: string;
  credits?: { name: string; role: string }[];
}

export function composeMdx(fm: WorkFrontmatter, body: string): string {
  const lines = [
    '---',
    `title: "${fm.title}"`,
    `client: "${fm.client}"`,
    `role: [${fm.role.map(r => `"${r}"`).join(', ')}]`,
    `date: ${fm.date}`,
    `genre: "${fm.genre}"`,
    `thumbnail: "${fm.thumbnail}"`,
  ];
  if (fm.videoUrl) lines.push(`videoUrl: "${fm.videoUrl}"`);
  lines.push(`description: "${fm.description}"`);
  if (fm.credits?.length) {
    lines.push('credits:');
    for (const c of fm.credits) {
      lines.push(`  - name: "${c.name}"`);
      lines.push(`    role: "${c.role}"`);
    }
  }
  lines.push('---', '', body.trim(), '');
  return lines.join('\n');
}

export function decodeGithubContent(b64: string): string {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))));
}

export function parseMdx(content: string): { fm: WorkFrontmatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { fm: {} as WorkFrontmatter, body: content };

  const yaml = match[1];
  const body = match[2].trim();
  const fm: Partial<WorkFrontmatter> = {};
  const lines = yaml.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const col = line.indexOf(':');
    if (col === -1) { i++; continue; }
    const key = line.slice(0, col).trim();
    const rawVal = line.slice(col + 1).trim();
    const val = rawVal.replace(/^["']|["']$/g, '');

    switch (key) {
      case 'title': fm.title = val; break;
      case 'client': fm.client = val; break;
      case 'genre': fm.genre = val; break;
      case 'thumbnail': fm.thumbnail = val; break;
      case 'videoUrl': fm.videoUrl = val; break;
      case 'description': fm.description = val; break;
      case 'date': fm.date = val; break;
      case 'role': {
        const m = rawVal.match(/\[(.+)\]/);
        if (m) fm.role = m[1].split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        break;
      }
      case 'credits': {
        const credits: { name: string; role: string }[] = [];
        i++;
        while (i < lines.length && (lines[i].startsWith('  ') || lines[i].startsWith('\t'))) {
          const cl = lines[i].trim();
          if (cl.startsWith('- name:')) {
            const name = cl.slice(7).trim().replace(/^["']|["']$/g, '');
            let role = '';
            if (i + 1 < lines.length && lines[i + 1].trim().startsWith('role:')) {
              role = lines[++i].trim().slice(5).trim().replace(/^["']|["']$/g, '');
            }
            credits.push({ name, role });
          }
          i++;
        }
        fm.credits = credits;
        continue;
      }
    }
    i++;
  }

  return { fm: fm as WorkFrontmatter, body };
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
