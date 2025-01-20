#include <iostream>
#include <sstream>
#include <mutex>

#include "../hpp/kvpLocalization.hpp"   // Библиотека Локализации
#include "../hpp/kvpConsoleEscapes.hpp" // Библиотека Логирования

namespace logger
{
    // Функция для преобразования строки в уровень логирования
    kvpLogLevel convertStringToLevel(const std::string &level)
    {
        kvpLogLevel logLevel_;

        if (level == "debug")
        {
            logLevel_ = kvpLogLevel::Debug;
        }
        else if (level == "info")
        {
            logLevel_ = kvpLogLevel::Info;
        }
        else if (level == "warning")
        {
            logLevel_ = kvpLogLevel::Warning;
        }
        else if (level == "error")
        {
            logLevel_ = kvpLogLevel::Error;
        }
        else if (level == "critical")
        {
            logLevel_ = kvpLogLevel::Critical;
        }
        else if (level == "none")
        {
            logLevel_ = kvpLogLevel::None;
        }
        else
        {
            logLevel_ = kvpLogLevel::Info; // значение по умолчанию
        }
        return logLevel_;
    }

    // Функция для получения имени уровня логирования
    std::string getLogLevelName(kvpLogLevel level)
    {
        switch (level)
        {
        case kvpLogLevel::Debug:
            return _("ОТЛАДКА");
        case kvpLogLevel::Info:
            return _("ИНФОРМАЦИЯ");
        case kvpLogLevel::Warning:
            return _("ПРЕДУПРЕЖДЕНИЕ");
        case kvpLogLevel::Error:
            return _("ОШИБКА");
        case kvpLogLevel::Critical:
            return _("КРИТИЧНО");
        case kvpLogLevel::None:
            return _("ОТКЛЮЧЕНО");
        default:
            return _("НЕ ИЗВЕСТНО");
        }
    }

    // Функция для получения кода цвета
    std::string getColorLevel(kvpLogLevel level)
    {
        switch (level)
        {
        case kvpLogLevel::Debug:
            return CYAN;
        case kvpLogLevel::Info:
            return GREEN;
        case kvpLogLevel::Warning:
            return YELLOW;
        case kvpLogLevel::Error:
            return RED;
        case kvpLogLevel::Critical:
            return MAGENTA;
        case kvpLogLevel::None:
            return RESET;
        default:
        }
    };

    // Функция для получения цветного текста
    std::string colored(const std::string &text, const std::string &color)
    {
        return color + text + RESET;
    };

    // Функция для получения форматированного времени
    std::string getCurrentTimeFormatted(const std::string &timeFormat)
    {
        auto now = std::chrono::system_clock::now();
        auto in_time_t = std::chrono::system_clock::to_time_t(now);

        std::stringstream ss;
        std::tm bt{};
        localtime_r(&in_time_t, &bt);
        // Получение текущей локали
        std::locale currentLocale = std::locale::global(std::locale());
        // Установка локали в формате "день-месяц-год часы:минуты:секунды"
        ss.imbue(currentLocale);
        ss << std::put_time(&bt, timeFormat.c_str());
        return ss.str();
    }

    // Добавление уровня логирования к потоку
    void printLogLevel(std::ostream &out, kvpLogLevel level, bool useColors)
    {
        std::string levelStr = "";
        std::string color = "";

        // Добавляем цвет к levelStr, если out - консоль
        if (useColors)
        {
            levelStr = getLogLevelName(level);   // Получаем имя уровня логирования
            color = getColorLevel(level);        // Получаем цвет уровня логирования
            levelStr = colored(levelStr, color); // Добавляем цвет к уровню логирования
        }

        out << levelStr; // Выводим levelStr (с цветом или без) в out
    }

