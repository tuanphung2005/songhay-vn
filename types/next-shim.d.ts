type UnknownRecord = Record<string, unknown>

declare module "next" {
  export type Metadata = UnknownRecord
  export namespace MetadataRoute {
    type Robots = UnknownRecord
    type Sitemap = Array<UnknownRecord>
  }
}

declare module "next/link" {
  const Link: unknown
  export default Link
}

declare module "next/image" {
  const Image: unknown
  export default Image
}

declare module "next/navigation" {
  export const notFound: () => never
}

declare module "next/cache" {
  export const revalidatePath: (path: string) => void
}

declare module "next/server" {
  export const NextResponse: unknown
}

declare module "next/font/google" {
  export const Be_Vietnam_Pro: unknown
  export const Merriweather: unknown
}

declare module "next/types.js" {
  export type ResolvingMetadata = unknown
  export type ResolvingViewport = unknown
}

declare module "next/server.js" {
  export type NextRequest = unknown
}
