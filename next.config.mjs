/** @type {import('next').NextConfig} */
const nextConfig = {
  serverActions: {
    // Media uploads are handled by a Server Action in /admin, so raise the default 1MB limit.
    bodySizeLimit: "250mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
}

export default nextConfig
