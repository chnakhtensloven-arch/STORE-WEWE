import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n-context";
import { getSupabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "دخول الإدارة" }, { name: "robots", content: "noindex" }] }),
  component: LoginPage,
});

type SignInOutcome =
  { ok: true; destination: "/admin" | "/dashboard" } | { ok: false; error: string };

/**
 * Sign in, then settle what the account actually is.
 *
 * Resolve administrators before vendors because the first administrator may
 * also have a vendor row created by the auth signup trigger.
 */
async function signInAndResolveRole(email: string, password: string): Promise<SignInOutcome> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Could not sign in." };
  }

  const { data: roleRow, error: roleError } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (roleError) {
    await supabase.auth.signOut();
    return { ok: false, error: roleError.message };
  }
  if (roleRow) return { ok: true, destination: "/admin" };

  // First administrator ever. This is how an owner arrives after confirming
  // their email on the setup screen: the account exists, but the session only
  // appears now, so the claim has to happen at this point.
  const { data: exists, error: existsError } = await supabase.rpc("admin_exists");
  if (existsError) {
    await supabase.auth.signOut();
    return { ok: false, error: existsError.message };
  }
  if (exists === false) {
    const { error: claimError } = await supabase.rpc("claim_store");
    if (claimError) {
      await supabase.auth.signOut();
      return { ok: false, error: claimError.message };
    }
    return { ok: true, destination: "/admin" };
  }

  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (vendorError) {
    await supabase.auth.signOut();
    return { ok: false, error: vendorError.message };
  }
  if (vendor) return { ok: true, destination: "/dashboard" };

  await supabase.auth.signOut();
  return { ok: false, error: "This account is not a shop administrator." };
}

/**
 * Admin sign-in.
 *
 * Signing in is not the same as being an admin. After a successful password
 * sign-in this checks `admin_users` directly, and if there is no row it signs the
 * session straight back out. Leaving a valid customer session open on the admin
 * screen would be worse than a failed login: the next request would look
 * authenticated and only fail deep inside a policy.
 */
function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isAdmin, loading, user, refreshRole } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Already signed in as an admin: nothing to do here.
  useEffect(() => {
    if (!loading && isAdmin) void navigate({ to: "/admin" });
  }, [loading, isAdmin, navigate]);

  // A brand-new install has no owner, so point at setup rather than leaving the
  // owner staring at a sign-in form for an account that cannot exist yet.
  useEffect(() => {
    // Postgrest builders are PromiseLike, not Promise, so there is no .catch.
    void getSupabase()
      .rpc("admin_exists")
      .then(
        ({ data }) => setNeedsSetup(data === false),
        () => undefined,
      );
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const outcome = await signInAndResolveRole(email, password);
    setBusy(false);
    if (outcome.ok) {
      await refreshRole();
      void navigate({ to: outcome.destination });
      return;
    }
    setError(outcome.error);
  };

  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-6 py-16">
      <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
        <Store size={20} className="text-primary" aria-hidden="true" />
        {t("app.name")}
      </Link>

      <form
        onSubmit={submit}
        className="flex w-full max-w-sm flex-col gap-5 rounded-[16px] border border-outline bg-surface p-6"
      >
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold">
            <LockKeyhole size={18} className="text-primary" aria-hidden="true" />
            {t("admin.login.title")}
          </h1>
          <p className="text-sm text-on-surface-muted">{t("admin.login.body")}</p>
        </div>

        <Field label={t("admin.login.email")} required>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            dir="ltr"
            required
            disabled={busy}
          />
        </Field>

        <Field label={t("admin.login.password")} required>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            dir="ltr"
            required
            disabled={busy}
          />
        </Field>

        {error && (
          <p className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error" role="alert">
            {error}
          </p>
        )}

        {user && !isAdmin && !error && (
          <p className="text-sm text-on-surface-muted">{t("admin.login.notAdmin")}</p>
        )}

        <Button type="submit" size="lg" disabled={busy}>
          {busy ? t("common.loading") : t("admin.login.submit")}
        </Button>

        {/* Only offered while the shop has no owner, so it cannot be used to
            take over a running store. */}
        {needsSetup && (
          <Link
            to="/setup"
            className="rounded-[10px] border border-primary/40 bg-primary/5 px-3 py-2.5 text-center text-sm text-primary hover:bg-primary/10"
          >
            {t("setup.title")}
          </Link>
        )}
      </form>
    </main>
  );
}
