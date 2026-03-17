import { NextResponse } from "next/server"

import { authCookieName, decodeSession } from "@/lib/auth"
import { uploadImageToCloudinary } from "@/lib/cloudinary"
import { prisma } from "@/lib/prisma"

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 48

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

function toPaging(input: string | null, fallback: number) {
  const value = Number.parseInt(input || "", 10)
  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }
  return value
}

export async function GET(request: unknown) {
  const incomingRequest = request as Request
  const token = readCookie(incomingRequest.headers.get("cookie"), authCookieName)
  const session = decodeSession(token)

  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const url = new URL(incomingRequest.url)
  const search = String(url.searchParams.get("search") || "").trim()
  const page = toPaging(url.searchParams.get("page"), 1)
  const requestedPageSize = toPaging(url.searchParams.get("pageSize"), DEFAULT_PAGE_SIZE)
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)

  const where = {
    assetType: "IMAGE" as const,
    uploaderId: session.userId,
    ...(search.length > 0
      ? {
        OR: [
          { displayName: { contains: search, mode: "insensitive" as const } },
          { filename: { contains: search, mode: "insensitive" as const } },
        ],
      }
      : {}),
  }

  const totalCount = await prisma.mediaAsset.count({ where })
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const currentPage = Math.min(page, totalPages)

  const items = await prisma.mediaAsset.findMany({
    where,
    select: {
      id: true,
      assetType: true,
      visibility: true,
      url: true,
      displayName: true,
      filename: true,
      mimeType: true,
      sizeBytes: true,
      uploadedAt: true,
      uploader: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ uploadedAt: "desc" }],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })

  return NextResponse.json({
    items,
    pagination: {
      totalCount,
      totalPages,
      page: currentPage,
      pageSize,
    },
  })
}

export async function POST(request: unknown) {
  const incomingRequest = request as Request
  const token = readCookie(incomingRequest.headers.get("cookie"), authCookieName)
  const session = decodeSession(token)

  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const formData = await incomingRequest.formData()
  const file = formData.get("file")
  const displayNameInput = String(formData.get("displayName") || "").trim()

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 })
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    const url = await uploadImageToCloudinary({
      buffer,
      filename: file.name,
      mimeType: file.type,
      folder: "songhay/editor",
    })

    const asset = await prisma.mediaAsset.create({
      data: {
        assetType: "IMAGE",
        visibility: "PRIVATE",
        url,
        displayName: displayNameInput.length > 0 ? displayNameInput.slice(0, 120) : null,
        filename: file.name,
        mimeType: file.type || "image/jpeg",
        sizeBytes: file.size,
        uploaderId: session.userId,
      },
      select: {
        id: true,
        url: true,
      },
    })

    return NextResponse.json({ url, asset })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "upload_failed" },
      { status: 500 }
    )
  }
}
