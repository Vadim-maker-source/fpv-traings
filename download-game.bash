#!/bin/bash
set -e # Останавливаем скрипт при любой ошибке

echo "🚀 Начинаем загрузку билда Unity..."

# 1. Создаем временную папку и переходим в неё
mkdir -p temp_download
cd temp_download

# 2. Скачиваем архив по прямой ссылке
curl -L "https://getfile.dokpub.com/yandex/get/https://disk.yandex.ru/d/IbVjYBpv7FCVDg" -o build.zip

# 3. Проверяем, что файл скачался и не пустой
if [ ! -s build.zip ]; then
    echo "❌ Ошибка: Архив не скачался или поврежден!"
    cd .. && rm -rf temp_download
    exit 1
fi

echo "✅ Архив успешно скачан."

# 4. Возвращаемся в корень проекта
cd ..

# 5. Создаем целевую папку и распаковываем СРАЗУ в неё
# Так как внутри архива нет лишней папки, --strip-components не нужен
mkdir -p public/game
unzip -o temp_download/build.zip -d public/game

# 6. Убираем временные файлы
rm -rf temp_download

echo "✅ Билд успешно установлен в public/game/"
ls -la public/game/