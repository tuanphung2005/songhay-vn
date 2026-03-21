import { PrismaClient } from "@prisma/client"
import { slugify } from "./lib/slug"

const prisma = new PrismaClient()

async function resetAndSeed() {
  const S_HAY = "song hay"
  const M_HAY = "mẹo hay"
  const S_KHOE = "sống khỏe"
  const G_DINH = "gia đình"
  const T_VI = "tử vi"

  const defaultSubcategories: Record<string, string[]> = {
    [S_HAY]: ["chuyện hay", "tin hot", "du lịch", "góc cổ nhân", "khám phá"],
    [M_HAY]: ["mẹo đi chợ", "mẹo gia đình", "mẹo nấu ăn", "mẹo tiết kiệm"],
    [S_KHOE]: ["khỏe đẹp", "dưỡng sinh", "chăm con"],
    [G_DINH]: ["chuyện gia đình", "mẹ chồng nàng dâu", "tâm sự"],
    [T_VI]: ["tử vi con giáp", "phong thủy", "tướng số", "lịch vạn niên", "trắc nghiệm"],
  }

  for (const [parentName, subList] of Object.entries(defaultSubcategories)) {
    const parent = await prisma.category.findFirst({
      where: { name: { contains: parentName, mode: "insensitive" }, parentId: null }
    })
    
    if (parent) {
      console.log(`Found parent: ${parent.name} (${parent.id})`)
      for (const subName of subList) {
        const slug = slugify(subName)
        const existing = await prisma.category.findUnique({ where: { slug } })
        if (!existing) {
          await prisma.category.create({
            data: {
              name: subName,
              slug,
              parentId: parent.id,
              sortOrder: parent.sortOrder * 10,
            }
          })
          console.log(`Created subcategory: ${subName}`)
        } else {
          // If exists but no parent, update it
          if (!existing.parentId) {
            await prisma.category.update({
              where: { id: existing.id },
              data: { parentId: parent.id }
            })
            console.log(`Assigned existing category ${subName} to parent`)
          } else {
            console.log(`Subcategory ${subName} already exists and assigned.`)
          }
        }
      }
    } else {
      console.warn(`Could not find parent category matching ${parentName}`)
    }
  }

  console.log("Seeding done!")
  await prisma.$disconnect()
}

resetAndSeed().catch(e => {
  console.error(e)
  process.exit(1)
})
