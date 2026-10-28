export type ProductDescriptionBlock =
  | { id: string; type: "text"; text: string }
  | { id: string; type: "image"; url: string; alt: string };

export type ProductDescription = ProductDescriptionBlock[];

const PREFIX = "OPENSTORE-PRODUCT-DESCRIPTION:v1\n";

export function moveProductDescriptionBlock(
  blocks: ProductDescription,
  index: number,
  offset: -1 | 1,
): ProductDescription {
  const target = index + offset;
  if (index < 0 || target < 0 || index >= blocks.length || target >= blocks.length) return blocks;
  const next = [...blocks];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function removeProductDescriptionBlock(
  blocks: ProductDescription,
  index: number,
): ProductDescription {
  return blocks.filter((_, position) => position !== index);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSafeImageUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

/** Read the versioned block document, or preserve a legacy plain-text value. */
export function parseProductDescription(value: string | null | undefined): ProductDescription {
  if (!value) return [];
  if (!value.startsWith(PREFIX)) {
    return [{ id: "legacy-text-0", type: "text", text: value }];
  }

  try {
    const parsed: unknown = JSON.parse(value.slice(PREFIX.length));
    if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.blocks)) {
      return [{ id: "legacy-text-0", type: "text", text: value }];
    }

    const blocks: ProductDescription = [];
    for (const [index, block] of parsed.blocks.entries()) {
      if (!isRecord(block)) continue;
      if (block.type === "text" && typeof block.text === "string") {
        blocks.push({ id: `text-${index}`, type: "text", text: block.text });
      } else if (block.type === "image" && isSafeImageUrl(block.url)) {
        blocks.push({
          id: `image-${index}`,
          type: "image",
          url: block.url,
          alt: typeof block.alt === "string" ? block.alt : "",
        });
      }
    }
    return blocks;
  } catch {
    return [{ id: "legacy-text-0", type: "text", text: value }];
  }
}

/** Keep simple descriptions as plain text; serialize mixed content in the same DB column. */
export function serializeProductDescription(blocks: ProductDescription): string | null {
  const visible = blocks.filter((block) =>
    block.type === "text" ? block.text.length > 0 : isSafeImageUrl(block.url),
  );
  if (visible.length === 0) return null;
  if (visible.length === 1 && visible[0].type === "text") {
    return visible[0].text.trim() || null;
  }

  const content = visible.map((block) =>
    block.type === "text"
      ? { type: block.type, text: block.text }
      : { type: block.type, url: block.url, alt: block.alt },
  );
  return `${PREFIX}${JSON.stringify({ version: 1, blocks: content })}`;
}

/** Plain text for search-result metadata; image URLs and serialization are excluded. */
export function productDescriptionText(value: string | null | undefined): string {
  return parseProductDescription(value)
    .filter(
      (block): block is Extract<ProductDescriptionBlock, { type: "text" }> => block.type === "text",
    )
    .map((block) => block.text)
    .join("\n")
    .trim();
}
