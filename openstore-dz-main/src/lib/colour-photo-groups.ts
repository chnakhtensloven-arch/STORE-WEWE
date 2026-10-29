import type { AdminVariant } from "./admin-products";

export type ColourPhotoGroup = {
  colour: string | null;
  hex: string | null;
  variants: AdminVariant[];
  urls: string[];
};

/** Variants by colour, with photos de-duplicated across sizes. */
export function groupVariantsByColour(variants: AdminVariant[]): ColourPhotoGroup[] {
  const groups = new Map<string, ColourPhotoGroup>();
  for (const variant of variants) {
    const key = variant.color_name ?? "";
    const group = groups.get(key) ?? {
      colour: variant.color_name,
      hex: variant.color_hex,
      variants: [],
      urls: [],
    };
    group.variants.push(variant);
    for (const image of [...variant.variant_images].sort((a, b) => a.sort_order - b.sort_order)) {
      if (!group.urls.includes(image.url)) group.urls.push(image.url);
    }
    groups.set(key, group);
  }
  return [...groups.values()];
}
