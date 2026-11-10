import { del, put } from "@vercel/blob";

export async function uploadToBlob(
  pathname: string,
  file: File | Blob | Buffer,
  contentType?: string,
) {
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
    contentType,
  });
  return blob; // { url, pathname, ... }
}

export async function deleteFromBlob(urlOrPathname: string | null | undefined) {
  if (!urlOrPathname) return;
  try {
    await del(urlOrPathname);
  } catch (e) {
    console.error("Failed to delete blob:", urlOrPathname, e);
  }
}
