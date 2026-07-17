/**
 * Redimensiona una imagen del lado del cliente antes de subirla al storage.
 * Baja el lado más largo a `maxSide` px y recomprime a JPEG, para que las fotos
 * de progreso no pesen varios MB (más rápido de subir y más barato de guardar).
 * Si algo falla, devuelve el archivo original para no bloquear la subida.
 */
export async function resizeImage(
  file: File,
  maxSide = 1280,
  quality = 0.82
): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    return blob ?? file;
  } catch {
    return file;
  }
}
