import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const adminCount = await prisma.admin.count()
    console.log('Admin count:', adminCount)
  } catch (e) {
    console.error('Prisma Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
