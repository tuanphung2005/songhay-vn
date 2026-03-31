export function isPrismaSchemaMismatchError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false
  }

  const code = (error as { code?: string }).code
  return code === "P2021" || code === "P2022"
}
