export function normalizeArticleHtml(rawHtml: string) {
  return rawHtml
    .replace(/<span([^>]*)style="([^"]*)"([^>]*)>([\s\S]*?)<\/span>/gi, (match, before, styleValue, after, content) => {
      const hasUnderline = /text-decoration\s*:\s*underline/i.test(styleValue)
      const hasStrikethrough = /text-decoration\s*:\s*line-through/i.test(styleValue)
      const hasOtherStyles = styleValue.split(";").map((s: string) => s.trim()).filter((s: string) => s && !s.toLowerCase().startsWith("text-decoration")).length > 0

      if (hasOtherStyles) {
        let inner = String(content)
        if (hasUnderline) inner = `<u>${inner}</u>`
        if (hasStrikethrough) inner = `<s>${inner}</s>`
        return `<span${before}style="${styleValue}"${after}>${inner}</span>`
      }

      let result = String(content)
      if (hasUnderline) result = `<u>${result}</u>`
      if (hasStrikethrough) result = `<s>${result}</s>`
      return result
    })
    .replace(/\sstyle="([^"]*)"/gi, (_match, styleValue) => {
      const rules = String(styleValue)
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean)

      const keptRules: string[] = []

      for (const rule of rules) {
        const [rawProperty, rawValue] = rule.split(":")
        const property = rawProperty?.trim().toLowerCase()
        const value = rawValue?.trim().toLowerCase()

        if (!property || !value) {
          continue
        }

        if (property === "text-align" && ["left", "right", "center", "justify"].includes(value)) {
          keptRules.push(`text-align:${value}`)
        }

        if (property === "float" && ["left", "right", "none"].includes(value)) {
          keptRules.push(`float:${value}`)
        }

        if (property === "color" && /^#[0-9a-f]{3,8}$|^rgb\([\d\s,.%]+\)$|^rgba\([\d\s,.%]+\)$|^[a-z-]+$/i.test(value)) {
          keptRules.push(`color:${value}`)
        }

        if (
          property === "background-color" &&
          /^#[0-9a-f]{3,8}$|^rgb\([\d\s,.%]+\)$|^rgba\([\d\s,.%]+\)$|^[a-z-]+$/i.test(value)
        ) {
          keptRules.push(`background-color:${value}`)
        }

        if (property === "font-size" && /^(\d+(\.\d+)?(px|em|rem|%)|small|medium|large|x-large|xx-large)$/i.test(value)) {
          keptRules.push(`font-size:${value}`)
        }

        if (property === "font-family" && /^[a-z0-9\s\-,'\"]+$/i.test(value)) {
          keptRules.push(`font-family:${value}`)
        }

        if (property === "text-decoration" && /^(underline|line-through|none)$/i.test(value)) {
          keptRules.push(`text-decoration:${value}`)
        }

        if (
          ["width", "max-width", "height"].includes(property) &&
          /^(auto|\d+(\.\d+)?(px|%))$/i.test(value)
        ) {
          keptRules.push(`${property}:${value}`)
        }
      }

      return keptRules.length ? ` style="${keptRules.join(";")}"` : ""
    })
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?\s*>)*<\/p>/gi, "")
    .trim()
}
