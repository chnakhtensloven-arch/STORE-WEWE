import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { sanitizeRichHtml } from "@/lib/rich-html";

const formatting =
  "whitespace-pre-line break-words leading-relaxed [&_h1]:my-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:my-3 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-6 [&_li]:my-1 [&_a]:text-primary [&_a]:underline [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:object-contain [&_figure]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-outline [&_td]:p-2 [&_th]:border [&_th]:border-outline [&_th]:p-2";

export function RichDescription({
  value,
  className,
  style,
}: {
  value: string;
  className?: string;
  style?: CSSProperties;
}) {
  const html = sanitizeRichHtml(value);
  if (!html.trim()) return null;

  return (
    <div
      className={cn(formatting, className)}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
