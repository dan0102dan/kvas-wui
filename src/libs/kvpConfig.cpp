#include <iostream>
#include <fstream>
#include <string>
#include <optional>
#include <sstream>
#include <unordered_map>
#include <type_traits>
#include <filesystem>

#include <stdexcept>
#include <cstdlib> // Для getenv

#include "../hpp/kvpConfig.hpp" // Библиотека Конфигурации
// #include "../hpp/kvpLocalization.hpp" // Библиотека Локализации

// Добавляем реализацию getInstance
IConfig &IConfig::getInstance(const std::string &configFileName)
{
    static std::unique_ptr<Config> instance;
    if (!instance)
    {
        if (configFileName.empty())
        {
            throw std::runtime_error("IConfig: configFileName не может быть пустой в момент инициализации.");
        }
        // Используем new для создания объекта Config
        instance.reset(new Config(configFileName));
        instance->load();
    }
    return *instance;
}

// Конструктор
Config::Config(const std::string &configFileName) : configFileName_(configFileName)
{
    // Получаем логгер
    if (logger::global_logger)
    {
        logger_ = logger::global_logger.get();
    }
    else
    {
        LOG_WARNING << _("Предупреждение: Глобальный логгер не инициализирован. Config будет использовать nullptr.") << std::endl;
        logger_ = nullptr;
    }

    localization_ = nullptr;

    appRootPath_ = getAppRootPath();
}

// Добавляем сеттер для localization_ (если нужно)
void Config::setLocalization(ILocalization *localization)
{
    localization_ = localization;
}

// Загрузка конфигурации
bool Config::load()
{
    if (!loadFromJson())
    {
        LOG_ERROR << _("Не удалось загрузить конфигурацию из файла: ") << configFileName_;
        return false;
    }

    overrideWithEnvironmentVariables();
    overrideWithCommandLineArguments();

    // Обновляем уровень логирования после загрузки конфигурации
    updateLoggerSettings();

    return true;
}

void Config::updateLoggerSettings()
{
    static bool _logLevelSet = false;
    if (!_logLevelSet && logger_)
    {
        const auto &loggingConfig = getLoggingConfig();
        logger_->setLogLevel(loggingConfig.level);
        _logLevelSet = true; // Устанавливаем флаг, чтобы избежать повторного вызова
    }
}

// Получаем путь к папке проекта/приложения
std::string Config::getAppRootPath() const
{
    // Получаем путь к конфигурационному файлу
    std::filesystem::path _configFile = configFileName_;
    return _configFile.parent_path();
}

// Устанавливаем путь к папке проекта/приложения
void Config::setAppRootPath(const std::string &path)
{
    appRootPath_ = path;
}

// Получаем конфигурацию сервера
const ServerConfig &Config::getServerConfig() const
{
    return config_.server;
}

// Получаем конфигурацию базы данных
const DatabaseConfig &Config::getDatabaseConfig() const
{
    return config_.database;
}

// Получаем конфигурацию логирования
const LoggingConfig &Config::getLoggingConfig() const
{
    return config_.logging;
}

// Получаем таймаут
int Config::getTimeout() const
{
    return config_.timeout;
}

// Получаем конфигурацию
const AppConfig &Config::get() const { return config_; }

// Загрузка конфигурации из файла JSON
bool Config::loadFromJson()
{

    // Открываем файл конфигурации
    std::ifstream configFile(configFileName_);
    if (!configFile.is_open())
    {
        return false;
    }

    // Читаем весь файл в строку
    std::stringstream buffer;
    buffer << configFile.rdbuf();
    std::string fileContent = buffer.str();

    configFile.close();

    crow::json::rvalue jsonConfig;
    try
    {
        jsonConfig = crow::json::load(fileContent);
    }
    catch (const std::runtime_error &e)
    {
        LOG_ERROR << _("Недопустимый JSON-формат в файле конфигурации: ") << e.what() << configFileName_;
        return false;
    }

    // Автоматический парсинг JSON и заполнение AppConfig
    try
    {
        parseJsonToStruct(jsonConfig, config_);
    }
    catch (const std::runtime_error &e)
    {
        LOG_ERROR << _("Ошибка при парсинге JSON-файла конфигурации: ") << e.what() << configFileName_;
        return false;
    }

    return true;
}

