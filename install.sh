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

print_message "Обновление списка пакетов. Пожалуйста, подождите..."
if opkg update; then
    echo "Обновление пакетов завершено успешно."
else
    echo "Ошибка: не удалось обновить пакеты!" && exit 1
fi

print_message "Установка необходимых утилит: git-http и curl"
if opkg install git-http curl; then
    echo "Установка git-http и curl завершена успешно."
else
    echo "Ошибка: не удалось установить git-http и/или curl!" && exit 1
fi

print_message "Определение архитектуры системы..."
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
        echo "Ошибка: Unsupported architecture: $ARCHITECTURE" && exit 1
        ;;
esac
echo "Определена архитектура: $ARCHITECTURE"
echo "Будет использован бинарный файл: $FILE_NAME"
sleep 1

print_message "Завершение процессов, занимающих порты 3000/5000"
INIT_SCRIPT="/opt/etc/init.d/S99$SERVICE_NAME"
if [ -x "$INIT_SCRIPT" ]; then
    echo "Останавливаем ранее запущенный сервис $SERVICE_NAME..."
    "$INIT_SCRIPT" stop || true
    sleep 1
fi

pids=$(netstat -tulpn | grep -E ':3000|:5000' | awk '{print $7}' | cut -d'/' -f1)
if [ -n "$pids" ]; then
    echo "Обнаружены процессы на портах 3000/5000. PID(ы): $pids"
    if kill -9 $pids 2>/dev/null; then
        echo "Процессы успешно завершены."
    else
        echo "Не удалось завершить некоторые процессы."
    fi
else
    echo "Активных процессов на портах 3000/5000 не обнаружено."
fi
sleep 1

print_message "Подготовка каталога установки: $KVAS_DIR"
if [ -d "$KVAS_DIR" ]; then
    echo "Обнаружена предыдущая установка. Удаляем каталог $KVAS_DIR..."
    rm -rf "$KVAS_DIR"
fi

if mkdir "$KVAS_DIR"; then
    echo "Каталог $KVAS_DIR успешно создан."
else
    echo "Ошибка: не удалось создать каталог $KVAS_DIR!" && exit 1
fi

BINARY_PATH="$KVAS_DIR/$FILE_NAME"
print_message "Скачивание бинарного файла Go-сервера для архитектуры $ARCHITECTURE"
if curl -L "https://github.com/dan0102dan/kvas-wui/releases/latest/download/$FILE_NAME" -o "$BINARY_PATH"; then
    echo "Бинарный файл успешно загружен: $BINARY_PATH"
else
    echo "Ошибка загрузки бинарного файла!" && exit 1
fi

if chmod +x "$BINARY_PATH"; then
    echo "Права на выполнение установлены для $BINARY_PATH"
else
    echo "Ошибка: не удалось установить права на выполнение для $BINARY_PATH" && exit 1
fi
sleep 1

print_message "Скачивание и распаковка файлов веб-интерфейса"
mkdir -p "$KVAS_DIR/build"
if curl -sSL "https://github.com/dan0102dan/kvas-wui/releases/latest/download/build.tar.gz" | tar xz -C "$KVAS_DIR/build"; then
    echo "Файлы веб-интерфейса успешно загружены и распакованы в $KVAS_DIR/build"
else
    echo "Ошибка: не удалось загрузить или распаковать файлы веб-интерфейса!" && exit 1
fi
sleep 1

print_message "Настройка автозапуска для $SERVICE_NAME"
cat << EOF > "$INIT_SCRIPT"
#!/bin/sh

ENABLED=yes
PROCS="$BINARY_PATH"
ARGS=""
PREARGS=""
DESC="Kvas Web UI Service"

. /opt/etc/init.d/rc.func
EOF

if chmod +x "$INIT_SCRIPT"; then
    echo "Сервисный скрипт $INIT_SCRIPT создан и получены права на выполнение."
else
    echo "Ошибка: не удалось установить права на выполнение для $INIT_SCRIPT" && exit 1
fi
sleep 1

print_message "Запуск и перезапуск сервиса $SERVICE_NAME"
if "$INIT_SCRIPT" restart; then
    echo "$SERVICE_NAME успешно запущен."
else
    echo "Ошибка: не удалось запустить $SERVICE_NAME!" && exit 1
fi

echo "Для проверки статуса сервиса выполните: $INIT_SCRIPT status"
echo "Для просмотра логов сервиса используйте: tail -f /var/log/kvas-wui/app.log"
sleep 1
