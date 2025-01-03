#pragma once

#include <string>

namespace logger
{
    // Определяем собственный enum для уровней логирования
    enum class kvpLogLevel
    {
#ifndef ERROR
#ifndef DEBUG
        DEBUG = 0,
        INFO,
        WARNING,
        ERROR,
        CRITICAL,
        NONE = -1,
#endif
#endif

        Debug = 0,
        Info,
        Warning,
        Error,
        Critical,
        None = -1
    };

    // Интерфейс для логгеров
    class ILogger
    {
    public:
        virtual ~ILogger() = default;
        virtual void log(kvpLogLevel level, const std::string &message) = 0;
        virtual void setLogLevel(kvpLogLevel level) = 0;
        virtual void setLogLevel(std::string level) = 0;
        virtual kvpLogLevel getLogLevel() const = 0;
        virtual void setFormat(const std::string &format) = 0;
        virtual std::string getFormat() const = 0;
        virtual void setTimeFormat(const std::string &timeFormat) = 0;
        virtual std::string getTimeFormat() const = 0;
    };

    // Интерфейс для локализации
    class ILocalization
    {
    public:
        virtual ~ILocalization() = default;
        virtual std::string translate(const std::string &message) = 0;
    };

} // namespace logger
