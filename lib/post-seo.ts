import { SITE_NAME } from "@/lib/seo"

const MAX_SEO_TITLE_LENGTH = 60
const MAX_SEO_DESCRIPTION_LENGTH = 155
const SEO_TITLE_BRAND_LIMIT = 46
const SEO_TITLE_BRAND_SUFFIX = ` | ${SITE_NAME}`
const SEO_DESCRIPTION_EXTENSION_THRESHOLD = 110

type AutoSeoSource = {
  title?: string | null
  excerpt?: string | null
  content?: string | null
}

type ResolveSeoInput = AutoSeoSource & {
  seoTitle?: string | null
  seoDescription?: string | null
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function trimToWordBoundary(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  const sliced = value.slice(0, maxLength + 1)
  const boundaryIndex = sliced.lastIndexOf(" ")
  const trimmed =
    boundaryIndex >= Math.floor(maxLength * 0.6)
      ? sliced.slice(0, boundaryIndex)
      : sliced.slice(0, maxLength)

  return trimmed.replace(/[\s|,:;.!?-]+$/g, "").trim()
}

function stripSiteName(value: string) {
  const escapedSiteName = SITE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return value
    .replace(new RegExp(`\\s*[|\\-–—]\\s*${escapedSiteName}$`, "i"), "")
    .trim()
}

function combineDescription(primary: string, secondary: string) {
  if (!primary) {
    return secondary
  }

  if (!secondary) {
    return primary
  }

  const secondaryProbe = secondary
    .toLowerCase()
    .slice(0, Math.min(48, secondary.length))
  if (secondaryProbe && primary.toLowerCase().includes(secondaryProbe)) {
    return primary
  }

  const separator = /[.!?]$/.test(primary) ? " " : ". "
  return `${primary}${separator}${secondary}`
}

export function buildAutoSeoTitle({ title }: AutoSeoSource) {
  const normalizedTitle = stripSiteName(normalizeText(title))
  if (!normalizedTitle) {
    return ""
  }

  if (normalizedTitle.length <= SEO_TITLE_BRAND_LIMIT) {
    return `${normalizedTitle}${SEO_TITLE_BRAND_SUFFIX}`
  }

  return trimToWordBoundary(normalizedTitle, MAX_SEO_TITLE_LENGTH)
}

export function buildAutoSeoDescription({
  title,
  excerpt,
  content,
}: AutoSeoSource) {
  const normalizedTitle = normalizeText(title)
  const normalizedExcerpt = normalizeText(excerpt)
  const normalizedContent = normalizeText(content)

  let candidate = normalizedExcerpt || normalizedContent || normalizedTitle
  if (!candidate) {
    return ""
  }

  if (
    candidate.length < SEO_DESCRIPTION_EXTENSION_THRESHOLD &&
    normalizedContent
  ) {
    candidate = combineDescription(candidate, normalizedContent)
  }

  return trimToWordBoundary(candidate, MAX_SEO_DESCRIPTION_LENGTH)
}

export function resolvePostSeoInput({
  title,
  excerpt,
  content,
  seoTitle,
  seoDescription,
}: ResolveSeoInput) {
  const manualSeoTitle = normalizeText(seoTitle)
  const manualSeoDescription = normalizeText(seoDescription)
  const autoSeoTitle = buildAutoSeoTitle({ title, excerpt, content })
  const autoSeoDescription = buildAutoSeoDescription({
    title,
    excerpt,
    content,
  })

  return {
    seoTitle: manualSeoTitle || autoSeoTitle || null,
    seoDescription: manualSeoDescription || autoSeoDescription || null,
  }
}
