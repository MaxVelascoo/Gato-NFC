export type PhotoCrop = {
  zoom: number;
  x: number;
  y: number;
  aspectRatio: number;
};

const outputWidth = 1200;

export async function cropCatPhoto(file: File, crop: PhotoCrop) {
  const image = await createImageBitmap(file);
  const aspectRatio = Math.min(2.5, Math.max(0.75, crop.aspectRatio));
  const outputHeight = Math.round(outputWidth / aspectRatio);
  const fitScale = Math.max(outputWidth / image.width, outputHeight / image.height);
  const zoom = Math.min(3, Math.max(1, crop.zoom));
  const sourceWidth = outputWidth / (fitScale * zoom);
  const sourceHeight = outputHeight / (fitScale * zoom);
  const sourceX = Math.min(
    image.width - sourceWidth,
    Math.max(0, (image.width - sourceWidth) / 2 - crop.x * sourceWidth),
  );
  const sourceY = Math.min(
    image.height - sourceHeight,
    Math.max(0, (image.height - sourceHeight) / 2 - crop.y * sourceHeight),
  );

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    image.close();
    throw new Error("No se pudo preparar el recorte de la foto.");
  }

  context.fillStyle = "#e7e9e5";
  context.fillRect(0, 0, outputWidth, outputHeight);
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight);
  image.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("No se pudo procesar la foto.")), "image/jpeg", 0.92);
  });
  const basename = file.name.replace(/\.[^.]+$/, "") || "foto-gato";
  return new File([blob], `${basename}-perfil.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}
