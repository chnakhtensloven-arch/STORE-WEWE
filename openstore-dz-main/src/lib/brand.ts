/**
 * The owner's brand colour, applied over the default theme.
 *
 * Text on the colour is black or white, whichever reads better by WCAG relative
 * luminance, so a pale yellow brand still gets legible buttons. Invalid input
 * is ignored rather than trusted: this string ends up inside a <style> tag.
 */
const HEX = /^#[0-9a-fA-F]{6}$/;

function channel(hex: string, start: number): number {
  const c = parseInt(hex.slice(start, start + 2), 16) / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function textOn(hex: string): "#111111" | "#ffffff" {
  const l = 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
  // Contrast against black is (l + 0.05) / 0.05; against white 1.05 / (l + 0.05).
  return (l + 0.05) / 0.05 > 1.05 / (l + 0.05) ? "#111111" : "#ffffff";
}

export function brandCss(color: string | null | undefined): string | null {
  if (!color || !HEX.test(color)) return null;
  const on = textOn(color);
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(color.slice(start, start + 2), 16));
  // Light mode: honour the owner's brand colour.
  // Dark mode: force white primary so buttons remain legible on dark surfaces,
  // regardless of whatever brand colour the owner picked.
  return [
    `:root{--primary:${color};--primary-solid:${color};--on-primary:${on};--brand-orange:${color};--scroll-thumb-hi:${color};--table-header-fg:${color};--primary-glow:rgba(${red}, ${green}, ${blue}, 0.18);--primary-glow-sm:rgba(${red}, ${green}, ${blue}, 0.08);--toggle-bg:rgba(${red}, ${green}, ${blue}, 0.06);--toggle-border:rgba(${red}, ${green}, ${blue}, 0.22);}`,
    `:root[data-theme="dark"]{--primary:#ffffff;--primary-solid:#ffffff;--on-primary:#111111;--brand-orange:#ffffff;--scroll-thumb-hi:#ffffff;--table-header-fg:#ffffff;--primary-glow:rgba(255, 255, 255, 0.2);--primary-glow-sm:rgba(255, 255, 255, 0.1);--toggle-bg:rgba(255, 255, 255, 0.08);--toggle-border:rgba(255, 255, 255, 0.25);}`,
  ].join("");
}
