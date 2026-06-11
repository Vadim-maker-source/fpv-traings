# 4. РАСПАКОВКА И ПЕРЕМЕЩЕНИЕ (ИСПРАВЛЕНИЕ ПРОБЕЛОВ)
echo "📂 Распаковываем архив..."

# Распаковываем во временную папку
unzip -o "temp_download/$FILE_NAME" -d public/temp_extract

# Проверяем, что распаковка прошла успешно
if [ ! -d "public/temp_extract" ]; then
    echo "❌ Ошибка: Папка temp_extract не создана!"
    rm -rf temp_download public/temp_extract
    exit 1
fi

# Находим первую папку внутри архива (с кавычками для пробелов!)
FIRST_DIR=$(ls -A public/temp_extract | head -n 1)

if [ -z "$FIRST_DIR" ]; then
    echo "❌ Ошибка: Архив пуст или структура неверна!"
    rm -rf temp_download public/temp_extract
    exit 1
fi

echo "⚠️ Обнаружена папка-обертка: '$FIRST_DIR'. Переносим содержимое..."

# Создаем целевую папку
mkdir -p public/game

# Перемещаем ВСЁ содержимое (включая скрытые файлы) с правильными кавычками
mv "public/temp_extract/$FIRST_DIR/"* public/game/
mv "public/temp_extract/$FIRST_DIR/".[!.]* public/game/ 2>/dev/null || true

# Удаляем временные папки
rm -rf temp_download public/temp_extract

echo "✅ Билд успешно установлен в public/game/"
ls -la public/game/