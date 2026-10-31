import { decodeHTML } from "entities";
import xss from "xss";

const formattedTags = [
  "a",
  "blockquote",
  "b",
  "code",
  "del",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "table",
  "td",
  "th",
  "u",
  "ul",
];

const whiteList: Record<string, string[]> = Object.fromEntries(
  formattedTags.map((tag) => [tag, ["style"]]),
);

Object.assign(whiteList, {
  a: ["href", "title", "style"],
  br: [],
  hr: [],
  img: ["src", "alt", "title", "width", "height", "style"],
  sub: ["style"],
  sup: ["style"],
});

const options = {
  whiteList,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed"],
  css: {
    whiteList: {
      color: true,
      "background-color": true,
      "font-family": true,
      "font-size": true,
      "font-style": true,
      "font-weight": true,
      height: true,
      "line-height": true,
      "max-width": true,
      "text-align": true,
      "text-decoration": true,
      width: true,
    },
  },
};

function decodeEntities(value: string): string {
  let decoded = value;
  for (let pass = 0; pass < 3; pass += 1) {
    const next = decodeHTML(decoded);
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
}

export function sanitizeRichHtml(value: string): string {
  return xss(decodeEntities(value), options)
    .replace(/(<a\b[^>]*?)\s+href(?=\s|>)/gi, "$1")
    .replace(/(<img\b[^>]*?)\s+src(?=\s|>)/gi, "$1");
}

export function richHtmlToText(value: string): string {
  const source = decodeEntities(value)
    .replace(/<(?:br|hr)\b[^>]*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li|tr|blockquote|figcaption|pre)>/gi, "\n");
  const text = xss(source, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: options.stripIgnoreTagBody,
    css: options.css,
  });
  return decodeHTML(text)
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
