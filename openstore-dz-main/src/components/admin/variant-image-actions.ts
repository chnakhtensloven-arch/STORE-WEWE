import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n-context";
import { deleteProductImage, uploadProductImage } from "@/lib/image";
import { removeIfUnused } from "@/lib/colour-photos";
import {
  addVariantImage,
  deleteVariantImage,
  replaceVariantImage,
  type AdminVariant,
} from "@/lib/admin-products";

async function uploadBatch(
  files: File[],
  variantId: string,
  productId: string,
): Promise<{ added: number; failures: string[] }> {
  const failures: string[] = [];
  let added = 0;
  for (const file of files) {
    let url: string | null;
    let error: string | null;
    try {
      ({ url, error } = await uploadProductImage(file, productId));
    } catch (uploadError) {
      failures.push(
        `${file.name}: ${uploadError instanceof Error ? uploadError.message : "upload failed"}`,
      );
      continue;
    }
    if (error || !url) {
      failures.push(`${file.name}: ${error ?? "upload failed"}`);
      continue;
    }
    try {
      await addVariantImage(variantId, url);
      added += 1;
    } catch (saveError) {
      await deleteProductImage(url);
      failures.push(saveError instanceof Error ? saveError.message : "could not save");
    }
  }
  return { added, failures };
}

export function useVariantImageActions(variant: AdminVariant, onUrlAdded: () => void) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin_product", variant.product_id] });

  const addUrl = useMutation({
    mutationFn: (value: string) => addVariantImage(variant.id, value),
    onSuccess: () => {
      invalidate();
      onUrlAdded();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: async (image: { id: string; url: string }) => {
      await deleteVariantImage(image.id);
      await removeIfUnused(image.url);
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });
  const replace = useMutation({
    mutationFn: async ({
      image,
      file,
    }: {
      image: AdminVariant["variant_images"][number];
      file: File;
    }) => {
      const upload = await uploadProductImage(file, variant.product_id);
      if (upload.error || !upload.url) {
        throw new Error(upload.error ?? t("common.somethingWrong"));
      }
      try {
        await replaceVariantImage(image.id, upload.url);
      } catch (error) {
        await deleteProductImage(upload.url);
        throw error;
      }
      await removeIfUnused(image.url);
    },
    onSuccess: () => {
      invalidate();
      toast.success(t("admin.images.replaced"));
    },
    onError: (error: Error) => toast.error(`${t("admin.images.replaceFailed")}: ${error.message}`),
  });

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { added, failures } = await uploadBatch(
        Array.from(files),
        variant.id,
        variant.product_id,
      );
      failures.forEach((failure) => toast.error(failure));
      if (added > 0) {
        invalidate();
        toast.success(t("admin.images.addedCount", { count: added }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.somethingWrong"));
    } finally {
      setUploading(false);
    }
  };

  return { addFiles, addUrl, remove, replace, uploading };
}
