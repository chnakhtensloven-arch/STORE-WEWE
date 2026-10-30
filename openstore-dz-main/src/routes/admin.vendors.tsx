import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Ban, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n-context";
import { getSupabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/admin/vendors")({
  component: VendorsPage,
});

const ADMIN_EMAIL = "chnakhtensloven@gmail.com";
const VENDORS_KEY = ["admin_vendors"] as const;

type Vendor = {
  id: string;
  user_id: string;
  store_name: string | null;
  is_active: boolean;
  subscription_end: string | null;
  email: string | null;
};

type VendorAction = "activate" | "deactivate";

async function fetchVendors(): Promise<Vendor[]> {
  const { data, error } = await getSupabase().rpc("admin_list_vendors");
  if (error) throw new Error(error.message);
  return data ?? [];
}

function VendorTable({
  vendors,
  busy,
  onUpdate,
}: {
  vendors: Vendor[];
  busy: boolean;
  onUpdate: (id: string, action: VendorAction) => void;
}) {
  const { t, locale } = useI18n();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-start text-sm">
          <thead className="bg-surface-mid text-xs text-on-surface-muted">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">
                {t("admin.vendors.email")}
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                {t("admin.vendors.store")}
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                {t("admin.vendors.status")}
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                {t("admin.vendors.subscriptionEnd")}
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                {t("admin.vendors.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline">
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-on-surface-muted">
                  {t("admin.vendors.empty")}
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id} className="align-middle">
                  <td className="px-5 py-4" dir="ltr">
                    {vendor.email ?? "—"}
                  </td>
                  <td className="px-5 py-4">{vendor.store_name ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        vendor.is_active
                          ? "inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                          : "inline-flex rounded-full bg-error/10 px-2.5 py-1 text-xs font-medium text-error"
                      }
                    >
                      {t(vendor.is_active ? "admin.vendors.active" : "admin.vendors.inactive")}
                    </span>
                  </td>
                  <td className="px-5 py-4" dir="ltr">
                    {vendor.subscription_end
                      ? dateFormatter.format(new Date(`${vendor.subscription_end}T00:00:00`))
                      : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => onUpdate(vendor.id, "activate")}
                      >
                        <Check size={15} aria-hidden="true" />
                        {t("admin.vendors.activate")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        disabled={busy}
                        onClick={() => onUpdate(vendor.id, "deactivate")}
                      >
                        <Ban size={15} aria-hidden="true" />
                        {t("admin.vendors.deactivate")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function VendorsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const allowed = user?.email?.trim().toLowerCase() === ADMIN_EMAIL;

  const vendors = useQuery({
    queryKey: VENDORS_KEY,
    queryFn: fetchVendors,
    enabled: allowed,
  });
  const updateVendor = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "activate" | "deactivate" }) => {
      const { error } =
        action === "activate"
          ? await getSupabase().rpc("admin_activate_vendor", { p_vendor_id: id })
          : await getSupabase().rpc("admin_deactivate_vendor", { p_vendor_id: id });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, { action }) => {
      void queryClient.invalidateQueries({ queryKey: VENDORS_KEY });
      toast.success(
        t(action === "activate" ? "admin.vendors.activated" : "admin.vendors.deactivated"),
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!allowed) {
    return (
      <div
        className="rounded-[16px] border border-error/40 bg-error/5 px-5 py-4 text-sm"
        role="alert"
      >
        {t("admin.vendors.accessDenied")}
      </div>
    );
  }
  if (vendors.isPending) return <LoadingState />;
  if (vendors.isError) {
    return <ErrorState message={vendors.error.message} onRetry={() => void vendors.refetch()} />;
  }
  const rows = vendors.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("admin.vendors.title")}</h1>
        <p className="mt-1 max-w-xl text-sm text-on-surface-muted">{t("admin.vendors.intro")}</p>
      </div>

      <VendorTable
        vendors={rows}
        busy={updateVendor.isPending}
        onUpdate={(id, action) => updateVendor.mutate({ id, action })}
      />
    </div>
  );
}
