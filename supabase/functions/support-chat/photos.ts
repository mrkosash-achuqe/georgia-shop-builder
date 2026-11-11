export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function isChatPhoto(url: unknown, mediaType: unknown): url is string {
  if (typeof url !== "string" || typeof mediaType !== "string" || !PHOTO_TYPES.includes(mediaType)) return false;
  const prefix = `data:${mediaType};base64,`;
  if (!url.startsWith(prefix)) return false;
  const encoded = url.slice(prefix.length);
  if (!encoded.length || encoded.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return false;
  try {
    const bytes = atob(encoded);
    if (bytes.length > MAX_PHOTO_BYTES) return false;
    if (mediaType === "image/jpeg") return bytes.startsWith("\xff\xd8\xff");
    if (mediaType === "image/png") return bytes.startsWith("\x89PNG\r\n\x1a\n");
    return bytes.startsWith("RIFF") && bytes.slice(8, 12) === "WEBP";
  } catch { return false; }
}