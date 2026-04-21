import crypto from "node:crypto";
import type { AstroCookies } from "astro";

export const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
    role: "admin";
    exp: number;
    iat: number;
    nonce: string;
};

const base64UrlEncode = (value: string) =>
    Buffer.from(value).toString("base64url");

const base64UrlDecode = (value: string) =>
    Buffer.from(value, "base64url").toString("utf-8");

const safeCompare = (a: string, b: string) => {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);
    if (aBuffer.length !== bBuffer.length) return false;
    return crypto.timingSafeEqual(aBuffer, bBuffer);
};

const getSessionSecret = () => {
    const secret =
        import.meta.env.ADMIN_SESSION_SECRET || import.meta.env.JWT_SECRET;
    if (!secret) {
        throw new Error(
            "Missing ADMIN_SESSION_SECRET (or JWT_SECRET) in environment variables.",
        );
    }
    return secret;
};

const sign = (value: string) =>
    crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");

export const createAdminSessionToken = () => {
    const header = { alg: "HS256", typ: "JWT" };
    const iat = Math.floor(Date.now() / 1000);
    const payload: SessionPayload = {
        role: "admin",
        iat,
        exp: iat + SESSION_TTL_SECONDS,
        nonce: crypto.randomUUID(),
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = sign(`${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const isValidAdminPassword = (password: string) => {
    const expectedPassword = import.meta.env.ADMIN_PASSWORD;
    if (!expectedPassword) {
        throw new Error("Missing ADMIN_PASSWORD in environment variables.");
    }
    return safeCompare(password, expectedPassword);
};

export const verifyAdminSessionToken = (token?: string | null) => {
    if (!token) return false;

    const [encodedHeader, encodedPayload, signature] = token.split(".");
    if (!encodedHeader || !encodedPayload || !signature) return false;

    const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`);
    if (!safeCompare(expectedSignature, signature)) return false;

    try {
        const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
        const now = Math.floor(Date.now() / 1000);
        return payload.role === "admin" && payload.exp > now;
    } catch {
        return false;
    }
};

export const isAdminAuthenticated = (cookies: AstroCookies) => {
    const token = cookies.get(ADMIN_COOKIE_NAME)?.value;
    return verifyAdminSessionToken(token);
};

export const getSessionMaxAge = () => SESSION_TTL_SECONDS;
