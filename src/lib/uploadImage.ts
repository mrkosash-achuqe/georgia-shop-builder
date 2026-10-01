import { supabase } from "@/integrations/supabase/client";

/** Uploads an image to the public product-images bucket under a folder and returns its public URL. */
export const uploadImage = async (file: File, folder: string): Promise<string> => {
  if (!file.type.startsWith("image/")) throw new Error("Only images are allowed");
  if (file.size > 5 * 1024 * 1024) throw new Error("Max 5MB");
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
};
