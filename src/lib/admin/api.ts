import { getAdminSession } from "@/lib/admin/auth";

export const json = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    status: init?.status || 200,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

export const getClientIp = (request: Request) =>
  request.headers.get("x-forwarded-for") ||
  request.headers.get("cf-connecting-ip") ||
  undefined;

export const requireAdminApiSession = async (request: Request) => {
  const session = await getAdminSession(request);
  if (!session) {
    return { session: null, response: json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { session, response: null };
};
