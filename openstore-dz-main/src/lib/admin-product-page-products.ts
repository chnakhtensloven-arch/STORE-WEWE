import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";

export type HomepageProductOption = {
  id: string;
  name: string;
  name_fr: string | null;
  status: string;
};

async function fetchProductPageProductOptions(): Promise<HomepageProductOption[]> {
  const { data, error } = await getSupabase()
    .from("products")
    .select("id, name, name_fr, status")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export const productPageProductOptionsQuery = () =>
  queryOptions({
    queryKey: ["admin_product_page_product_options"] as const,
    queryFn: fetchProductPageProductOptions,
  });

export function useProductPageProductOptions() {
  return useQuery(productPageProductOptionsQuery());
}
