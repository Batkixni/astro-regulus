import { SignJWT, jwtVerify } from 'jose';

const getSecret = () => new TextEncoder().encode(import.meta.env.JWT_SECRET);

export async function signToken() {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  return jwtVerify(token, getSecret());
}