    std::string formatLogMessage(kvpLogLevel level, const std::string &message, const std::string &format, const std::string &timeFormat, bool useColors)
    {
        std::string time = getCurrentTimeFormatted(timeFormat);

        // Используем printLogLevel для получения цветного уровня логирования
        std::stringstream levelStream;
        printLogLevel(levelStream, level, useColors); // Передаем useColors
        std::string levelStr = levelStream.str();

        std::string formattedMessage = format;

        // Заменяем {time}, {level}, {message} в строке формата
        size_t pos = formattedMessage.find("{time}");
        while (pos != std::string::npos)
        {
            formattedMessage.replace(pos, 6, time);
            pos = formattedMessage.find("{time}", pos + time.length());
        }

        pos = formattedMessage.find("{level}");
        while (pos != std::string::npos)
        {
            formattedMessage.replace(pos, 7, levelStr); // Используем levelStr, полученный из printLogLevel
            pos = formattedMessage.find("{level}", pos + levelStr.length());
        }

        pos = formattedMessage.find("{message}");
        while (pos != std::string::npos)
        {
            formattedMessage.replace(pos, 9, message);
            pos = formattedMessage.find("{message}", pos + message.length());
        }

        return formattedMessage + (useColors ? "\n" : "");
    }

    // Реализация FileLogger
    FileLogger::FileLogger(const std::string &filename) : logFile(filename, std::ios::app), currentLogLevel(kvpLogLevel::Debug), formatString("{time} [{level}] {message}\n"), timeFormatString("%d-%b-%y %H:%M:%S")
    {
        if (!logFile.is_open())
        {
            throw std::runtime_error(_("Невозможно открыть файл журнала: ") + filename);
        }
    }

    FileLogger::~FileLogger()
    {
        if (logFile.is_open())
        {
            logFile.close();
        }
    }

    void FileLogger::log(kvpLogLevel level, const std::string &message)
    {
        if (currentLogLevel == kvpLogLevel::None)
            if (currentLogLevel == kvpLogLevel::None)
                return;
        if (level >= currentLogLevel && logFile.is_open())
        {
            // Блокируем текущий поток
            std::lock_guard<std::mutex> lock(logMutex);
            logFile << formatLogMessage(level, message, formatString, timeFormatString, /*useColors=*/false);
        }
    }

    void FileLogger::setLogLevel(std::string levelString)
    {
        std::lock_guard<std::mutex> lock(logMutex);
        currentLogLevel = convertStringToLevel(levelString);
    }

    void FileLogger::setLogLevel(kvpLogLevel level)
    {
        std::lock_guard<std::mutex> lock(logMutex);
        currentLogLevel = level;
    }

    kvpLogLevel FileLogger::getLogLevel() const
    {
        return currentLogLevel;
    }

    void FileLogger::setFormat(const std::string &format)
    {
        std::lock_guard<std::mutex> lock(logMutex);
        formatString = format;
    }

    std::string FileLogger::getFormat() const
    {
        return formatString;
    }

    void FileLogger::setTimeFormat(const std::string &timeFormat)
    {
        std::lock_guard<std::mutex> lock(logMutex);
        timeFormatString = timeFormat;
    }

    std::string FileLogger::getTimeFormat() const
    {
        return timeFormatString;
    }

    // Реализация ConsoleLogger
    ConsoleLogger::ConsoleLogger() : currentLogLevel(kvpLogLevel::Debug), formatString("{time} [{level}] {message}\n"), timeFormatString("%d-%b-%y %H:%M:%S")
    {
    }

    void ConsoleLogger::log(kvpLogLevel level, const std::string &message)
    {
        if (currentLogLevel == kvpLogLevel::None)
            if (currentLogLevel == kvpLogLevel::None)
                return;
        if (level >= currentLogLevel)
        {
            // Блокируем текущий поток
            std::lock_guard<std::mutex> lock(logMutex);
            // Передаем std::cout в printLogLevel
            std::cout << formatLogMessage(level, message, formatString, timeFormatString, /*useColors=*/true);
        }
    }

