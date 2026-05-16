import { supabase } from "./supabase";

const CERT_BUCKET = "certificates";
const AVATAR_BUCKET = "avatars";

export async function uploadCertificatePdf(
  userId: string,
  certificateId: string,
  file: File
): Promise<string> {
  const path = `${userId}/${certificateId}.pdf`;
  const { error } = await supabase.storage
    .from(CERT_BUCKET)
    .upload(path, file, { upsert: true, contentType: "application/pdf" });

  if (error) throw error;

  const { data } = supabase.storage.from(CERT_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
