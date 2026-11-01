/** 只认本站 media 桶的公开地址，外部链接和 /demo 静态图不会被删。 */
const MARKER = "/storage/v1/object/public/media/";

export function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  let pathname = url;
  try {
    pathname = new URL(url, "https://placeholder.local").pathname;
  } catch {
    return null;
  }

  const index = pathname.indexOf(MARKER);
  if (index === -1) return null;

  let rel = pathname.slice(index + MARKER.length);
  try {
    rel = decodeURIComponent(rel);
  } catch {
    return null;
  }

  if (!rel || rel.startsWith("/") || rel.includes("..") || rel.includes("\\")) {
    return null;
  }

  return rel;
}
