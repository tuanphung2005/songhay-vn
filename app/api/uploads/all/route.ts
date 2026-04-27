import { NextResponse } from "next/server"

import { authCookieName, decodeSession } from "@/lib/auth"
import { attachMediaUsage } from "@/lib/media-usage"
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
  const uploaderIdParam = String(url.searchParams.get("uploaderId") || "").trim()
  const page = toPaging(url.searchParams.get("page"), 1)
  const requestedPageSize = toPaging(url.searchParams.get("pageSize"), DEFAULT_PAGE_SIZE)
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
  const uploaderIdFilter = uploaderIdParam.length > 0 ? uploaderIdParam : ""
  const includeUsage = url.searchParams.get("includeUsage") === "1"

  const where = {
    ...(uploaderIdFilter.length > 0 ? { uploaderId: uploaderIdFilter } : {}),
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

  const itemsWithUsage = includeUsage
    ? await attachMediaUsage(items)
    : items

  const uploaderOptions = await prisma.user.findMany({
    where: {
      mediaAssets: {
        some: {},
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  })

  return NextResponse.json({
    items: itemsWithUsage,
    uploaderOptions,
    pagination: {
      totalCount,
      totalPages,
      page: currentPage,
      pageSize,
    },
  })
}
