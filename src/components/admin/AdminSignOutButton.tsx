export function AdminSignOutButton() {
  const onSignOut = async () => {
    await fetch("/api/auth/sign-out", {
      method: "POST",
    });
    window.location.href = "/admin/login";
  };

  return (
    <button
      onClick={onSignOut}
      className="text-sm px-3 py-2 border border-border hover:bg-muted/50 transition-colors"
    >
      Sign out
    </button>
  );
}
