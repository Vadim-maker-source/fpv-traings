#!/bin/bash

echo "🚀 Начинаем загрузку билда Unity..."

# 1. Создаем временную папку для скачивания
mkdir -p temp_download
cd temp_download

# 2. Скачиваем архив
# ВАЖНО: Ссылка должна быть ПРЯМОЙ. Твоя ссылка с dokpub может не сработать на сервере Vercel,
# так как они часто требуют куки или браузерный заголовок.
# Лучше используй прямую ссылку с GitHub Releases!
FILE_NAME="WebGL build.zip"

curl -L "https://getfile.dokpub.com/yandex/get/https://disk.yandex.ru/d/zbCuBiCEfri_ZQ" -o "$FILE_NAME"

if [ ! -f "$FILE_NAME" ]; then
    echo "❌ Ошибка: Не удалось скачать архив!"
    cd ..
    rm -rf temp_download
    exit 1
fi

echo "✅ Архив скачан. Размер: $(du -h $FILE_NAME | cut -f1)"

# 3. Возвращаемся в корень проекта
cd ..

# 4. Создаем целевую папку
mkdir -p public/game

echo "📂 Распаковываем архив..."

# 5. Распаковываем
# Кавычки вокруг имени файла ОБЯЗАТЕЛЬНЫ из-за пробела
unzip -o "temp_download/$FILE_NAME" -d public/game --strip-components=1

# 6. Убираем временные файлы
rm -rf temp_download

echo "✅ Билд успешно установлен в public/game/"
ls public/game