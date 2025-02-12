## ⚡️ Быстрая установка

Для автоматической установки выполните следующую команду в консоли роутера:

```bash
curl -fsSL https://raw.githubusercontent.com/dan0102dan/kvas-wui/main/install.sh | sh
```

---

## 📋 Требования

### Фронтенд (React)
- **Node.js**: версия **20 или выше**  
  👉 [Скачать Node.js](https://nodejs.org/)
- **npm**: устанавливается вместе с Node.js

### Сервер (Go)
- **Go**: версия **1.23 или выше**  
  👉 [Скачать Go](https://golang.org/dl/)

---

## 🛠️ Установка и сборка

### 1. Клонирование репозитория

```bash
git clone https://github.com/dan0102dan/kvas-wui
cd kvas-wui
```

---

### 2. Сборка фронтенд‑приложения (React)

1. **Установка зависимостей:**

   ```bash
   npm install
   ```

2. **Сборка для продакшена:**

   ```bash
   npm run build
   ```
   
   Результат сборки будет находиться в папке `build`.

---

### 3. Сборка Go‑сервера

Перейдите в каталог с исходным кодом сервера
```bash
cd server
```

#### Локальная сборка для текущей архитектуры

```bash
go build -o api
```

#### Сборка для различных архитектур

- **Для MIPS Little Endian (mipsel):**

  ```bash
  GOOS=linux GOARCH=mipsle go build -o api-mipsel
  ```

- **Для MIPS:**

  ```bash
  GOOS=linux GOARCH=mips go build -o api-mips
  ```

- **Для ARM64 (aarch64):**

  ```bash
  GOOS=linux GOARCH=arm64 go build -o api-aarch
  ```

---

## 🚀 Запуск проекта

### Фронтенд

Для локального запуска React‑приложения используйте:

```bash
npm start
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).

### Go‑сервер

Запустите собранный бинарный файл. Например:

- Для стандартной сборки:
  ```bash
  ./api
  ```

---

## 📦 Релиз и деплой

Для автоматизации сборки и публикации релизов вы можете использовать GitHub Actions. В репозитории настроен workflow, который:
- Собирает сервер для разных архитектур (mipsel, mips, aarch64).
- Собирает React‑приложение.
- Создаёт релиз на GitHub с прикреплёнными бинарными файлами и сборкой фронтенда.