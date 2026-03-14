type UnknownRecord = Record<string, unknown>
type FontConfig = {
  subsets?: string[]
  weight?: string[]
  variable?: string
}

type FontResult = {
  className: string
  style: UnknownRecord
  variable?: string
}

declare module "next" {
  export type Metadata = UnknownRecord
  export namespace MetadataRoute {
    type Robots = UnknownRecord
    type Sitemap = Array<UnknownRecord>
  }
}

declare module "next/link" {
  type LinkProps = {
    href: string
    className?: string
    children?: import("react").ReactNode
    target?: string
    rel?: string
    ariaLabel?: string
  }

  const Link: (props: LinkProps) => import("react").ReactElement
  export default Link
}

declare module "next/image" {
  type ImageProps = {
    src: string
    alt: string
    width: number
    height: number
    className?: string
    loading?: "lazy" | "eager"
    priority?: boolean
  }

  const Image: (props: ImageProps) => import("react").ReactElement
  export default Image
}

declare module "next/navigation" {
  export const notFound: () => never
}

declare module "next/cache" {
  export const revalidatePath: (path: string) => void
}

declare module "next/server" {
  export const NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response
  }
}

declare module "next/font/google" {
  export const Be_Vietnam_Pro: (config: FontConfig) => FontResult
  export const Merriweather: (config: FontConfig) => FontResult
}

declare module "next/types.js" {
  export type ResolvingMetadata = unknown
  export type ResolvingViewport = unknown
}

declare module "next/server.js" {
  export type NextRequest = unknown
}
