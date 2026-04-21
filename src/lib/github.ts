const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;
const GITHUB_OWNER = import.meta.env.GITHUB_OWNER;
const GITHUB_REPO = import.meta.env.GITHUB_REPO;
const GITHUB_BRANCH = import.meta.env.GITHUB_BRANCH || "main";

export async function commitFileToGitHub(
  path: string,
  content: string,
  message: string
) {
  const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  // Get current file SHA if it exists
  let sha: string | undefined;
  try {
    const res = await fetch(`${apiBase}/contents/${path}?ref=${GITHUB_BRANCH}`, { headers });
    if (res.status === 200) {
      const data = await res.json();
      sha = data.sha;
    }
  } catch {
    // File doesn't exist yet
  }

  const body = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch: GITHUB_BRANCH,
    ...(sha ? { sha } : {}),
  };

  const res = await fetch(`${apiBase}/contents/${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${err}`);
  }

  return res.json();
}
