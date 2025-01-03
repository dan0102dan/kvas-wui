#include <iostream>
#include <filesystem>

// #include "hpp/kvpLogger.hpp" // Библиотека Логирования
// #include "hpp/kvpInfaceConfig.hpp" // Библиотека Конфигурации
#include "hpp/kvpLocalization.hpp" // Библиотека Локализации

// #include "hpp/kvpFilesTools.hpp" // Библиотека Инструментов
#include "hpp/kvpInitializeApp.hpp" // Инициализация приложения
// #include "hpp/kvpLogger.hpp"        // Библиотека Логирования

int main(int argc, char *argv[])
{
    IConfig *config = nullptr;
    ILocalization *locManager = nullptr;

    if (!initializeApp(argc, argv, &config, &locManager))
    {
        return 1;
    }

    // Установка уровня логирования в WARNING
    logger::global_logger->setLogLevel(logger::kvpLogLevel::Warning);

    // Установка языка отличной от языка по умолчанию
    locManager->setLanguage(Language::EN);

    // Теперь можно использовать _ без второго аргумента (используется глобальный менеджер)
    LOG_DEBUG << _("Application DEBUG");
    LOG_INFO << _("Application INFO");
    LOG_WARNING << _("Application WARNING");
    LOG_ERROR << _("Test error");
    LOG_CRITICAL << _("Application started CRITICAL");

    return 0;
}

// int main(int argc, char *argv[])
// {

//     // 1. Получаем путь к директории программы
//     std::string _appRootPath = findAppFolder(std::string(argv[0]));

//     // 2. Создаем экземпляр менеджера локализации
//     auto &locManager = LocalizationManager::getInstance(_appRootPath + "/locale/", Language::EN);
//     // namespace logger = logger;

//     // Инициализация логгера
//     logger::init_logger(_appRootPath + "/kvaspro.log", logger::kvpLogLevel::Debug, "{time} - {level}: {message}\n", "%Y-%m-%d %H:%M:%S");

//     // Логирование с использованием макросов
//     LOG_DEBUG << "Это отладочное сообщение.";
//     LOG_INFO << "Это информационное сообщение.";
//     LOG_WARNING << "Это предупреждение.";
//     LOG_ERROR << "Это ошибка.";
//     LOG_CRITICAL << "Это критическое сообщение.";

//     // Логирование с использованием разных типов данных
//     int value = 42;
//     LOG_INFO << "Значение: " << value;
//     double pi = 3.14159;
//     LOG_DEBUG << "Число pi: " << pi;

//     // Изменение уровня логирования
//     if (logger::global_logger)
//     {
//         logger::global_logger->setLogLevel(logger::kvpLogLevel::Warning);
//         LOG_INFO << "Это сообщение не должно появиться, так как уровень логирования установлен на WARNING.";
//         LOG_WARNING << "Это предупреждение должно появиться.";

//         // Изменение формата сообщения
//         logger::global_logger->setFormat("{level} - {message} ({time})\n");
//         LOG_ERROR << "Это ошибка с новым форматом.";

//         // Изменение формата времени
//         logger::global_logger->setTimeFormat("%H:%M:%S");
//         LOG_CRITICAL << "Это критическое сообщение с новым форматом времени.";
//     }
//     else
//     {
//         std::cerr << "Глобальный логгер не инициализирован." << std::endl;
//     }

//     return 0;
// }

// int main(int argc, char *argv[])
// {

//     // 1. Получаем путь к директории программы
//     std::string _appRootPath = findAppFolder(std::string(argv[0]));

//     // 2. Создаем экземпляр менеджера локализации
//     auto &locManager = LocalizationManager::getInstance(_appRootPath + "/locale/");

//     std::cerr << _("Язык перевода ") << locManager.getLocalizationInfo(locManager.getCurrentLanguage(), LocalizationInfoType::NAME) << std::endl;
//     std::cout << _("Путь к директории программы: ") << _appRootPath << std::endl;

//     // 3. Инициализируем журналирование
//     logger::init_logger(_appRootPath + "/kvaspro.log", crow::LogLevel::Info);

//     // 4. Создаем объект Config, указывая путь к файлу конфигурации
//     Config config(_appRootPath + "/config.json");

//     // 5. Загружаем конфигурацию
//     if (!config.load())
//         return 1;

//     // 6. Получаем доступ к загруженной конфигурации
//     const AppConfig &appConfig = config.get();

//     // 7. Инициализируем аргументы командной строки
//     config.initCommandLine(argc, argv);

//     // 8. Используем конфигурацию в приложении
//     LOG_DEBUG << _("Использование конфигурации");
//     LOG_DEBUG << _("Порт сервера: ") << appConfig.server.port;
//     LOG_DEBUG << _("Адрес сервера: ") << appConfig.server.address;
//     LOG_DEBUG << _("Количество потоков: ") << appConfig.server.threads;

//     LOG_DEBUG << _("Конфигурация базы данных: ");
//     LOG_DEBUG << _("Хост базы данных: ") << appConfig.database.host;
//     LOG_DEBUG << _("Порт базы данных: ") << appConfig.database.port;
//     LOG_DEBUG << _("Пользователь базы данных: ") << appConfig.database.user;
//     LOG_DEBUG << _("Пароль базы данных: ") << appConfig.database.password;
//     LOG_DEBUG << _("Имя базы данных: ") << appConfig.database.name;

//     LOG_DEBUG << _("Конфигурация логирования: ");
//     LOG_DEBUG << _("Уровень логирования: ") << appConfig.logging.level;
//     LOG_DEBUG << _("Файл логирования: ") << appConfig.logging.file;

//     LOG_DEBUG << _("Таймаут: ") << appConfig.timeout;

//     // Пример использования аргументов командной строки
//     std::optional<std::string> dbHost = config.getCommandLineArgument("db-host");
//     if (dbHost.has_value())
//     {
//         // Обработка аргумента командной строки
//         LOG_DEBUG << _("Хост базы данных из аргумента командной строки: ") << dbHost.value();
//     }

//     // ... Дальнейший код приложения, использующий appConfig ...

//     return 0;
// }
