import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL || "" }),
})

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const TREE = [
  {
    name: "Sống hay",
    children: ["Chuyện hay", "Tin hot", "Du lịch", "Góc cổ nhân", "Khám phá"],
  },
  {
    name: "Mẹo hay",
    children: ["Mẹo đi chợ", "Mẹo gia đình", "Mẹo nấu ăn", "Mẹo tiết kiệm"],
  },
  {
    name: "Sống khỏe",
    children: ["Khỏe đẹp", "Dưỡng sinh", "Chăm con"],
  },
  {
    name: "Gia đình",
    children: ["Chuyện gia đình", "Mẹ chồng nàng dâu", "Tâm sự"],
  },
  {
    name: "Tử vi",
    children: ["Tử vi con giáp", "Phong thủy", "Tướng số", "Lịch vạn niên", "Trắc nghiệm"],
  },
  {
    name: "Video",
    children: [],
  },
]

async function main() {
  console.log("Starting to sync category tree...")

  let sortOrder = 1;

  for (const mainCat of TREE) {
    const mainSlug = slugify(mainCat.name)
    let parent = await prisma.category.findUnique({ where: { slug: mainSlug } })

    if (parent) {
      parent = await prisma.category.update({
        where: { id: parent.id },
        data: { name: mainCat.name, parentId: null, sortOrder: sortOrder++ },
      })
      console.log(`Updated root category: ${parent.name}`)
    } else {
      parent = await prisma.category.create({
        data: { name: mainCat.name, slug: mainSlug, parentId: null, sortOrder: sortOrder++ },
      })
      console.log(`Created root category: ${parent.name}`)
    }

    // Process children
    for (const childName of mainCat.children) {
      const childSlug = slugify(childName)
      let child = await prisma.category.findUnique({ where: { slug: childSlug } })
      
      if (child) {
        child = await prisma.category.update({
          where: { id: child.id },
          data: { name: childName, parentId: parent.id, sortOrder: sortOrder++ },
        })
        console.log(`  Updated subcategory: ${child.name}`)
      } else {
        child = await prisma.category.create({
          data: { name: childName, slug: childSlug, parentId: parent.id, sortOrder: sortOrder++ },
        })
        console.log(`  Created subcategory: ${child.name}`)
      }
    }
  }

  // Find categories not in the tree
  const allValidSlugs = TREE.flatMap(cat => [slugify(cat.name), ...cat.children.map(slugify)])
  const extraCategories = await prisma.category.findMany({
    where: { slug: { notIn: allValidSlugs } },
    include: { _count: { select: { posts: true } } }
  })

  const defaultCategory = await prisma.category.findFirst({ where: { slug: slugify(TREE[0].name) } })

  for (const extra of extraCategories) {
    if (extra._count.posts > 0 && defaultCategory) {
      console.log(`Reassigning ${extra._count.posts} posts from '${extra.name}' to '${defaultCategory.name}'...`)
      await prisma.post.updateMany({
        where: { categoryId: extra.id },
        data: { categoryId: defaultCategory.id },
      })
    }
    
    await prisma.category.delete({ where: { id: extra.id } })
    console.log(`Deleted extra category: ${extra.name}`)
  }

  console.log("Sync done!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
