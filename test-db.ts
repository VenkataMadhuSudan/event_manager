import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING DATABASE READINESS CHECKS ---')
  const startTime = Date.now()

  try {
    // 1. Connection & Latency test
    await prisma.$queryRaw`SELECT 1 as connected;`
    console.log(`[PASS] Raw query connection OK (${Date.now() - startTime}ms)`)

    // 2. Table count tests (Read capability)
    const [adminCount, userCount, eventCount, studentCount, settingsCount] = await Promise.all([
      prisma.admin.count(),
      prisma.user.count(),
      prisma.event.count(),
      prisma.student.count(),
      prisma.systemSetting.count(),
    ])

    console.log('[PASS] Schema Tables Read OK:')
    console.log(`       - Admins: ${adminCount}`)
    console.log(`       - Users: ${userCount}`)
    console.log(`       - Events: ${eventCount}`)
    console.log(`       - Students (Registrations): ${studentCount}`)
    console.log(`       - System Settings: ${settingsCount}`)

    // 3. Write / Input test (Create, Read back, Update, Delete)
    const testKey = `__health_check_${Date.now()}`
    const testValue = 'active_and_ready'

    console.log('\n--- TESTING INPUT / WRITE CAPABILITY ---')
    // Insert
    const created = await prisma.systemSetting.create({
      data: {
        key: testKey,
        value: testValue,
      },
    })
    console.log(`[PASS] Record created successfully: id=${created.id}, key=${created.key}`)

    // Verify Read
    const fetched = await prisma.systemSetting.findUnique({
      where: { key: testKey },
    })
    if (!fetched || fetched.value !== testValue) {
      throw new Error('Read-after-write verification failed!')
    }
    console.log('[PASS] Read-after-write verified.')

    // Update
    const updated = await prisma.systemSetting.update({
      where: { key: testKey },
      data: { value: 'updated_successfully' },
    })
    console.log(`[PASS] Record updated successfully: value=${updated.value}`)

    // Delete (cleanup)
    await prisma.systemSetting.delete({
      where: { key: testKey },
    })
    console.log('[PASS] Record deleted (cleaned up) successfully.')

    console.log('\n======================================================')
    console.log(' DATABASE STATUS: ACTIVE AND READY FOR INPUTS')
    console.log(' Total check elapsed time:', Date.now() - startTime, 'ms')
    console.log('======================================================')
  } catch (e) {
    console.error('\n[FAIL] Database check failed:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

