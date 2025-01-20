#include <filesystem>
#include <iostream>

#include "../hpp/kvpInitializeApp.hpp"
#include "../hpp/kvpFilesTools.hpp"

bool initializeApp(int argc, char *argv[], IConfig **config, ILocalization **locManager)
{
    try
    {
        std::string _appRootPath = findAppFolder(std::string(argv[0]));
        std::cout << "Корневая папка программы: " << _appRootPath << std::endl;

        if (_appRootPath.empty())
        {
            std::cerr << "Ошибка: findAppFolder вернул пустой путь." << std::endl;
            return false;
        }

        // 1. Инициализация логгера (теперь после создания config)
        logger::init_logger(_appRootPath + "/kvaspro.log");

        // 3. Создание экземпляра конфигурации (БЕЗ локализации)
        *config = &IConfig::getInstance(_appRootPath + "/config.json");

        // 2. Инициализация менеджера локализации
        std::string localesPath = std::filesystem::path(_appRootPath) / "locales";
        *locManager = &LocalizationManager::getInstance(localesPath);

        (*config)->initCommandLine(argc, argv);
        (*config)->load();
        // Устанавливаем LocalizationManager в Config (если необходимо)
        if (*config)
            (*config)->setLocalization(*locManager);

        std::cout << "Файл конфигурации: " << (*config)->getAppRootPath() + "/config.json" << std::endl;
        return true;
    }
    catch (const std::exception &e)
    {
        // Используем std::cerr, так как логгер может быть еще не инициализирован
        std::cerr << "Ошибка инициализации приложения: " << e.what() << std::endl;
        return false;
    }
}

// // Реализация функции инициализации
// bool initializeApp(int argc, char *argv[], IConfig **config, LocalizationManager **locManager)
// {
//     try
//     {
//         // 1. Получаем путь к директории программы
//         std::string _appRootPath = findAppFolder(std::string(argv[0]));
//         std::cout << "Корневая папка программы: " << _appRootPath << std::endl;

//         if (_appRootPath.empty())
//         {
//             std::cerr << "Ошибка: findAppFolder вернул пустой путь." << std::endl;
//             return false;
//         }

//         // 2. Создание экземпляра конфигурации
//         *config = &IConfig::getInstance(_appRootPath + "/config.json");
//         (*config)->initCommandLine(argc, argv);
//         (*config)->load();

//         std::cout << "Файл конфигурации: " << (*config)->getAppRootPath() + "/config.json" << std::endl;
//         std::cout << "Папка с файлами перевода: " << (*config)->getAppRootPath() + "/locales" << std::endl;

//         // 3. Инициализация логгера (теперь после создания config)
//         logger::init_logger(_appRootPath + "/kvaspro.log", logger::kvpLogLevel::Info);

//         // 4. Инициализация менеджера локализации (теперь после создания config и логгера)
//         std::string localesPath = std::filesystem::path(_appRootPath) / "locales";
//         *locManager = &LocalizationManager::getInstance(localesPath, Language::RU);

//         return true;
//     }
//     catch (const std::exception &e)
//     {
//         std::cerr << "Ошибка инициализации приложения: " << e.what() << std::endl;
//         return false;
//     }
// }