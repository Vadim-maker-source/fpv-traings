#!/bin/bash

echo "🚀 Начинаем загрузку билда Unity..."

# 1. Создаем временную папку для скачивания, чтобы не мусорить в корне
mkdir -p temp_download
cd temp_download

# 2. Скачиваем архив (ЗАМЕНИ ССЫЛКУ НА СВОЮ!)
curl -L "https://getfile.dokpub.com/yandex/get/https://disk.yandex.ru/d/zbCuBiCEfri_ZQ" -o WebGL build.zip

if [ ! -f WebGL build.zip ]; then
    echo "❌ Ошибка: Не удалось скачать архив!"
    cd ..
    rm -rf temp_download
    exit 1
fi

echo "✅ Архив скачан. Подготовка папки назначения..."

# 3. Возвращаемся в корень проекта
cd ..

# 4. Создаем целевую папку (если её нет)
mkdir -p public/game

echo "📂 Распаковываем архив с пропуском первой папки..."

# 5. ГЛАВНОЕ: --strip-components=1
# Это говорит unzip'у: "Не создавай верхнюю папку из архива, клади содержимое сразу сюда"
unzip -o temp_download/WebGL build.zip -d public/game --strip-components=1

# 6. Убираем временные файлы
rm -rf temp_download

echo "✅ Билд успешно установлен в public/game/"