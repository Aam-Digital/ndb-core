export function resizeImage(
  file: File,
  maxSize = 360
): Promise<HTMLCanvasElement> {
  const image = new Image();
  image.src = URL.createObjectURL(file);

  return new Promise<HTMLCanvasElement>((resolve) => {
    image.onload = () => {
      let imageWidth = image.width,
        imageHeight = image.height;

      if (imageWidth > imageHeight) {
        if (imageWidth > maxSize) {
          imageHeight *= maxSize / imageWidth;
          imageWidth = maxSize;
        }
      } else {
        if (imageHeight > maxSize) {
          imageWidth *= maxSize / imageHeight;
          imageHeight = maxSize;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = imageWidth;
      canvas.height = imageHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, imageWidth, imageHeight);

      resolve(canvas);
    };
  });
}
