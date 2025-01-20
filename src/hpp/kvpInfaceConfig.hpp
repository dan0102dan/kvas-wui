#pragma once

#include <string>
#include <optional>
#include <unordered_map>

#include "kvpInfaceLocalization.hpp"

// Структуры конфигурации
struct ServerConfig
{
    int port;
    std::string address;
    int threads;
};

struct DatabaseConfig
{
    std::string host;
    int port;
    std::string user;
    std::string password;
    std::string name;
};

struct LoggingConfig
{
    std::string level;
    std::string file;
};

struct AppConfig
{
    ServerConfig server;
    DatabaseConfig database;
    LoggingConfig logging;
    int timeout;
};

// Интерфейс для модуля конфигурации
class IConfig
{
public:
    virtual ~IConfig() = default;

    // Основные методы для доступа к конфигурации
    virtual bool load() = 0;
    virtual const AppConfig &get() const = 0;
    virtual std::string getAppRootPath() const = 0;
    virtual void setLocalization(ILocalization *localization) = 0;

    // Добавляем статический метод getInstance
    static IConfig &getInstance(const std::string &configFileName = "");

    // Методы для работы с командной строкой
    virtual void initCommandLine(int argc, char **argv) = 0;
    virtual std::optional<std::string> getCommandLineArgument(const std::string &name) const = 0;

    // Методы для доступа к отдельным частям конфигурации
    virtual const ServerConfig &getServerConfig() const = 0;
    virtual const DatabaseConfig &getDatabaseConfig() const = 0;
    virtual const LoggingConfig &getLoggingConfig() const = 0;
    virtual int getTimeout() const = 0;

    // Дополнительные методы (опционально)
    virtual void overrideWithEnvironmentVariables() = 0;
    virtual void overrideWithCommandLineArguments() = 0;
    virtual void updateLoggerSettings() = 0;

protected:
    virtual void setAppRootPath(const std::string &path) = 0;
};
