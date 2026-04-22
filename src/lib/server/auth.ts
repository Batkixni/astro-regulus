import { betterAuth } from "better-auth";
import { DatabaseSync } from "node:sqlite";
import { adminDbPath } from "@/lib/admin/paths";
import { env } from "@/lib/server/env";

const authDb = new DatabaseSync(adminDbPath());

export const auth = betterAuth({
  baseURL: env.authUrl,
  secret: env.authSecret,
  database: authDb,
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    github: {
      clientId: env.githubClientId,
      clientSecret: env.githubClientSecret,
      scope: ["read:user", "user:email"],
    },
  },
  trustedOrigins: [env.authUrl],
});
