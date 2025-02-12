#!/bin/sh

SERVICE_NAME="kvas-wui"
KVAS_DIR="/opt/etc/$SERVICE_NAME"

# Функция для вывода сообщения в рамке с очисткой экрана
print_message() {
    PURPLE="\033[1;35m"
    NC="\033[0m"
    
    clean_msg=$(echo -e "$1" | sed -E "s/\\\033\[[0-9;]*m//g")
    width=$((${#clean_msg} + 6))
    top=$(printf '╭%.0s─' $(seq 1 $width)) 
    bottom=$(printf '╰%.0s─' $(seq 1 $width))
    
    echo -e "\n${PURPLE}$top╮${NC}"
    echo -e "${PURPLE}│ ➤  $1${NC}"
    echo -e "${PURPLE}$bottom╯${NC}"
}

# Обновление пакетов и установка git-http и curl
print_message "Обновление пакетов, пожалуйста подождите"
opkg update
opkg install git-http curl

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

# Создание целевой директории и перенос файлов
print_message "Создание $KVAS_DIR"
rm -rf "$KVAS_DIR"; mkdir "$KVAS_DIR"

# Загрузка бинарного файла Go-сервера
BINARY_PATH="$KVAS_DIR/$FILE_NAME"
print_message "Загрузка бинарного файла Go-сервера для $ARCHITECTURE"
curl -L "https://github.com/dan0102dan/kvas-wui/releases/latest/download/$FILE_NAME" -o "$BINARY_PATH"
chmod +x "$BINARY_PATH"
sleep 1

# Завершение процессов на портах
print_message "Завершение процессов на портах 5000/3000"
kill -9 $(netstat -tulpn | grep -E ':5000|:3000' | awk '{print $7}' | cut -d'/' -f1) 2>/dev/null || true
sleep 1

# Клонирование и обработка build
git clone --depth 1 --branch gh-pages https://github.com/dan0102dan/kvas-wui.git "$KVAS_DIR/build"
find "$KVAS_DIR/build" -type f ! -path "/static/*" -exec sed -i'' -e 's|/kvas-wui|./|g' {} +

# Настройка автозапуска
print_message "Настройка автозапуска программы"

# Конфигурация сервиса
INIT_SCRIPT="/opt/etc/init.d/S99$SERVICE_NAME"

cat << EOF > "$INIT_SCRIPT"
#!/bin/sh

ENABLED=yes
PROCS="$BINARY_PATH"
ARGS=""
PREARGS=""
DESC="Kvas Web UI Service"

. /opt/etc/init.d/rc.func
EOF

chmod +x "$INIT_SCRIPT"
sleep 1

# Запуск сервиса
print_message "Запуск $SERVICE_NAME..."
"$INIT_SCRIPT" start
echo "Проверка статуса: $INIT_SCRIPT status"
echo "Логи: tail -f /var/log/messages | grep $SERVICE_NAME"
sleep 1