const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.updateMany({
      data: { role: 'ADMIN' },
    });
    console.log(`Successfully upgraded ${users.count} users to ADMIN.`);
  } catch (error) {
    console.error('Error upgrading users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
