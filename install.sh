#!/bin/sh

SERVICE_NAME="kvas-wui"
KVAS_DIR="/opt/etc/$SERVICE_NAME"

# Функция для вывода сообщения в рамке с очисткой экрана
print_message() {
    PURPLE="\033[1;35m"
    NC="\033[0m"
    
    clean_msg=$(echo -e "$1" | sed -E "s/\\\033\[[0-9;]*m//g")
    msg_length=${#clean_msg}
    
    border=$(printf '%0.s─' $(seq 1 $((msg_length + 7))))
    
    echo -e "\n${PURPLE}╭${border}╮${NC}"
    echo -e "${PURPLE}│  ➤  $1  ${PURPLE}│${NC}"
    echo -e "${PURPLE}╰${border}╯${NC}"
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

print_message "Завершение процессов на портах 3000/5000" 
INIT_SCRIPT="/opt/etc/init.d/S99$SERVICE_NAME"
if [ -x "$INIT_SCRIPT" ]; then
    "$INIT_SCRIPT" stop || true
    sleep 1
fi
pids=$(netstat -tulpn | grep -E ':3000|:5000' | awk '{print $7}' | cut -d'/' -f1)
if [ -n "$pids" ]; then
    kill -9 $pids 2>/dev/null
fi
sleep 1

print_message "Создание $KVAS_DIR"
rm -rf "$KVAS_DIR"; mkdir "$KVAS_DIR"

# Загрузка бинарного файла Go-сервера
BINARY_PATH="$KVAS_DIR/$FILE_NAME"
print_message "Загрузка бинарного файла Go-сервера для $ARCHITECTURE"
curl -L "https://github.com/dan0102dan/kvas-wui/releases/latest/download/$FILE_NAME" -o "$BINARY_PATH"
chmod +x "$BINARY_PATH"
sleep 1

print_message "Загрузка файлов веб-интерфейса"
mkdir -p "$KVAS_DIR/build"
curl -sSL "https://github.com/dan0102dan/kvas-wui/releases/latest/download/build.tar.gz" | \
  tar xz -C "$KVAS_DIR/build"

# Настройка автозапуска
print_message "Настройка автозапуска программы"

# Конфигурация сервиса
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
"$INIT_SCRIPT" restart
echo "Проверка статуса: $INIT_SCRIPT status"
echo "Логи: tail -f /opt/etc/kvas-wui/app.log"
sleep 1