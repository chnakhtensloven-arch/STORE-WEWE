import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import { uploadProductImage } from "@/lib/image";
import {
  moveProductDescriptionBlock,
  removeProductDescriptionBlock,
  type ProductDescription,
  type ProductDescriptionBlock,
} from "@/lib/product-description";

export function ProductDescriptionEditor({
  label,
  productId,
  blocks,
  onChange,
}: {
  label: string;
  productId: string;
  blocks: ProductDescription;
  onChange: (blocks: ProductDescription) => void;
}) {
  const { t } = useI18n();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const addText = () => onChange([...blocks, { id: crypto.randomUUID(), type: "text", text: "" }]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    let added = 0;
    const newBlocks: ProductDescription = [];
    try {
      for (const file of Array.from(files)) {
        try {
          const result = await uploadProductImage(file, productId);
          if (result.error || !result.url) {
            toast.error(`${file.name}: ${result.error ?? t("admin.description.uploadFailed")}`);
            continue;
          }
          newBlocks.push({
            id: crypto.randomUUID(),
            type: "image",
            url: result.url,
            alt: file.name,
          });
          added += 1;
        } catch (error) {
          toast.error(
            `${file.name}: ${error instanceof Error ? error.message : t("admin.description.uploadFailed")}`,
          );
        }
      }
      if (newBlocks.length > 0) onChange([...blocks, ...newBlocks]);
      if (added > 0) toast.success(t("admin.images.addedCount", { count: added }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:col-span-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-on-surface-muted">{t("admin.description.builderHint")}</p>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        aria-label={t("admin.description.addImages")}
        disabled={uploading}
        onChange={(event) => {
          void uploadFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={addText}>
          <Plus size={15} aria-hidden="true" />
          {t("admin.description.addText")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        >
          {uploading ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus size={15} aria-hidden="true" />
          )}
          {uploading ? t("admin.images.uploading") : t("admin.description.addImages")}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {blocks.map((block, index) => (
          <DescriptionBlockEditor
            key={block.id}
            block={block}
            index={index}
            count={blocks.length}
            uploading={uploading}
            onMove={(offset) => onChange(moveProductDescriptionBlock(blocks, index, offset))}
            onRemove={() => onChange(removeProductDescriptionBlock(blocks, index))}
            onUpdate={(updated) =>
              onChange(blocks.map((current, position) => (position === index ? updated : current)))
            }
          />
        ))}
      </div>
    </div>
  );
}

function DescriptionBlockEditor({
  block,
  index,
  count,
  uploading,
  onMove,
  onRemove,
  onUpdate,
}: {
  block: ProductDescriptionBlock;
  index: number;
  count: number;
  uploading: boolean;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
  onUpdate: (block: ProductDescriptionBlock) => void;
}) {
  const { t } = useI18n();
  return (
    <section
      className="flex min-w-0 flex-col gap-3 rounded-[10px] border border-outline p-3"
      aria-label={t("admin.description.block", { number: index + 1 })}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-on-surface-muted">
          {block.type === "text"
            ? t("admin.description.textBlock")
            : t("admin.description.imageBlock")}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={uploading || index === 0}
            aria-label={t("admin.description.moveUp")}
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={15} aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={uploading || index === count - 1}
            aria-label={t("admin.description.moveDown")}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={15} aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={uploading}
            aria-label={t("admin.description.removeBlock")}
            onClick={onRemove}
          >
            <X size={15} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {block.type === "text" ? (
        <Textarea
          value={block.text}
          onChange={(event) => onUpdate({ ...block, text: event.target.value })}
          rows={4}
          maxLength={4000}
          aria-label={t("admin.description.textBlock")}
          disabled={uploading}
        />
      ) : (
        <div className="flex min-w-0 flex-col gap-3">
          <img
            src={block.url}
            alt={block.alt}
            className="h-auto max-h-80 max-w-full self-start rounded-[10px] object-contain"
            loading="lazy"
          />
          <label className="flex flex-col gap-1 text-xs font-medium text-on-surface-muted">
            {t("admin.description.imageAlt")}
            <input
              className="form-input"
              value={block.alt}
              onChange={(event) => onUpdate({ ...block, alt: event.target.value })}
              dir="auto"
              disabled={uploading}
            />
          </label>
        </div>
      )}
    </section>
  );
}
