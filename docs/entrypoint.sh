#!/bin/bash

set -xe  # Прерываем выполнение при ошибке
DOCS_PATH="/${APP_NAME}/docs"

export GIT_DISCOVERY_ACROSS_FILESYSTEM=1

# Задаём переменную окружения для git для доступа к приватному репозиторию
git config --global --add safe.directory "/${APP_NAME}"

# Переходим в папку репозитория
cd "${DOCS_PATH}" || { echo "Ошибка: папка ${DOCS_PATH} не найдена"; exit 1; }

# # Выполняем сборку
if [ -f "Makefile" ]; then
    make clean
    make html || { echo "Ошибка: не удалось собрать документацию"; exit 1; }
else
    echo "Makefile не найден. Пропускаем сборку."
fi

echo "Сборка завершена!"
echo "-----------------------------------------"

# python3 -m http.server 8000 --directory ${DOCS_PATH}/build/html

# Выполняем запуск sphinx-autobuild 
# с целью автоматического обновления документации
# при изменениях в исходном коде
cd "${DOCS_PATH}" || { echo "Ошибка: папка ${DOCS_PATH} не найдена"; exit 1; }
# make clean 
sphinx-autobuild -a "${DOCS_PATH}/source" "${DOCS_PATH}/build/html" --host 0.0.0.0  \
|| make clean 