// Переопределение конфигурации через переменные окружения
void Config::overrideWithEnvironmentVariables()
{
    // Примеры переопределения через переменные окружения
    if (const char *envPort = std::getenv("SERVER_PORT"))
    {
        try
        {
            config_.server.port = std::stoi(envPort);
            LOG_DEBUG << _("Переопределение порта сервера из переменной окружения: ") << config_.server.port;
        }
        catch (const std::exception &e)
        {
            LOG_ERROR << _("Ошибка переопределения порта сервера из переменной окружения: ") << e.what();
        }
    }
    if (const char *envDbHost = std::getenv("DB_HOST"))
    {
        config_.database.host = envDbHost;
        LOG_DEBUG << _("Переопределение хоста базы данных из переменной окружения: ") << config_.database.host;
    }
    // ... аналогично для других параметров
}

// Инициализация аргументов командной строки
void Config::initCommandLine(int argc, char **argv)
{
    argc_ = argc;
    argv_ = argv;

    // Простой парсинг аргументов командной строки без boost::program_options
    for (int i = 1; i < argc; ++i)
    {
        std::string arg = argv[i];
        if (arg.find("--") == 0)
        {
            arg = arg.substr(2); // Удаляем "--"
            size_t pos = arg.find("=");
            if (pos != std::string::npos)
            {
                commandLineArgs_[arg.substr(0, pos)] = arg.substr(pos + 1);
            }
            else
            {
                commandLineArgs_[arg] = ""; // Флаг без значения
            }
        }
    }
}

// Переопределение конфигурации через аргументы командной строки
void Config::overrideWithCommandLineArguments()
{
    // Примеры переопределения через аргументы командной строки
    if (auto port = getCommandLineArgument("server.port"))
    {
        try
        {
            config_.server.port = std::stoi(*port);
            LOG_DEBUG << _("Переопределение порта сервера из аргумента командной строки: ") << config_.server.port;
        }
        catch (const std::exception &e)
        {
            LOG_ERROR << _("Ошибка переопределения порта сервера из аргумента командной строки: ") << e.what();
        }
    }
    if (auto address = getCommandLineArgument("server.address"))
    {
        config_.server.address = *address;
        LOG_DEBUG << _("Переопределение адреса сервера из аргумента командной строки: ") << config_.server.address;
    }
    if (auto dbHost = getCommandLineArgument("database.host"))
    {
        config_.database.host = *dbHost;
        LOG_DEBUG << _("Переопределение хоста базы данных из аргумента командной строки: ") << config_.database.host;
    }
    if (auto timeout = getCommandLineArgument("timeout"))
    {
        try
        {
            config_.timeout = std::stoi(*timeout);
            LOG_DEBUG << _("Переопределение таймаута из аргумента командной строки: ") << config_.timeout;
        }
        catch (const std::exception &e)
        {
            LOG_ERROR << _("Ошибка переопределения таймаута из аргумента командной строки: ") << e.what();
        }
    }
    if (auto kvpLogLevel = getCommandLineArgument("log.level"))
    {
        config_.logging.level = *kvpLogLevel;
        LOG_DEBUG << _("Переопределение уровня логирования из аргумента командной строки: ") << config_.server.address;
    }
    // ... аналогично для других параметров
}

// Получение значения аргумента командной строки
std::optional<std::string> Config::getCommandLineArgument(const std::string &name) const
{
    auto it = commandLineArgs_.find(name);
    if (it != commandLineArgs_.end())
    {
        return it->second;
    }
    return std::nullopt;
}

