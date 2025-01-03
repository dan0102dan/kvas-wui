#!/bin/bash

set -e  # Прерываем выполнение при ошибке
DOCS_PATH=/app/docs
GIT_PATH=/repo

# Проверяем, что переменные окружения заданы
if [ -z "${GIT_REPO}" ] || [ -z "${GIT_TOKEN}" ]; then
    echo "Ошибка: GIT_REPO или GIT_TOKEN не заданы."
    echo "GIT_REPO: ${GIT_REPO}"
    echo "GIT_TOKEN: ${GIT_TOKEN}"
    exit 1
fi

# Настраиваем токен для доступа к приватному репозиторию
git config --global url."https://${GIT_TOKEN}@github.com".insteadOf "https://github.com"

# Клонируем репозиторий, если его еще нет
# if [ -d "${GIT_PATH}/.git" ]; then
    # rm -rf ${GIT_PATH}
    # echo "Клонирование репозитория..."
    # mkdir -p ${GIT_PATH}
    # git clone "${GIT_REPO}" ${GIT_PATH} || { echo "Ошибка: не удалось клонировать репозиторий"; exit 1; }
# else
#     echo "Репозиторий уже существует. Пропускаем клонирование."
# fi

# Переходим в папку репозитория
cd ${GIT_PATH} || { echo "Ошибка: папка ${GIT_PATH} не найдена"; exit 1; }


# Обновляем репозиторий
# echo "Обновление репозитория..."
# git fetch --all --tags || { echo "Ошибка: не удалось обновить репозиторий"; exit 1; }

echo "Текущий каталог: $(pwd)"
echo "Содержимое каталога:"
ls -la ./.git
echo "Список тегов:"
git tag -l

# Получаем список всех тегов
TAGS=$(git tag -l --sort=-creatordate)
if [ -z "$TAGS" ]; then
    echo "Нет доступных тегов для сборки. TAGS=$TAGS"
    exit 0
fi

# Переходим в директорию с документацией
cd ${DOCS_PATH} || { echo "Ошибка: папка ${DOCS_PATH} не найдена"; exit 1; }

# Очищаем предыдущую сборку (если Makefile существует)
if [ -f "Makefile" ]; then
    echo "Очистка предыдущей сборки..."
    make clean || echo "Предупреждение: не удалось выполнить make clean"
else
    echo "Makefile не найден. Пропускаем очистку."
fi

# Переходим в папку репозитория
cd ${GIT_PATH} || { echo "Ошибка: папка ${GIT_PATH} не найдена"; exit 1; }

# Для каждого тега создаем ветку и собираем документацию
for TAG in $TAGS; do

    echo "Сборка версии $TAG..."
    git checkout tags/$TAG || { echo "Ошибка: не удалось переключиться на тег $TAG"; exit 1; }
    
    # Выполняем сборку
    if [ -f "Makefile" ]; then
        make all || { echo "Ошибка: не удалось собрать документацию для версии $TAG"; exit 1; }
    else
        echo "Makefile не найден. Пропускаем сборку для версии $TAG."
    fi

    # Возвращаемся на ветку master/main
    git checkout master || git checkout main || { echo "Ошибка: не удалось переключиться на master/main"; exit 1; }
done

# Переходим в папку репозитория
cd ${DOCS_PATH} || { echo "Ошибка: папка ${DOCS_PATH} не найдена"; exit 1; }

# Очистка временных файлов
if [ -f "Makefile" ]; then
    echo "Очистка временных файлов..."
    make clean || echo "Предупреждение: не удалось выполнить make clean"
    rm -rf ${GIT_PATH}
else
    echo "Makefile не найден. Пропускаем очистку."
fi

echo "Сборка завершена!"