# Используем официальный образ Python
FROM python:3.9-slim AS build-env

ENV GIT_DISCOVERY_ACROSS_FILESYSTEM=1
ARG UID GID USER GROUP
ENV USER=${USER}
ENV GROUP=${GROUP}
ENV UID=${UID}
ENV GID=${GID}

# Устанавливаем рабочий каталог
WORKDIR /app/docs

# Устанавливаем необходимые пакеты для сборки
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        make \
        jq \
        latexmk \
        texlive-latex-base \
        texlive-latex-extra \
        texlive-xetex \
        texlive-lang-cyrillic \
        fonts-liberation && \
    rm -rf /var/lib/apt/lists/*

# Создаем пользователя и группу
RUN groupadd -r --gid ${GID} ${GROUP} && \
    useradd -r --uid ${UID} --gid ${GID} -m -d /home/${USER} ${USER}

# Копируем и устанавливаем зависимости Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Устанавливаем переменные окружения
ARG GIT_TOKEN GIT_REPO
ENV GIT_TOKEN=${GIT_TOKEN}
ENV GIT_REPO=${GIT_REPO}

# Устанавливаем токен для доступа к приватному репозиторию
RUN git config --global url."https://${GIT_TOKEN}@github.com".insteadOf "https://github.com" 

# Копируем исходный код проекта
COPY . .

# Копируем и настраиваем entrypoint.sh от имени root
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
    && mkdir -p /repo && chown -R ${UID}:${GID} /app \
    && chown -R ${UID}:${GID} /repo 

# Переключаемся на пользователя ${USER}
USER ${USER}

# Устанавливаем точку входа
ENTRYPOINT ["/entrypoint.sh"]