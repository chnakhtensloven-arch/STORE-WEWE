import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/feedback";
import {
  CommerceCard,
  IdentityCard,
  LegalCard,
  type SettingsDraft,
  type SettingsSetter,
} from "@/components/admin/settings-cards";
import { MarketingCard } from "@/components/admin/marketing-card";
import { HeroImageFields } from "@/components/admin/hero-image-fields";
import { ExportSettings } from "@/components/admin/export-settings";
import { useI18n } from "@/lib/i18n-context";
import { useStoreSettings, type StoreSettings } from "@/lib/queries";
import { DEFAULT_TRUST_BAR_BG_COLOR, DEFAULT_TRUST_BAR_ICON_COLOR } from "@/lib/store-settings";
import { saveStoreSettings } from "@/lib/admin";
import { DEFAULT_STORE_NAME } from "@/lib/store-name";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

const DEFAULTS: StoreSettings = {
  id: 1,
  name: DEFAULT_STORE_NAME,
  tagline: null,
  tagline_color: null,
  description: null,
  description_color: null,
  tagline_fr: null,
  description_fr: null,
  address_fr: null,
  logo_url: null,
  banner_url: null,
  hero_mobile_url: null,
  hero_desktop_url: null,
  brand_color: "#000000",
  trust_bar_bg_color: DEFAULT_TRUST_BAR_BG_COLOR,
  trust_bar_icon_color: DEFAULT_TRUST_BAR_ICON_COLOR,
  legal_name: null,
  nif: null,
  rc_number: null,
  phone: null,
  whatsapp: null,
  email: null,
  address: null,
  free_shipping_threshold: 0,
  currency: "DZD",
  delivery_fee_flat: 600,
  delivery_wilayas: [],
  delivery_eta_days: 3,
  returns_days: 14,
  accepts_cod: true,
  guepex_from_wilaya: null,
  announcement: null,
  announcement_enabled: false,
  instagram_url: null,
  facebook_url: null,
  tiktok_url: null,
  returns_note: null,
};

function SettingsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data, isPending } = useStoreSettings();
  const [form, setForm] = useState<SettingsDraft>(DEFAULTS);

  // Seed the form once the row arrives. Without this the fields stay on
  // DEFAULTS and a save would blank the shop.
  useEffect(() => {
    if (data) setForm({ ...DEFAULTS, ...data });
  }, [data]);

  const mutation = useMutation({
    mutationFn: (patch: Partial<StoreSettings>) => saveStoreSettings(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store_settings"] });
      toast.success(t("admin.settings.saved"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isPending) return <LoadingState />;

  const set: SettingsSetter = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        // Never send the immutable id back.
        const { id: _id, ...rest } = form;
        void _id;
        mutation.mutate(rest);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{t("admin.settings.title")}</h1>
        <Button type="submit" disabled={mutation.isPending}>
          <Save size={16} aria-hidden="true" />
          {mutation.isPending ? t("common.saving") : t("common.save")}
        </Button>
      </div>

      <IdentityCard form={form} set={set} />
      <HeroImageFields form={form} set={set} />
      <LegalCard form={form} set={set} />
      <MarketingCard form={form} set={set} />
      <CommerceCard form={form} set={set} />
      <ExportSettings />
    </form>
  );
}
