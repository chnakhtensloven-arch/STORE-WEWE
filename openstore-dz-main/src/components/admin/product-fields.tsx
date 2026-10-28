import { Field, Input, Select } from "@/components/ui/form";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n-context";
import { useCategories } from "@/lib/queries";
import type { AdminProduct } from "@/lib/admin-products";
import type { ProductDescription } from "@/lib/product-description";
import { ProductDescriptionEditor } from "./product-description-editor";

/** The editable text fields of a product. */
export type ProductDraft = {
  name: string;
  name_fr: string;
  description: ProductDescription;
  description_fr: ProductDescription;
  category_id: string;
};

export function ProductFieldsCard({
  draft,
  set,
  productId,
  status,
  onStatusChange,
}: {
  draft: ProductDraft;
  set: <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => void;
  productId: string;
  status: string;
  onStatusChange: (status: AdminProduct["status"]) => void;
}) {
  const { t } = useI18n();
  const { data: categories } = useCategories();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.products.details")}</CardTitle>
      </CardHeader>
      <CardBody className="grid gap-4 sm:grid-cols-2">
        <Field label={t("common.name")} required>
          <Input value={draft.name} onChange={(e) => set("name", e.target.value)} maxLength={120} />
        </Field>
        <Field label={t("admin.products.nameFr")}>
          <Input
            value={draft.name_fr}
            onChange={(e) => set("name_fr", e.target.value)}
            maxLength={120}
            dir="ltr"
          />
        </Field>
        <ProductDescriptionEditor
          label={t("common.description")}
          productId={productId}
          blocks={draft.description}
          onChange={(blocks) => set("description", blocks)}
        />
        <ProductDescriptionEditor
          label={t("admin.products.descriptionFr")}
          productId={productId}
          blocks={draft.description_fr}
          onChange={(blocks) => set("description_fr", blocks)}
        />

        {/* A select, not free text. A typed category used to silently create a
            new one on every typo, which is why categories are entities now. */}
        <Field
          label={t("common.category")}
          hint={
            categories && categories.length === 0 ? t("admin.products.noCategories") : undefined
          }
        >
          <Select
            value={draft.category_id}
            onChange={(event) => set("category_id", event.target.value)}
          >
            <option value="">{t("common.none")}</option>
            {(categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t("common.status")}>
          <Select
            value={status}
            onChange={(event) => onStatusChange(event.target.value as AdminProduct["status"])}
          >
            <option value="draft">{t("common.draft")}</option>
            <option value="published">{t("common.published")}</option>
            <option value="archived">{t("common.archived")}</option>
          </Select>
        </Field>
      </CardBody>
    </Card>
  );
}
