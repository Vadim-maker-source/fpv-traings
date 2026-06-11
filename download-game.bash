#!/bin/bash

echo "🚀 Начинаем загрузку билда Unity..."

# 1. Создаем временную папку
mkdir -p temp_download
cd temp_download

# 2. Скачиваем архив
# ВАЖНО: Используем кавычки для имени файла из-за пробела!
FILE_NAME="WebGL build.zip"

curl -L "https://getfile.dokpub.com/yandex/get/https://disk.yandex.ru/d/zbCuBiCEfri_ZQ" -o "$FILE_NAME"

if [ ! -f "$FILE_NAME" ]; then
    echo "❌ Ошибка: Не удалось скачать архив!"
    cd ..
    rm -rf temp_download
    exit 1
fi

echo "✅ Архив скачан."

# 3. Возвращаемся в корень
cd ..

# 4. Очищаем старую папку игры, если она есть
rm -rf public/game
mkdir -p public/game

echo "📂 Распаковываем архив..."

# 5. Распаковываем
# Стандартный unzip на Vercel не знает про --strip-components.
# Мы распаковываем во временную папку внутри public, а потом переносим файлы.
unzip -o "temp_download/$FILE_NAME" -d public/temp_extract

# Проверяем, создалась ли лишняя папка-обертка (например, public/temp_extract/MyGame/)
# Если да, то переносим содержимое этой папки на уровень выше
FIRST_DIR=$(ls public/temp_extract | head -n 1)

if [ -d "public/temp_extract/$FIRST_DIR" ]; then
    echo "⚠️ Обнаружена лишняя папка-обертка: $FIRST_DIR. Переносим содержимое..."
    mv public/temp_extract/$FIRST_DIR/* public/game/
else
    # Если обертки нет, просто переносим всё
    mv public/temp_extract/* public/game/
fi

# 6. Убираем мусор
rm -rf public/temp_extract
rm -rf temp_download

echo "✅ Билд успешно установлен в public/game/"
ls public/game