import { useI18n } from "@/lib/i18n-context";
import { useStoreSettings, type CatalogueProduct } from "@/lib/queries";
import { useProductPageProducts } from "@/lib/product-page-products";
import { ProductGrid } from "./product-card";

export function RelatedProducts({ product }: { product: CatalogueProduct }) {
  const { t } = useI18n();
  const { data: settings } = useStoreSettings();
  const ids = settings?.featured_product_ids ?? [];
  const selectedProducts = useProductPageProducts(ids);
  const others = (selectedProducts.data ?? []).filter((p) => p.id !== product.id).slice(0, 4);
  if (others.length === 0) return null;

  return (
    <section className="flex flex-col gap-5" aria-labelledby="related-title">
      <h2 id="related-title" className="font-display text-xl font-semibold">
        {t("store.related")}
      </h2>
      <ProductGrid products={others} />
    </section>
  );
}
