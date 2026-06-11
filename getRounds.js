const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  const tables = ['GameRound'];

  for (const table of tables) {
    const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${table}"`);
  }
  await prisma.$disconnect();
}

exportData().catch(console.error);