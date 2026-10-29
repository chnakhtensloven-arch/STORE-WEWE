import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";
import { PRODUCT_SELECT, type CatalogueProduct } from "./queries";

async function fetchProductPageProducts(ids: string[]): Promise<CatalogueProduct[]> {
  if (ids.length === 0) return [];

  const { data, error } = await getSupabase()
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", ids)
    .eq("status", "published");

  if (error) throw new Error(error.message);
  const byId = new Map(
    ((data ?? []) as unknown as CatalogueProduct[]).map((product) => [product.id, product]),
  );
  return ids.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product] : [];
  });
}

export const productPageProductsQuery = (ids: string[]) =>
  queryOptions({
    queryKey: ["product_page_products", ids] as const,
    queryFn: () => fetchProductPageProducts(ids),
  });

export function useProductPageProducts(ids: string[]) {
  return useQuery({
    ...productPageProductsQuery(ids),
    enabled: ids.length > 0,
  });
}
