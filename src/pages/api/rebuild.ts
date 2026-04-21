import type { APIRoute } from "astro";
import { isAuthenticated } from "@/lib/auth";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  const ok = await isAuthenticated(cookies);
  if (!ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { stdout, stderr } = await execAsync("bun run build", {
      timeout: 300000,
      cwd: process.cwd(),
    });

    return new Response(
      JSON.stringify({ success: true, output: stdout + stderr }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "Build failed",
        output: err.stdout + err.stderr,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
