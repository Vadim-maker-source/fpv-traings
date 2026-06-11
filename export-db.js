const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  const tables = ['User', 'Lesson', 'GameRound', 'Support'];
  const output = [];

  for (const table of tables) {
    const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${table}"`);
    if (data.length > 0) {
      output.push(`-- Data for ${table}`);
      for (const row of data) {
        const values = Object.values(row).map(v => 
          v === null ? 'NULL' : 
          typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : 
          v instanceof Date ? `'${v.toISOString()}'` : v
        );
        const keys = Object.keys(row).join(', ');
        output.push(`INSERT INTO "${table}" (${keys}) VALUES (${values.join(', ')});`);
      }
    }
  }

  fs.writeFileSync('dump.sql', output.join('\n'));
  console.log('✅ Dump saved to dump.sql');
  await prisma.$disconnect();
}

exportData().catch(console.error);