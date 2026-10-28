import { Field, Input, Textarea } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import type { SettingsDraft, SettingsSetter } from "./settings-cards";
import { SettingsTextColorPicker } from "./settings-text-color-picker";

export function SettingsIdentityTextFields({
  form,
  set,
}: {
  form: SettingsDraft;
  set: SettingsSetter;
}) {
  const { t } = useI18n();

  return (
    <>
      <Field label={t("admin.settings.tagline")} className="sm:col-span-2">
        <div className="flex items-center gap-3">
          <Input
            value={form.tagline ?? ""}
            onChange={(event) => set("tagline", event.target.value || null)}
            maxLength={160}
            className="min-w-0 flex-1"
          />
          <SettingsTextColorPicker
            value={form.tagline_color}
            defaultColor="#1c1917"
            label={t("admin.settings.taglineColor")}
            onChange={(color) => set("tagline_color", color)}
          />
        </div>
      </Field>
      <Field
        label={`${t("admin.settings.tagline")} — ${t("admin.settings.latin")}`}
        hint={t("admin.settings.latinHint")}
        className="sm:col-span-2"
      >
        <Input
          value={form.tagline_fr ?? ""}
          onChange={(event) => set("tagline_fr", event.target.value || null)}
          maxLength={160}
          dir="ltr"
        />
      </Field>
      <Field label={t("common.description")} className="sm:col-span-2">
        <div className="flex items-start gap-3">
          <Textarea
            value={form.description ?? ""}
            onChange={(event) => set("description", event.target.value || null)}
            rows={3}
            maxLength={1000}
            className="min-w-0 flex-1"
          />
          <SettingsTextColorPicker
            value={form.description_color}
            defaultColor="#6b6460"
            label={t("admin.settings.descriptionColor")}
            onChange={(color) => set("description_color", color)}
          />
        </div>
      </Field>
      <Field
        label={`${t("common.description")} — ${t("admin.settings.latin")}`}
        className="sm:col-span-2"
      >
        <Textarea
          value={form.description_fr ?? ""}
          onChange={(event) => set("description_fr", event.target.value || null)}
          rows={3}
          maxLength={1000}
          dir="ltr"
        />
      </Field>
    </>
  );
}
