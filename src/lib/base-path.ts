/** Prefix for GitHub Pages project site (empty in local dev). */
export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || "";
}

/** Prefix static asset paths under /public for correct basePath. */
export function withBase(path: string): string {
  const base = getBasePath();
  if (!path) return base || "/";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
