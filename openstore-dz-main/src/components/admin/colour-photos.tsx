import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";
import { deleteProductImage, uploadProductImage } from "@/lib/image";
import { attachToVariants, detachFromVariants, replaceColourImage } from "@/lib/colour-photos";
import type { AdminVariant } from "@/lib/admin-products";
import { groupVariantsByColour, type ColourPhotoGroup } from "@/lib/colour-photo-groups";

/**
 * Photos by colour.
 *
 * The storefront shows a colour's photos whichever size is picked, so this is
 * where an owner adds them: once per colour, from the phone's camera or files,
 * and every size of that colour gets them. Per-size photos are still editable
 * under each variant for the rare product that needs them.
 */
export function ColourPhotos({
  productId,
  variants,
}: {
  productId: string;
  variants: AdminVariant[];
}) {
  const { t } = useI18n();
  const groups = groupVariantsByColour(variants);
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-on-surface-muted">{t("admin.photos.intro")}</p>
      {groups.map((group) => (
        <ColourRow key={group.colour ?? ""} productId={productId} group={group} />
      ))}
    </div>
  );
}

function ColourRow({ productId, group }: { productId: string; group: ColourPhotoGroup }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const ids = group.variants.map((v) => v.id);
  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin_product", productId] });

  // One file at a time: mobile uplinks dislike parallel uploads, and one bad
  // photo must not cost the owner the other four.
  const addFiles = async (files: File[]) => {
    setUploading(true);
    let added = 0;
    try {
      for (const [index, file] of files.entries()) {
        const { url, error } = await uploadProductImage(file, productId);
        if (error || !url) {
          toast.error(`${file.name}: ${error ?? t("common.somethingWrong")}`);
          continue;
        }
        try {
          await attachToVariants(ids, url, group.urls.length + index);
          added += 1;
        } catch (attachError) {
          await deleteProductImage(url);
          toast.error(
            attachError instanceof Error ? attachError.message : t("common.somethingWrong"),
          );
        }
      }
    } finally {
      setUploading(false);
    }
    if (added > 0) {
      invalidate();
      toast.success(t("admin.photos.added", { count: added }));
    }
  };

  const replaceImage = async (file: File, oldUrl: string) => {
    setUploading(true);
    try {
      const { url, error } = await uploadProductImage(file, productId);
      if (error || !url) {
        toast.error(`${t("admin.images.replaceFailed")}: ${error ?? t("common.somethingWrong")}`);
        return;
      }
      try {
        await replaceColourImage(ids, oldUrl, url);
        invalidate();
        toast.success(t("admin.images.replaced"));
      } catch (replaceError) {
        await deleteProductImage(url);
        throw replaceError;
      }
    } catch (replaceError) {
      toast.error(
        `${t("admin.images.replaceFailed")}: ${
          replaceError instanceof Error ? replaceError.message : t("common.somethingWrong")
        }`,
      );
    } finally {
      setUploading(false);
    }
  };

  const remove = useMutation({
    mutationFn: (url: string) => detachFromVariants(ids, url),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="flex flex-col gap-2 rounded-[12px] border border-outline p-3">
      <div className="flex flex-wrap items-center gap-2">
        {group.hex && (
          <span
            className="size-4 rounded-full border border-outline"
            style={{ background: group.hex }}
          />
        )}
        <span className="font-medium">{group.colour ?? t("admin.photos.noColour")}</span>
        <span className="font-mono text-xs text-on-surface-muted">
          {group.variants
            .map((v) => v.size)
            .filter(Boolean)
            .join(" · ")}
        </span>
        <ColourPhotoUploadControls uploading={uploading} addFiles={addFiles} />
      </div>
      {group.urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {group.urls.map((url) => (
            <ColourPhotoTile
              key={url}
              url={url}
              disabled={remove.isPending || uploading}
              replaceLabel={t("admin.images.replace")}
              deleteLabel={t("common.delete")}
              onReplace={(file) => void replaceImage(file, url)}
              onDelete={() => remove.mutate(url)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ColourPhotoTile({
  url,
  disabled,
  replaceLabel,
  deleteLabel,
  onReplace,
  onDelete,
}: {
  url: string;
  disabled: boolean;
  replaceLabel: string;
  deleteLabel: string;
  onReplace: (file: File) => void;
  onDelete: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <span className="relative">
      <img src={url} alt="" className="size-16 rounded-[10px] border border-outline object-cover" />
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onReplace(file);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
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
        className="absolute -end-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-error text-white"
      >
        <X size={13} aria-hidden="true" />
      </button>
    </span>
  );
}

function ColourPhotoUploadControls({
  uploading,
  addFiles,
}: {
  uploading: boolean;
  addFiles: (files: File[]) => void;
}) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="ms-auto"
        disabled={uploading}
        onClick={() => input.current?.click()}
      >
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
        {uploading ? t("admin.images.uploading") : t("admin.images.add")}
      </Button>
    </>
  );
}
