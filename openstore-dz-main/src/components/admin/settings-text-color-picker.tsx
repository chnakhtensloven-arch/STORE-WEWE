import { useI18n } from "@/lib/i18n-context";

export function SettingsTextColorPicker({
  value,
  defaultColor,
  label,
  onChange,
}: {
  value: string | null;
  defaultColor: string;
  label: string;
  onChange: (color: string | null) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <input
        type="color"
        value={value ?? defaultColor}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="size-10 cursor-pointer rounded-[10px] border border-outline bg-transparent p-1"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 text-xs text-on-surface-muted underline"
        >
          {t("admin.brand.default")}
        </button>
      )}
    </div>
  );
}
