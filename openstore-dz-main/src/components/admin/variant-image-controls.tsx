import { ImagePlus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import type { AdminVariant } from "@/lib/admin-products";

export function VariantImagePreview({
  image,
  disabled,
  replaceLabel,
  deleteLabel,
  onReplace,
  onDelete,
}: {
  image: AdminVariant["variant_images"][number];
  disabled: boolean;
  replaceLabel: string;
  deleteLabel: string;
  onReplace: () => void;
  onDelete: () => void;
}) {
  return (
    <span className="relative">
      <img
        src={image.url}
        alt=""
        className="size-16 rounded-[10px] border border-outline object-cover"
      />
      <button
        type="button"
        onClick={onReplace}
        disabled={disabled}
        aria-label={replaceLabel}
        className="absolute -bottom-1.5 -start-1.5 grid size-6 place-items-center rounded-full bg-surface-high text-on-surface"
      >
        <RefreshCw size={13} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        aria-label={deleteLabel}
        className="absolute -top-1.5 -end-1.5 grid size-5 place-items-center rounded-full bg-error text-white"
      >
        <X size={11} aria-hidden="true" />
      </button>
    </span>
  );
}

export function VariantImageUrlForm({
  url,
  label,
  addLabel,
  busy,
  onChange,
  onSubmit,
}: {
  url: string;
  label: string;
  addLabel: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Field label={label} className="min-w-56 flex-1">
        <Input
          value={url}
          onChange={(event) => onChange(event.target.value)}
          dir="ltr"
          type="url"
          placeholder="https://…"
        />
      </Field>
      <Button type="submit" variant="ghost" size="sm" disabled={busy}>
        <ImagePlus size={15} aria-hidden="true" />
        {addLabel}
      </Button>
    </form>
  );
}
