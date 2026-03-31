export function normalizeKeyword(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, " ")
}

export function toKeywordLabel(raw: string) {
  return raw.trim().replace(/\s+/g, " ")
}

export function parseSeoKeywordInput(raw: string) {
  const parts = raw
    .split(/[\n,;|]/g)
    .map((part) => toKeywordLabel(part))
    .filter(Boolean)

  const deduped = new Map<string, string>()

  for (const keyword of parts) {
    const normalized = normalizeKeyword(keyword)
    if (!normalized) {
      continue
    }

    if (!deduped.has(normalized)) {
      deduped.set(normalized, keyword)
    }
  }

  return [...deduped.values()]
}

export function splitLegacySeoKeywords(raw: string | null | undefined) {
  if (!raw) {
    return []
  }

  return parseSeoKeywordInput(raw)
}
