import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n-context";
import { uploadHeroImage } from "@/lib/image";
import type { SettingsDraft, SettingsSetter } from "./settings-cards";

type HeroImageDevice = "mobile" | "desktop";

function HeroImageField({
  device,
  value,
  onChange,
}: {
  device: HeroImageDevice;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const label =
    device === "mobile"
      ? t("admin.settings.mobileHeroImage")
      : t("admin.settings.desktopHeroImage");

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const { url, error } = await uploadHeroImage(file, device);
      if (error || !url) {
        toast.error(error ?? t("common.somethingWrong"));
        return;
      }
      onChange(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.somethingWrong"));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.03em] text-on-surface-muted">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid aspect-video w-36 place-items-center overflow-hidden rounded-[10px] border border-dashed border-outline-hi bg-surface-mid">
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus size={20} className="text-on-surface-muted" aria-hidden="true" />
          )}
        </span>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={(event) => void upload(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {busy ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus size={15} aria-hidden="true" />
          )}
          {busy
            ? t("admin.settings.uploadingHeroImage")
            : value
              ? t("admin.brand.replace")
              : t("admin.brand.upload")}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            <X size={15} aria-hidden="true" />
            {t("common.delete")}
          </Button>
        )}
      </div>
      <p className="text-xs text-on-surface-muted">{t("admin.settings.heroImageHint")}</p>
    </div>
  );
}

export function HeroImageFields({ form, set }: { form: SettingsDraft; set: SettingsSetter }) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.settings.heroImages")}</CardTitle>
      </CardHeader>
      <CardBody className="grid gap-4 sm:grid-cols-2">
        <HeroImageField
          device="mobile"
          value={form.hero_mobile_url}
          onChange={(url) => set("hero_mobile_url", url)}
        />
        <HeroImageField
          device="desktop"
          value={form.hero_desktop_url}
          onChange={(url) => set("hero_desktop_url", url)}
        />
      </CardBody>
    </Card>
  );
}
