import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n-context";
import { getSupabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Vendor dashboard" }, { name: "robots", content: "noindex" }],
  }),
  component: VendorDashboardPage,
});

function VendorDashboardPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const vendor = useQuery({
    queryKey: ["vendor_dashboard", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) throw new Error(t("dashboard.notSignedIn"));
      const { data, error } = await getSupabase()
        .from("vendors")
        .select("store_name, is_active, subscription_end")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) return <LoadingState className="min-h-dvh" />;
  if (vendor.isPending) return <LoadingState className="min-h-dvh" />;
  if (vendor.isError) {
    return (
      <main className="container-page flex min-h-dvh items-center justify-center py-16">
        <ErrorState message={vendor.error.message} onRetry={() => void vendor.refetch()} />
      </main>
    );
  }
  if (!vendor.data) {
    return (
      <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">{t("dashboard.title")}</h1>
        <p className="max-w-md text-sm text-on-surface-muted">{t("dashboard.vendorMissing")}</p>
      </main>
    );
  }

  const subscriptionEnd = vendor.data.subscription_end
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
        new Date(`${vendor.data.subscription_end}T00:00:00`),
      )
    : t("dashboard.noSubscription");

  return (
    <main className="container-page flex min-h-dvh flex-col gap-8 py-8 sm:py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <Store size={20} className="text-primary" aria-hidden="true" />
          {t("app.name")}
        </Link>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void signOut().then(() => navigate({ to: "/login" }));
          }}
        >
          <LogOut size={16} aria-hidden="true" />
          {t("nav.logout")}
        </Button>
      </header>

      <section className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold">{t("dashboard.title")}</h1>
        <p className="text-sm text-on-surface-muted">
          {t("dashboard.welcome", { store: vendor.data.store_name })}
        </p>
      </section>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-semibold">{t("dashboard.subscription")}</h2>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm text-on-surface-muted">{t("dashboard.status")}</span>
            <span
              className={
                vendor.data.is_active
                  ? "inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  : "inline-flex rounded-full bg-error/10 px-3 py-1 text-sm font-medium text-error"
              }
            >
              {t(vendor.data.is_active ? "dashboard.active" : "dashboard.inactive")}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline pt-4">
            <span className="text-sm text-on-surface-muted">{t("dashboard.subscriptionEnd")}</span>
            <span dir="ltr">{subscriptionEnd}</span>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
