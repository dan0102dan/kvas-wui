# Используем многостадийную сборку для минимизации размера образа
# Первая стадия: сборка зависимостей
FROM sphinxdoc/sphinx as builder

# Устанавливаем переменные окружения
ARG UID
ARG GID
ARG USER
ARG GROUP
ARG APP_NAME

ENV APP_NAME=${APP_NAME}

# Устанавливаем необходимые пакеты для сборки
# Оптимизируем установку пакетов, объединяя команды и удаляя ненужные
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        git \
        make \
        jq \
        fontconfig \
        texlive-latex-recommended \
        texlive-latex-extra \
        texlive-xetex \
        texlive-lang-cyrillic \
        texlive-fonts-recommended \
        fonts-freefont-ttf \
        fonts-liberation && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Создаем пользователя и группу
RUN groupadd -r --gid ${GID} ${GROUP} && \
    useradd -r --uid ${UID} --gid ${GID} -m -d /home/${USER} ${USER}

# Устанавливаем рабочий каталог
WORKDIR /${APP_NAME}/docs

# Устанавливаем зависимости Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копируем и настраиваем entrypoint.sh от имени root
COPY --chown=root:root entrypoint.sh /entrypoint.sh

# Устанавливаем права на скрипт
RUN chmod +x /entrypoint.sh

# Переключаемся на пользователя ${USER}
USER ${USER}

# Устанавливаем точку входа
ENTRYPOINT ["/entrypoint.sh"]