    void ConsoleLogger::setLogLevel(std::string levelString)
    {
        std::lock_guard<std::mutex> lock(logMutex);
        currentLogLevel = convertStringToLevel(levelString);
    }

    void ConsoleLogger::setLogLevel(kvpLogLevel level)
    {
        std::lock_guard<std::mutex> lock(logMutex);
        currentLogLevel = level;
    }

    kvpLogLevel ConsoleLogger::getLogLevel() const
    {
        return currentLogLevel;
    }

    void ConsoleLogger::setFormat(const std::string &format)
    {
        std::lock_guard<std::mutex> lock(logMutex);
        formatString = format;
    }

    std::string ConsoleLogger::getFormat() const
    {
        return formatString;
    }

    void ConsoleLogger::setTimeFormat(const std::string &timeFormat)
    {
        std::lock_guard<std::mutex> lock(logMutex);
        timeFormatString = timeFormat;
    }

    std::string ConsoleLogger::getTimeFormat() const
    {
        return timeFormatString;
    }

    // Реализация MultiLogger (продолжение)
    void MultiLogger::log(kvpLogLevel level, const std::string &message)
    {
        if (currentLogLevel == kvpLogLevel::None)
            if (currentLogLevel == kvpLogLevel::None)
                return;

        if (level >= currentLogLevel)
        {
            std::lock_guard<std::mutex> lock(logMutex); // Блокируем мьютекс на время записи
            for (const auto &handler : handlers)
            {
                handler->log(level, message);
            }
        }
    }

    // void MultiLogger::setLogLevel(std::string levelString)
    // {
    //     setLogLevel(convertStringToLevel(levelString));
    // }

    void MultiLogger::setLogLevel(std::string levelString)
    {
        std::lock_guard<std::mutex> lock(logMutex); // Блокируем мьютекс на время записи
        kvpLogLevel level = convertStringToLevel(levelString);
        std::cerr << _("Установлен уровень логирования: ");
        printLogLevel(std::cerr, level, true);
        std::cerr << std::endl;
        currentLogLevel = level;
        // Устанавливаем уровень логирования для всех обработчиков
        for (const auto &handler : handlers)
        {
            handler->setLogLevel(level);
        }
    }

    void MultiLogger::setLogLevel(kvpLogLevel level)
    {
        std::lock_guard<std::mutex> lock(logMutex);
        std::cerr << _("Установлен уровень логирования: ");
        printLogLevel(std::cerr, level, true);
        std::cerr << std::endl;
        currentLogLevel = level;
        // Устанавливаем уровень логирования для всех обработчиков
        for (const auto &handler : handlers)
        {
            handler->setLogLevel(level);
        }
    }

    kvpLogLevel MultiLogger::getLogLevel() const
    {
        return currentLogLevel;
    }

    void MultiLogger::setFormat(const std::string &format)
    {
        formatString = format;
        for (const auto &handler : handlers)
        {
            std::lock_guard<std::mutex> lock(logMutex);
            handler->setFormat(format);
        }
    }

    std::string MultiLogger::getFormat() const
    {
        return formatString;
    }

    void MultiLogger::setTimeFormat(const std::string &timeFormat)
    {
        timeFormatString = timeFormat;
        for (const auto &handler : handlers)
        {
            handler->setTimeFormat(timeFormat);
        }
    }

    // Получаем формат времени логирования
    std::string MultiLogger::getTimeFormat() const
    {
        return timeFormatString;
    }

    //  Реализация MultiLogger
    void MultiLogger::addHandler(std::unique_ptr<ILogger> handler)
    {
        std::lock_guard<std::mutex> lock(logMutex);
        handlers.push_back(std::move(handler));
    }

    // Глобальный логгер
    std::unique_ptr<MultiLogger> global_logger = nullptr;

    LogStream::LogStream(kvpLogLevel level) : level_(level), localization_(nullptr)
    {
        if (global_logger)
        {
            localization_ = global_logger->getLocalization();
        }
    }

