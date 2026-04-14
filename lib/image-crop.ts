export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  targetWidth = 1200,
  targetHeight = 700
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    return null
  }

  // Set the canvas size to the target dimensions
  canvas.width = targetWidth
  canvas.height = targetHeight

  // Draw the cropped image onto the canvas, scaling it to the target dimensions
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  )

  // As a blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, "image/jpeg", 0.9)
  })
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.setAttribute("crossOrigin", "anonymous") // needed to avoid cross-origin issues on CodeSandbox
    image.src = url
  })
}
