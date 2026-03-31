function stripVietnameseAccents(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
}

export function normalizeModerationText(value: string) {
  return stripVietnameseAccents(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function containsForbiddenKeyword(content: string, normalizedTerms: string[]) {
  if (normalizedTerms.length === 0) {
    return false
  }

  const normalizedContent = normalizeModerationText(content)
  if (!normalizedContent) {
    return false
  }

  return normalizedTerms.some((term) => {
    if (!term) {
      return false
    }

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const pattern = new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, "i")
    return pattern.test(normalizedContent)
  })
}
