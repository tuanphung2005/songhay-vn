type JsonLdPrimitive = string | number | boolean | null

type JsonLdValue =
  | JsonLdPrimitive
  | { [key: string]: JsonLdValue }
  | JsonLdValue[]

type JsonLdProps = {
  data: { [key: string]: JsonLdValue } | Array<{ [key: string]: JsonLdValue }>
}

function serializeJsonLd(data: JsonLdProps["data"]) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

export function JsonLd({ data }: JsonLdProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
}