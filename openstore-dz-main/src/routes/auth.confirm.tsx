import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KeyRound, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { LoadingState } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { getSupabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/auth/confirm")({
  head: () => ({
    meta: [{ title: "Set your password" }, { name: "robots", content: "noindex" }],
  }),
  component: ConfirmInvitationPage,
});

const OTP_TYPES = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
  "phone_change",
  "sms",
] as const;

type OtpType = (typeof OTP_TYPES)[number];
type VerificationResult = { error: string | null };
type VerificationPhase = "verifying" | "ready" | "failed";

function isOtpType(value: string | null): value is OtpType {
  return value !== null && OTP_TYPES.some((otpType) => otpType === value);
}

function ConfirmInvitationPage() {
  const { t } = useI18n();
  const verification = useRef<Promise<VerificationResult> | null>(null);
  const [phase, setPhase] = useState<VerificationPhase>("verifying");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  useEffect(() => {
    if (!verification.current) {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (!tokenHash || !isOtpType(type)) {
        verification.current = Promise.resolve({ error: t("auth.confirm.invalidLink") });
      } else {
        verification.current = getSupabase()
          .auth.verifyOtp({ token_hash: tokenHash, type })
          .then(({ error }) => ({ error: error?.message ?? null }))
          .catch((error: unknown) => ({
            error: error instanceof Error ? error.message : t("common.somethingWrong"),
          }));
      }
    }

    let cancelled = false;
    void verification.current.then((result) => {
      if (cancelled) return;
      if (result.error) {
        setVerificationError(result.error);
        setPhase("failed");
      } else {
        setPhase("ready");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-6 py-16">
      <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
        <Store size={20} className="text-primary" aria-hidden="true" />
        {t("app.name")}
      </Link>

      {phase === "verifying" ? (
        <LoadingState className="min-h-64 w-full max-w-sm" />
      ) : phase === "failed" ? (
        <section className="flex w-full max-w-sm flex-col gap-4 rounded-[16px] border border-error/40 bg-error/5 p-6">
          <h1 className="font-display text-xl font-semibold">{t("auth.confirm.title")}</h1>
          <p className="text-sm text-error" role="alert">
            {verificationError}
          </p>
          <Button asChild variant="outline">
            <Link to="/login">{t("admin.login.submit")}</Link>
          </Button>
        </section>
      ) : (
        <PasswordSetupForm />
      )}
    </main>
  );
}

function PasswordSetupForm() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("auth.confirm.weakPassword"));
      return;
    }
    if (password !== confirmation) {
      setError(t("auth.confirm.passwordMismatch"));
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await getSupabase().auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      await navigate({ to: "/dashboard" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("common.somethingWrong"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-sm flex-col gap-5 rounded-[16px] border border-outline bg-surface p-6"
    >
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold">
          <KeyRound size={18} className="text-primary" aria-hidden="true" />
          {t("auth.confirm.title")}
        </h1>
        <p className="text-sm text-on-surface-muted">{t("auth.confirm.body")}</p>
      </div>

      <Field label={t("auth.confirm.password")} required>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          dir="ltr"
          required
          minLength={8}
          disabled={saving}
        />
      </Field>

      <Field label={t("auth.confirm.confirmPassword")} required>
        <Input
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="new-password"
          dir="ltr"
          required
          disabled={saving}
        />
      </Field>

      {error && (
        <p className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={saving}>
        {saving ? t("common.saving") : t("auth.confirm.submit")}
      </Button>
    </form>
  );
}
