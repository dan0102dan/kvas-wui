#pragma once

#include <iostream>
#include <fstream>
#include <string>
#include <mutex>
#include <memory>
#include <vector>
#include <sstream>
#include <ctime>

#include "kvpInfaceLogger.hpp"

namespace logger
{
    // Реализация FileLogger
    class FileLogger : public ILogger
    {
    public:
        explicit FileLogger(const std::string &filename);
        ~FileLogger() override;
        void log(kvpLogLevel level, const std::string &message) override;
        void setLogLevel(kvpLogLevel level) override;
        void setLogLevel(std::string level) override;
        kvpLogLevel getLogLevel() const override;
        void setFormat(const std::string &format) override;
        std::string getFormat() const override;
        void setTimeFormat(const std::string &timeFormat) override;
        std::string getTimeFormat() const override;

    private:
        std::ofstream logFile;
        kvpLogLevel currentLogLevel;
        std::string formatString;
        std::string timeFormatString;
        std::mutex logMutex; // Мьютекс для защиты доступа к членам класса
    };

    // Реализация ConsoleLogger
    class ConsoleLogger : public ILogger
    {
    public:
        ConsoleLogger();
        void log(kvpLogLevel level, const std::string &message) override;
        void setLogLevel(kvpLogLevel level) override;
        void setLogLevel(std::string level) override;
        kvpLogLevel getLogLevel() const override;
        void setFormat(const std::string &format) override;
        std::string getFormat() const override;
        void setTimeFormat(const std::string &timeFormat) override;
        std::string getTimeFormat() const override;

    private:
        kvpLogLevel currentLogLevel;
        std::string formatString;
        std::string timeFormatString;
        std::mutex logMutex; // Мьютекс для защиты доступа к членам класса
    };

    // Реализация MultiLogger
    class MultiLogger : public ILogger
    {
    public:
        void addHandler(std::unique_ptr<ILogger> handler);
        void log(kvpLogLevel level, const std::string &message) override;
        void setLogLevel(kvpLogLevel level) override;
        void setLogLevel(std::string level) override;
        kvpLogLevel getLogLevel() const override;
        void setFormat(const std::string &format) override;
        std::string getFormat() const override;
        void setTimeFormat(const std::string &timeFormat) override;
        std::string getTimeFormat() const override;

        // Добавляем итераторы
        using const_iterator = std::vector<std::unique_ptr<ILogger>>::const_iterator;

        const_iterator begin() const { return handlers.begin(); }
        const_iterator end() const { return handlers.end(); }

        // Добавляем поддержку локализации
        void setLocalization(ILocalization *localization)
        {
            std::lock_guard<std::mutex> lock(logMutex);
            localization_ = localization;
        }
        ILocalization *getLocalization()
        {
            std::lock_guard<std::mutex> lock(logMutex);
            return localization_;
        }

    private:
        std::vector<std::unique_ptr<ILogger>> handlers;
        kvpLogLevel currentLogLevel;
        std::string formatString;
        std::string timeFormatString;
        ILocalization *localization_ = nullptr;
        std::mutex logMutex; // Мьютекс для защиты доступа к членам класса
    };

    // Глобальный логгер
    extern std::unique_ptr<MultiLogger> global_logger;

    // Функции логгера

    // Функция инициализации логгера
    void init_logger(const std::string &file_log_path,
                     kvpLogLevel level = kvpLogLevel::Debug,
                     const std::string &format = "{time} [{level}] {message}",
                     const std::string &timeFormat = "%d-%m-%Y %H:%M:%S");

    // Функция для форматирования времени
    std::string getCurrentTimeFormatted(const std::string &timeFormat);

    // Функция для вывода уровня логирования
    void printLogLevel(std::ostream &out, kvpLogLevel level, bool useColors);

    // Функция для форматирования сообщения
    std::string formatLogMessage(kvpLogLevel level,
                                 const std::string &message,
                                 const std::string &format,
                                 const std::string &timeFormat,
                                 bool useColors);

    // Функция для получения цветного текста
    std::string colored(const std::string &text, const std::string &color);

    // Функция для получения имени уровня логирования
    std::string getLogLevelName(kvpLogLevel level);

    // Функция для получения кода цвета для уровня логирования
    std::string getColorLevel(kvpLogLevel level);

    // Логгер-поток
    class LogStream
    {
    public:
        explicit LogStream(kvpLogLevel level);

        template <typename T>
        LogStream &operator<<(const T &value);

        ~LogStream();

    private:
        kvpLogLevel level_;
        std::stringstream buffer_;
        ILocalization *localization_;
    };

    // Макросы для удобства
#ifdef KVP_DEBUG
#define LOG_DEBUG logger::LogStream(logger::kvpLogLevel::Debug)
#define CROW_ENABLE_DEBUG
#else
#define LOG_DEBUG                                                                    \
    if (global_logger && global_logger->getLogLevel() <= logger::kvpLogLevel::Debug) \
    logger::LogStream(logger::kvpLogLevel::Debug)
#endif
#define LOG_INFO logger::LogStream(logger::kvpLogLevel::Info)
#define LOG_WARNING logger::LogStream(logger::kvpLogLevel::Warning)
#define LOG_ERROR logger::LogStream(logger::kvpLogLevel::Error)
#define LOG_CRITICAL logger::LogStream(logger::kvpLogLevel::Critical)

} // namespace logger
