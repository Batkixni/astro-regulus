const BASE = 'https://api.github.com';

function cfg() {
  return {
    owner: import.meta.env.GITHUB_OWNER,
    repo: import.meta.env.GITHUB_REPO,
    branch: import.meta.env.GITHUB_BRANCH ?? 'main',
    headers: {
      Authorization: `Bearer ${import.meta.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    } as HeadersInit,
  };
}

export interface GithubFile {
  name: string;
  path: string;
  sha: string;
  type: string;
  content: string;
}

export async function getFile(path: string): Promise<GithubFile | null> {
  const { owner, repo, branch, headers } = cfg();
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, { headers });
  if (!res.ok) return null;
  return res.json();
}

export async function upsertFile(path: string, content: string, message: string, sha?: string) {
  const { owner, repo, branch, headers } = cfg();
  const encoded = btoa(unescape(encodeURIComponent(content)));
  const body: Record<string, unknown> = { message, content: encoded, branch };
  if (sha) body.sha = sha;
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub: ${await res.text()}`);
  return res.json();
}

export async function removeFile(path: string, sha: string, message: string) {
  const { owner, repo, branch, headers } = cfg();
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ message, sha, branch }),
  });
  if (!res.ok) throw new Error(`GitHub: ${await res.text()}`);
  return res.json();
}

export async function listDirectory(dirPath: string): Promise<GithubFile[]> {
  const { owner, repo, branch, headers } = cfg();
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
