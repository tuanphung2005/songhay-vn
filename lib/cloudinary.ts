import { createHash } from "node:crypto"

type UploadParams = {
  buffer: Buffer
  filename: string
  mimeType: string
  folder?: string
}

type CloudinaryUploadResponse = {
  secure_url?: string
  error?: {
    message?: string
  }
}

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET

  if (!cloudName) {
    throw new Error("Missing CLOUDINARY_CLOUD_NAME")
  }

  if (!uploadPreset && (!apiKey || !apiSecret)) {
    throw new Error("Missing Cloudinary credentials. Set CLOUDINARY_UPLOAD_PRESET or CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET")
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    uploadPreset,
  }
}

function toSignature(params: Record<string, string | number>, apiSecret: string) {
  const base = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== null && value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  return createHash("sha1")
    .update(`${base}${apiSecret}`)
    .digest("hex")
}

export async function uploadImageToCloudinary({ buffer, filename, mimeType, folder = "songhay" }: UploadParams) {
  const { cloudName, apiKey, apiSecret, uploadPreset } = getCloudinaryConfig()
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
  const formData = new FormData()
  const fileBytes = new Uint8Array(buffer)

  formData.append("file", new Blob([fileBytes], { type: mimeType }), filename)
  formData.append("folder", folder)

  if (uploadPreset) {
    formData.append("upload_preset", uploadPreset)
  } else {
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = toSignature({ folder, timestamp }, apiSecret!)
    formData.append("api_key", apiKey!)
    formData.append("timestamp", String(timestamp))
    formData.append("signature", signature)
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  })

  const payload = (await response.json()) as CloudinaryUploadResponse

  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message || "Cloudinary upload failed")
  }

  return payload.secure_url
}