// Рекурсивная функция для парсинга JSON и заполнения структуры
template <typename T>
void Config::parseJsonToStruct(const crow::json::rvalue &json, T &structure)
{
    std::string err = _("Неизвестное поле верхнего уровня в конфигурации ");

    if constexpr (std::is_base_of_v<crow::json::rvalue, T>)
    {
        // Обработка случая, когда T является crow::json::rvalue
        throw std::runtime_error("crow::json::rvalue " + _(" не должен быть полем структуры"));
    }
    else if constexpr (std::is_integral_v<T>)
    {
        // Обработка целых чисел
        structure = json.i(); // Убираем .template
    }
    else if constexpr (std::is_floating_point_v<T>)
    {
        // Обработка чисел с плавающей точкой
        structure = json.d(); // Убираем .template
    }
    else if constexpr (std::is_same_v<T, std::string>)
    {
        // Обработка строк
        structure = json.s(); // Убираем .template
    }
    else if constexpr (std::is_same_v<T, bool>)
    {
        // Обработка булевых значений
        structure = json.b(); // Убираем .template
    }
    else
    {
        // Обработка структур (рекурсивный вызов для каждого поля)
        for (const auto &member : json)
        { // Используем итерацию по json напрямую
            const std::string &key = member.key();
            const crow::json::rvalue &value = member;

            // Здесь нужна логика сопоставления имени поля (key) с полем структуры (structure)
            // Приведу пример с использованием if-else, но лучше использовать более гибкий подход,
            // например, таблицу соответствия имен полей или рефлексию (если она доступна)

            if constexpr (std::is_same_v<T, AppConfig>)
            {
                if (key == "server")
                {
                    parseJsonToStruct(value, structure.server);
                }
                else if (key == "database")
                {
                    parseJsonToStruct(value, structure.database);
                }
                else if (key == "logging")
                {
                    parseJsonToStruct(value, structure.logging);
                }
                else if (key == "timeout")
                {
                    parseJsonToStruct(value, structure.timeout);
                }
                else
                {
                    err = err + "AppConfig: " + key;
                    LOG_WARNING << err;
                    throw std::runtime_error(err);
                }
            }
            else if constexpr (std::is_same_v<T, ServerConfig>)
            {
                if (key == "port")
                {
                    parseJsonToStruct(value, structure.port);
                }
                else if (key == "address")
                {
                    parseJsonToStruct(value, structure.address);
                }
                else if (key == "threads")
                {
                    parseJsonToStruct(value, structure.threads);
                }
                else
                {
                    err = err + "ServerConfig: " + key;
                    LOG_WARNING << err;
                    throw std::runtime_error(err);
                }
            }
            else if constexpr (std::is_same_v<T, DatabaseConfig>)
            {
                if (key == "host")
                {
                    parseJsonToStruct(value, structure.host);
                }
                else if (key == "port")
                {
                    parseJsonToStruct(value, structure.port);
                }
                else if (key == "user")
                {
                    parseJsonToStruct(value, structure.user);
                }
                else if (key == "password")
                {
                    parseJsonToStruct(value, structure.password);
                }
                else if (key == "name")
                {
                    parseJsonToStruct(value, structure.name);
                }
                else
                {
                    err = err + "DatabaseConfig: " + key;
                    LOG_WARNING << err;
                    throw std::runtime_error(err);
                }
            }
            else if constexpr (std::is_same_v<T, LoggingConfig>)
            {
                if (key == "level")
                {
                    parseJsonToStruct(value, structure.level);
                }
                else if (key == "file")
                {
                    parseJsonToStruct(value, structure.file);
                }
                else
                {
                    err = err + "LoggingConfig: " + key;
                    LOG_WARNING << err;
                    throw std::runtime_error(err);
                }
            }
            else
            { // Этот else относится к самому внешнему if constexpr
                err = _("Неизвестный тип структуры: ");
                LOG_WARNING << err;
                throw std::runtime_error(err);
            }
        } // Закрывающая скобка цикла for
    } // Закрывающая скобка else (обработка структур)
} // Конец функции parseJsonToStruct
