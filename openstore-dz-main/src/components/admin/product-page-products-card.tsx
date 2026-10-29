import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { localized } from "@/lib/i18n";
import { useProductPageProductOptions } from "@/lib/admin-product-page-products";

export function ProductPageProductsCard({
  featuredProductIds,
  onChange,
}: {
  featuredProductIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t, locale } = useI18n();
  const products = useProductPageProductOptions();
  const visibleProducts = products.data?.filter(
    (product) => product.status === "published" || featuredProductIds.includes(product.id),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.settings.productPageProducts")}</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <p className="text-sm text-on-surface-muted">
          {t("admin.settings.productPageProductsHint")}
        </p>
        {products.isPending ? (
          <LoadingState />
        ) : products.isError ? (
          <ErrorState
            message={`${t("admin.settings.productPageProductsLoadError")} ${products.error.message}`}
            onRetry={() => void products.refetch()}
          />
        ) : visibleProducts?.length === 0 ? (
          <EmptyState title={t("admin.settings.productPageProductsEmpty")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {visibleProducts?.map((product) => (
              <li key={product.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-outline px-3 py-2">
                  <input
                    type="checkbox"
                    checked={featuredProductIds.includes(product.id)}
                    onChange={(event) => {
                      onChange(
                        event.target.checked
                          ? [...featuredProductIds, product.id]
                          : featuredProductIds.filter((id) => id !== product.id),
                      );
                    }}
                  />
                  <span>{localized(locale, product.name, product.name_fr)}</span>
                  {product.status !== "published" && (
                    <span className="text-xs text-on-surface-muted">
                      {product.status === "archived" ? t("common.archived") : t("common.draft")}
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
