export function resolveAspectRatio(ratio: string | undefined): string {
  switch (ratio) {
    case "video":
      return "aspect-video"
    case "square":
      return "aspect-square"
    case "3/2":
      return "aspect-[3/2]"
    case "12/7":
      return "aspect-[12/7]"
    case "portrait":
      return "aspect-[3/4]"
    default:
      return "aspect-[12/7]" // Default to news thumbnail ratio
  }
}
