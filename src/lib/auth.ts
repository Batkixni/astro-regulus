import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  import.meta.env.JWT_SECRET || "default-secret-change-me"
);

export async function createToken() {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET, { clockTolerance: 60 });
    return payload.admin === true;
  } catch {
    return false;
  }
}

export function getAuthCookie(cookies: { get: (name: string) => { value: string } | undefined }) {
  const cookie = cookies.get("admin_token");
  return cookie?.value;
}

export async function isAuthenticated(cookies: { get: (name: string) => { value: string } | undefined }) {
  const token = getAuthCookie(cookies);
  if (!token) return false;
  return verifyToken(token);
}

export function requireAuth() {
  return async (context: { cookies: { get: (name: string) => { value: string } | undefined }; redirect: (url: string) => any }) => {
    const ok = await isAuthenticated(context.cookies);
    if (!ok) {
      return context.redirect("/admin/login");
    }
  };
}
