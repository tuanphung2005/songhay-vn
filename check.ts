import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.mediaAsset.count()
  console.log("Total:", count)
  
  const assets = await prisma.mediaAsset.findMany({
    take: 5,
    select: {
      id: true,
      assetType: true,
      visibility: true,
      uploaderId: true,
    }
  })
  console.log(assets)
}

main().catch(console.error).finally(() => prisma.$disconnect())
