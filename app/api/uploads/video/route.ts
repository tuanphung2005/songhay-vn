import { NextResponse } from "next/server"

import { authCookieName, decodeSession } from "@/lib/auth"
import { uploadVideoToCloudinary } from "@/lib/cloudinary"

const MAX_VIDEO_UPLOAD_BYTES = 200 * 1024 * 1024

function readCookie(raw: string | null, name: string) {
  if (!raw) {
    return null
  }

  const chunks = raw.split(";")
  for (const chunk of chunks) {
    const [key, ...rest] = chunk.trim().split("=")
    if (key === name) {
      return decodeURIComponent(rest.join("="))
    }
  }

  return null
}

export async function POST(request: unknown) {
  const incomingRequest = request as Request
  const token = readCookie(incomingRequest.headers.get("cookie"), authCookieName)
  const session = decodeSession(token)

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const formData = await incomingRequest.formData()
  const file = formData.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 })
  }

  if (!file.type.startsWith("video/")) {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 })
  }

  if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    const url = await uploadVideoToCloudinary({
      buffer,
      filename: file.name,
      mimeType: file.type,
      folder: "songhay/editor/videos",
    })

    return NextResponse.json({ url })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "upload_failed" },
      { status: 500 }
    )
  }
}
