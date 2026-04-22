import { Octokit } from "octokit";
import { env } from "@/lib/server/env";

const octokit = new Octokit({
  auth: env.githubToken,
});

export const listBranches = async () => {
  const response = await octokit.request("GET /repos/{owner}/{repo}/branches", {
    owner: env.githubOwner,
    repo: env.githubRepo,
    per_page: 100,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  return response.data.map((branch) => branch.name);
};

export const upsertRepositoryFile = async (input: {
  path: string;
  content: string;
  branch: string;
  message: string;
}) => {
  let sha: string | undefined;

  try {
    const existing = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner: env.githubOwner,
        repo: env.githubRepo,
        path: input.path,
        ref: input.branch,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!Array.isArray(existing.data)) {
      sha = existing.data.sha;
    }
  } catch (error) {
    const maybeStatus = (error as { status?: number }).status;
    if (maybeStatus !== 404) {
      throw error;
    }
  }

  const result = await octokit.request(
    "PUT /repos/{owner}/{repo}/contents/{path}",
    {
      owner: env.githubOwner,
      repo: env.githubRepo,
      path: input.path,
      message: input.message,
      content: Buffer.from(input.content, "utf8").toString("base64"),
      branch: input.branch,
      sha,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  return {
    commitSha: result.data.commit.sha,
    htmlUrl: result.data.commit.html_url,
  };
};
