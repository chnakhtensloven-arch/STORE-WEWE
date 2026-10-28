export const DEFAULT_STORE_NAME = "wewe-store";

const PLACEHOLDER_STORE_NAMES = new Set(["", "my shop", "openstore dz", DEFAULT_STORE_NAME]);

/** Use the default only when no nonblank store name has been saved. */
export function resolveStoreName(name: string | null | undefined): string {
  return name?.trim() ? name : DEFAULT_STORE_NAME;
}

export function isPlaceholderStoreName(name: string | null | undefined): boolean {
  return PLACEHOLDER_STORE_NAMES.has((name ?? "").trim().toLowerCase());
}
