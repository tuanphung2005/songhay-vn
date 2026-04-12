import { PrismaClient } from "@prisma/client"
import { execSync } from "child_process"
import { promisify } from "util"

const exec = promisify(execSync)
const prisma = new PrismaClient()

export async function setupTestDatabase() {
  console.log("Setting up test database...")
  // Note: in a real environment, this would run against a specific TEST_DATABASE_URL
  // await exec("npx prisma migrate reset --force")
  
  // Seed basic data
  const admin = await prisma.user.upsert({
    where: { email: "test-admin@example.com" },
    update: {},
    create: {
      email: "test-admin@example.com",
      name: "Test Admin",
      passwordHash: "hash",
      role: "ADMIN"
    }
  })

  const category = await prisma.category.upsert({
    where: { slug: "test-category" },
    update: {},
    create: {
      name: "Test Category",
      slug: "test-category",
      sortOrder: 0
    }
  })

  return { admin, category }
}

export async function teardownTestDatabase() {
  console.log("Tearing down test database...")
  // await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User", "Category" CASCADE;`)
  await prisma.$disconnect()
}