    template <typename T>
    LogStream &LogStream::operator<<(const T &value)
    {
        buffer_ << value;
        return *this;
    }

    LogStream::~LogStream()
    {
        // Проверяем, существует ли глобальный логгер
        if (global_logger)
        {
            // Проверяем, есть ли локализация
            if (localization_)
            {
                // Переводим строку и отправляем в лог
                global_logger->log(level_, localization_->translate(buffer_.str()));
            }
            else
            {
                // Если локализация отсутствует, отправляем в лог
                global_logger->log(level_, buffer_.str());
            }
        }
        else
        {
            // Если глобальный логгер отсутствует,
            // выводим в консоль без перевода строки
            std::cout << buffer_.str() << std::endl;
        }
    }

    void init_logger(const std::string &fileLog, kvpLogLevel level, const std::string &format, const std::string &timeFormat)
    {
#ifndef KVP_DEBUG
        //  Если KVP_DEBUG не определен, устанавливаем уровень DEBUG
        //  иначе устанавливаем уровень INFO
        if (level == kvpLogLevel::Debug)
        {
            level = kvpLogLevel::Info;
            std::cerr << _("Переменная KVP_DEBUG не определена. Уровень логирования установлен: [") << getLogLevelName(level) << "]" << std::endl;
        }
#endif
#ifndef KVP_DEBUG
        //  Если KVP_DEBUG не определен, устанавливаем уровень DEBUG
        //  иначе устанавливаем уровень INFO
        if (level == kvpLogLevel::Debug)
        {
            level = kvpLogLevel::Info;
            std::cerr << _("Переменная KVP_DEBUG не определена. Уровень логирования установлен: [") << getLogLevelName(level) << "]" << std::endl;
        }
#endif
        if (!global_logger)
        {
            global_logger = std::make_unique<MultiLogger>();
            global_logger->addHandler(std::make_unique<ConsoleLogger>());
        }

        // Устанавливаем уровень, формат и таймформат в любом случае
        global_logger->setLogLevel(level);
        global_logger->setFormat(format);
        global_logger->setTimeFormat(timeFormat);

        // Устанавливаем уровень, формат и таймформат в любом случае
        global_logger->setLogLevel(level);
        global_logger->setFormat(format);
        global_logger->setTimeFormat(timeFormat);

        if (!fileLog.empty())
        {
            try
            {
                std::filesystem::path logPath(fileLog);
                if (!std::filesystem::exists(logPath.parent_path()))
                {
                    throw std::runtime_error(_("Директория лог-файла не существует: ") << logPath.parent_path());
                    throw std::runtime_error(_("Директория лог-файла не существует: ") << logPath.parent_path());
                }

                if ((std::filesystem::status(logPath.parent_path()).permissions() & std::filesystem::perms::owner_write) == std::filesystem::perms::none)
                {
                    throw std::runtime_error(_("Ошибка: Нет прав на запись в директорию лог-файла: ") << logPath.parent_path());
                    throw std::runtime_error(_("Ошибка: Нет прав на запись в директорию лог-файла: ") << logPath.parent_path());
                }

                // Более лаконичная проверка на наличие FileLogger
                bool hasFileLogger = std::any_of(global_logger->begin(), global_logger->end(),
                                                 [](const auto &handler)
                                                 { return dynamic_cast<FileLogger *>(handler.get()) != nullptr; });

                // Более лаконичная проверка на наличие FileLogger
                bool hasFileLogger = std::any_of(global_logger->begin(), global_logger->end(),
                                                 [](const auto &handler)
                                                 { return dynamic_cast<FileLogger *>(handler.get()) != nullptr; });

                if (!hasFileLogger)
                {
                    global_logger->addHandler(std::make_unique<FileLogger>(fileLog));
                }
            }
            catch (const std::exception &e)
            {
                throw std::runtime_error(_("Ошибка при инициализации FileLogger: ") << e.what());
            }
        }
    }
}
