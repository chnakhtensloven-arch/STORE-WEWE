import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";
import { deleteProductImage, uploadProductImage } from "@/lib/image";
import { removeIfUnused } from "@/lib/colour-photos";
import {
  addVariantImage,
  deleteVariantImage,
  replaceVariantImage,
  type AdminVariant,
} from "@/lib/admin-products";

export function VariantImages({ variant }: { variant: AdminVariant }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const image = variant.variant_images[0] ?? null;

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin_product", variant.product_id] });

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadProductImage(file, variant.product_id);
      if (result.error || !result.url) {
        toast.error(result.error ?? t("common.somethingWrong"));
        return;
      }

      try {
        if (image) {
          await replaceVariantImage(image.id, result.url);
          for (const extra of variant.variant_images.slice(1)) {
            await deleteVariantImage(extra.id);
          }
          await Promise.all(variant.variant_images.map((existing) => removeIfUnused(existing.url)));
        } else {
          await addVariantImage(variant.id, result.url);
        }
        invalidate();
        toast.success(
          image ? t("admin.images.replaced") : t("admin.images.addedCount", { count: 1 }),
        );
      } catch (saveError) {
        await deleteProductImage(result.url);
        throw saveError;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.somethingWrong"));
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    if (!image) return;
    setUploading(true);
    try {
      for (const existing of variant.variant_images) {
        await deleteVariantImage(existing.id);
      }
      await Promise.all(variant.variant_images.map((existing) => removeIfUnused(existing.url)));
      invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.somethingWrong"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }}
      />
      {image && (
        <img
          src={image.url}
          alt=""
          className="size-10 rounded-[8px] border border-outline object-cover"
        />
      )}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={uploading}
        onClick={() => input.current?.click()}
        aria-label={image ? t("admin.images.replace") : t("admin.images.add")}
        title={image ? t("admin.images.replace") : t("admin.images.add")}
      >
        {uploading ? (
          <Loader2 size={15} className="animate-spin" aria-hidden="true" />
        ) : (
          <Camera size={15} aria-hidden="true" />
        )}
        {uploading ? t("admin.images.uploading") : t("admin.images.add")}
      </Button>
      {image && (
        <button
          type="button"
          onClick={() => void remove()}
          disabled={uploading}
          aria-label={t("common.delete")}
          className="grid size-8 place-items-center rounded-full text-error hover:bg-error/10"
        >
          <X size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
