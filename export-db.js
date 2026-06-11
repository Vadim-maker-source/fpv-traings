const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function viewData() {
  try {
    console.log('🔍 Получение данных из GameRound...\n');
    
    const data = await prisma.gameRound.findMany({
      orderBy: {
        createdAt: 'desc' // Сортируем по дате создания (новые сверху)
      },
      take: 10 // Ограничим вывод 10 последними записями, чтобы не засорять консоль
    });

    if (data.length === 0) {
      console.log('⚠️ Таблица пуста.');
    } else {
      data.forEach((item, index) => {
        console.log(`--- Запись #${index + 1} ---`);
        console.log(`ID: ${item.id}`);
        console.log(`User ID: ${item.userId}`);
        console.log(`Challenge 1: ${item.challenge1}`);
        console.log(`Challenge 2: ${item.challenge2}`);
        console.log(`Challenge 3: ${item.challenge3}`);
        console.log(`Challenge 4: ${item.challenge4}`);
        console.log(`Time: ${item.time}`);
        console.log(`Total Score: ${item.totalScore}`);
        console.log(`Created At: ${item.createdAt}`);
        console.log(''); // Пустая строка для разделения
      });
    }
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

viewData();