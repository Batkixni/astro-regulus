import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function AdminLoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/admin",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={onLogin}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground px-4 py-3 font-semibold tracking-wide disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in with GitHub"}
      </button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
