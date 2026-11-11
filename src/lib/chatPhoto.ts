import { MAX_PHOTO_BYTES, PHOTO_TYPES } from "../../supabase/functions/support-chat/photos";
export { MAX_PHOTO_BYTES, PHOTO_TYPES };

export function photoError(file: Pick<File, "type" | "size">): "type" | "size" | null {
  if (!PHOTO_TYPES.includes(file.type)) return "type";
  if (file.size <= 0 || file.size > MAX_PHOTO_BYTES) return "size";
  return null;
}