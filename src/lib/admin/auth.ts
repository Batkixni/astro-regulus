import { auth } from "@/lib/server/auth";
import { env } from "@/lib/server/env";
import { insertAuditLog } from "@/lib/admin/db";

export type AdminSession = {
  user: {
    id: string;
    email?: string;
    name?: string;
    image?: string;
  };
  session: {
    id: string;
  };
};

const normalize = (value?: string | null) =>
  value ? value.trim().toLowerCase() : "";

const isAllowedIdentity = (session: AdminSession) => {
  if (env.adminAllowlist.length === 0) return true;

  const candidates = [
    normalize(session.user.email),
    normalize(session.user.name),
    normalize((session.user as Record<string, unknown>).username as string),
  ].filter(Boolean);

  return candidates.some((value) => env.adminAllowlist.includes(value));
};

export const getAdminSession = async (
  request: Request,
): Promise<AdminSession | null> => {
  const session = (await auth.api.getSession({
    headers: request.headers,
  })) as AdminSession | null;

  if (!session?.user) return null;
  if (!isAllowedIdentity(session)) return null;

  return session;
};

export const requireAdminSession = async (request: Request) => {
  const session = await getAdminSession(request);
  if (!session) return null;

  insertAuditLog({
    action: "admin.access",
    actor: session.user.email || session.user.name,
    detail: { sessionId: session.session.id },
  });

  return session;
};
