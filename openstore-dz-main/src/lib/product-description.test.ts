import { describe, expect, it } from "vitest";
import {
  moveProductDescriptionBlock,
  parseProductDescription,
  removeProductDescriptionBlock,
  productDescriptionText,
  serializeProductDescription,
} from "./product-description";

describe("product description blocks", () => {
  it("preserves legacy plain text and line breaks", () => {
    const description = "First paragraph\n\nSecond paragraph";
    const blocks = parseProductDescription(description);
    expect(blocks).toEqual([{ id: "legacy-text-0", type: "text", text: description }]);
    expect(serializeProductDescription(blocks)).toBe(description);
  });

  it("round-trips mixed text and images in the selected order", () => {
    const document = [
      { id: "text-a", type: "text" as const, text: "Intro\nwith line break" },
      {
        id: "image-a",
        type: "image" as const,
        url: "https://example.com/promo.webp",
        alt: "Summer collection",
      },
      { id: "text-b", type: "text" as const, text: "Details below" },
      {
        id: "image-b",
        type: "image" as const,
        url: "https://example.com/size-guide.webp",
        alt: "Size guide",
      },
    ];

    const stored = serializeProductDescription(document);
    const restored = parseProductDescription(stored);

    expect(restored.map((block) => block.type)).toEqual(["text", "image", "text", "image"]);
    expect(restored[0]).toMatchObject({ type: "text", text: "Intro\nwith line break" });
    expect(restored[1]).toMatchObject({
      type: "image",
      url: "https://example.com/promo.webp",
      alt: "Summer collection",
    });
    expect(productDescriptionText(stored)).toBe("Intro\nwith line break\nDetails below");
  });

  it("falls back to plain text for malformed documents and rejects unsafe image URLs", () => {
    const malformed = "OPENSTORE-PRODUCT-DESCRIPTION:v1\nnot-json";
    expect(parseProductDescription(malformed)[0]).toMatchObject({
      type: "text",
      text: malformed,
    });

    const unsafe = serializeProductDescription([
      {
        id: "unsafe-image",
        type: "image",
        url: "javascript:alert(1)",
        alt: "not allowed",
      },
    ]);
    expect(unsafe).toBeNull();
  });

  it("stores empty descriptions as null", () => {
    expect(serializeProductDescription([])).toBeNull();
    expect(serializeProductDescription([{ id: "text", type: "text", text: "   " }])).toBeNull();
  });

  it("reorders and removes blocks without changing the remaining content", () => {
    const blocks = [
      { id: "text-a", type: "text" as const, text: "Intro" },
      {
        id: "image-a",
        type: "image" as const,
        url: "https://example.com/promo.webp",
        alt: "Promo",
      },
      { id: "text-b", type: "text" as const, text: "Details" },
    ];

    const reordered = moveProductDescriptionBlock(blocks, 2, -1);
    expect(reordered.map((block) => block.id)).toEqual(["text-a", "text-b", "image-a"]);
    expect(blocks.map((block) => block.id)).toEqual(["text-a", "image-a", "text-b"]);
    expect(removeProductDescriptionBlock(reordered, 1).map((block) => block.id)).toEqual([
      "text-a",
      "image-a",
    ]);
  });
});
