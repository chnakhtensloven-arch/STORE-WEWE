import { describe, expect, it } from "vitest";
import { richHtmlToText, sanitizeRichHtml } from "./rich-html";

describe("sanitizeRichHtml", () => {
  it("decodes encoded markup and preserves formatting and images", () => {
    const html = sanitizeRichHtml(
      "&amp;lt;h2&amp;gt;Collection &amp;amp; style&amp;lt;/h2&amp;gt;" +
        "&amp;lt;p&amp;gt;New season&amp;lt;/p&amp;gt;" +
        '&amp;lt;img src="https://example.com/product.webp" alt="Product" width="640"&amp;gt;',
    );

    expect(html).toContain("<h2>Collection & style</h2>");
    expect(html).toContain("<p>New season</p>");
    expect(html).toContain(
      '<img src="https://example.com/product.webp" alt="Product" width="640">',
    );
  });

  it("keeps plain text while decoding common HTML entities", () => {
    expect(sanitizeRichHtml("Tissu &amp; coton&nbsp;— qualité")).toBe("Tissu & coton — qualité");
  });

  it("extracts readable text for search and page metadata", () => {
    expect(
      richHtmlToText(
        "&lt;p&gt;Chemise &amp; pantalon&lt;/p&gt;&lt;p&gt;Nouvelle collection&lt;/p&gt;",
      ),
    ).toBe("Chemise & pantalon\nNouvelle collection");
  });

  it("removes scripts, event handlers, unsafe links, and unsafe styles", () => {
    const html = sanitizeRichHtml(
      '<p onclick="alert(1)" style="color: red; position: fixed">Safe</p>' +
        '<script>alert(1)</script><a href="javascript:alert(1)">link</a>' +
        '<img src="javascript:alert(1)" onerror="alert(1)">',
    );

    expect(html).toContain('<p style="color:red;">Safe</p>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("position");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("href>");
    expect(html).not.toContain("src>");
  });
});
