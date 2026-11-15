export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Makes a photo ready to upload: phone photos are often 5-12 MB, so anything big is shrunk to at most
 * `maxSide` pixels and saved as JPEG. Small images are sent as they are.
 */
export async function prepareImage(file: File, maxSide = 1600, minBytes = 1_500_000, quality = 0.86): Promise<File> {
  if (file.size <= minBytes || typeof createImageBitmap !== "function") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Book covers are shown at most ~300px wide (about 650px on sharp screens), so anything bigger is wasted download. */
export const prepareCover = (file: File) => prepareImage(file, 900, 150_000, 0.82);
