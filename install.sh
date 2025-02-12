#!/bin/sh

# Функция для вывода сообщения в рамке с очисткой экрана
print_message() {
    clear
    echo "╔══════════════════════════════════════════════╗"
    printf "║  %s\n" "$1"
    echo "╚══════════════════════════════════════════════╝"
    sleep 1
}

# Обновление пакетов и установка git-http и curl
print_message "Обновление пакетов, пожалуйста подождите"
opkg update > /dev/null 2>&1
opkg install git-http curl > /dev/null 2>&1

# Определение архитектуры системы
print_message "Определение архитектуры системы"
ARCHITECTURE=$(opkg print-architecture | tail -n 1 | cut -d ' ' -f 2 | cut -d '-' -f 1)
case "$ARCHITECTURE" in
    aarch64)
        FILE_NAME="api-arm64"
        ;;
    mipsel)
        FILE_NAME="api-mipsel"
        ;;
    mips)
        FILE_NAME="api-mips"
        ;;
    *)
        echo "Unsupported architecture: $ARCHITECTURE"
        exit 1
        ;;
esac
echo "Определена архитектура: $ARCHITECTURE"
sleep 1

# Загрузка бинарного файла Go-сервера для нужной архитектуры
print_message "Загрузка бинарного файла Go-сервера для $ARCHITECTURE"
rm -rf "./$FILE_NAME" > /dev/null 2>&1
curl -L -s "https://github.com/dan0102dan/kvas-wui/releases/latest/download/$FILE_NAME" -o "./$FILE_NAME"
chmod +x "./$FILE_NAME"
echo "Downloaded $FILE_NAME for architecture $ARCHITECTURE"
sleep 1

# Завершение процессов, занимающих порты 5000 или 3000
print_message "Завершение процессов на портах 5000/3000"
kill -9 $(netstat -tulpn | grep -E ':5000|:3000' | awk '{print $7}' | cut -d'/' -f1) 2>/dev/null || true
echo "Процессы на портах 5000/3000 завершены"
sleep 1

# Клонирование содержимого ветки gh-pages в папку build
print_message "Клонирование содержимого ветки gh-pages в папку 'build'"
rm -rf ./build > /dev/null 2>&1
git clone --depth 1 --branch gh-pages https://github.com/dan0102dan/kvas-wui.git ./build > /dev/null 2>&1
echo "GitHub Pages content успешно склонирован в ./build"
sleep 1

# Замена всех путей /kvas-wui на ./
find ./build -type f -exec sed -i 's|/kvas-wui|./|g' {} \;
echo "Пути заменены в каталоге ./build"
sleep 1
