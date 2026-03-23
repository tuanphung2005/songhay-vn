export function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
  const validPages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b)

  const withGaps: Array<number | "ellipsis"> = []
  for (let index = 0; index < validPages.length; index += 1) {
    const page = validPages[index]
    const previous = validPages[index - 1]

    if (typeof previous === "number" && page - previous > 1) {
      withGaps.push("ellipsis")
    }

    withGaps.push(page)
  }

  return withGaps
}

export function startOfDay(value: Date) {
  const result = new Date(value)
  result.setHours(0, 0, 0, 0)
  return result
}

export function endOfDay(value: Date) {
  const result = new Date(value)
  result.setHours(23, 59, 59, 999)
  return result
}

export function parseDateInput(value: string | null | undefined) {
  if (!value || value.trim().length === 0) {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed
}

export function toDayKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function toDayLabel(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(value)
}

export function sortCategoriesByTree<T extends { id: string; parentId: string | null }>(categories: T[]) {
  const roots = categories.filter((category) => !category.parentId)
  const sorted: T[] = []

  for (const root of roots) {
    sorted.push(root)
    sorted.push(...categories.filter((category) => category.parentId === root.id))
  }

  return sorted
}
