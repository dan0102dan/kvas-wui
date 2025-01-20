#include <iostream>

#include "../hpp/kvpLogger.hpp"       // Библиотека Логирования
#include "../hpp/kvpLocalization.hpp" // Библиотека Локализации
#include "../hpp/kvpFilesTools.hpp"   // Библиотека Инструментов

namespace fs = std::filesystem;

std::string findAppFolder(const std::string &appFileName, const std::string &lang_dir)
{
    // Определение стандартных путей
    const std::string opt_path = "/opt";
    const std::string default_apps_path = opt_path + "/apps";

    // Получаем имя программы без пути
    const fs::path file_path(appFileName);
    const auto program_name = file_path.filename().native();

    // Если передан полный путь, проверяем его
    if (file_path.is_absolute())
    {
        if (fs::exists(file_path) && fs::is_regular_file(file_path) && (fs::status(file_path).permissions() & fs::perms::owner_exec) != fs::perms::none)
        {
            const fs::path program_dir = file_path.parent_path();
            return program_dir.string(); // Всегда возвращаем директорию программы
        }
    }

    // Список стандартных путей для поиска
    const std::vector<fs::path> search_paths = {
        default_apps_path,
        fs::current_path(),
        opt_path,
    };

    // Ищем в каждом пути
    for (const auto &base_path : search_paths)
    {
        try
        {
            if (!fs::exists(base_path))
                continue;

            // Ищем рекурсивно в текущем пути
            for (const auto &entry : fs::recursive_directory_iterator(
                     base_path,
                     fs::directory_options::skip_permission_denied))
            {
                try
                {
                    // Проверяем, является ли текущий элемент исполняемым файлом с нужным именем
                    if (entry.is_regular_file() && entry.path().filename().native() == program_name &&
                        (fs::status(entry.path()).permissions() & fs::perms::owner_exec) != fs::perms::none)
                    {
                        // Получаем путь к директории программы
                        const fs::path program_dir = entry.path().parent_path();
                        return program_dir.string(); // Всегда возвращаем директорию программы
                    }
                }
                catch (const fs::filesystem_error &)
                {
                    continue; // Пропускаем недоступные файлы/директории
                }
            }
        }
        catch (const fs::filesystem_error &)
        {
            continue; // Пропускаем недоступные пути
        }
    }

    // Если ничего не найдено, возвращаем путь по умолчанию
    const fs::path default_path = fs::path(default_apps_path) / program_name;

    try
    {
        fs::create_directories(default_path);
        return default_path.string();
    }
    catch (const fs::filesystem_error &e)
    {
        std::cerr << "Не удалось создать директорию по умолчанию: " << e.what() << std::endl;
        throw; // Пробрасываем исключение наверх
    }
}

//

// std::string findAppFolder(const std::string &appFileName, const std::string &lang_dir)
// {
//     // Определение стандартных путей
//     const std::string opt_path = "/opt";
//     const std::string default_apps_path = opt_path + "/apps";

//     // Получаем имя программы без пути
//     const fs::path file_path(appFileName);
//     const auto program_name = file_path.filename().native();

//     // Если передан полный путь, проверяем его
//     if (file_path.is_absolute())
//     {
//         if (fs::exists(file_path) && fs::is_regular_file(file_path) && (fs::status(file_path).permissions() & fs::perms::owner_exec) != fs::perms::none)
//         {
//             const fs::path program_dir = file_path.parent_path();
//             if (lang_dir.empty())
//             {
//                 return program_dir.string();
//             }

//             const fs::path locale_path = program_dir / lang_dir;
//             if (fs::exists(locale_path) && fs::is_directory(locale_path))
//             {
//                 return locale_path.string();
//             }

//             try
//             {
//                 fs::create_directories(locale_path);
//                 return locale_path.string();
//             }
//             catch (const fs::filesystem_error &e)
//             {
//                 LOG_DEBUG << _("Не удалось создать директорию локализации: ") << e.what();
//                 return ""; // Возвращаем пустую строку в случае ошибки
//             }
//         }
//     }

//     // Список стандартных путей для поиска
//     const std::vector<fs::path> search_paths = {
//         default_apps_path,
//         fs::current_path(),
//         opt_path,
//     };

//     // Ищем в каждом пути
//     for (const auto &base_path : search_paths)
//     {
//         try
//         {
//             if (!fs::exists(base_path))
//                 continue;

//             // Ищем рекурсивно в текущем пути
//             for (const auto &entry : fs::recursive_directory_iterator(
//                      base_path,
//                      fs::directory_options::skip_permission_denied))
//             {
//                 try
//                 {
//                     // Проверяем, является ли текущий элемент исполняемым файлом с нужным именем
//                     if (entry.is_regular_file() && entry.path().filename().native() == program_name &&
//                         (fs::status(entry.path()).permissions() & fs::perms::owner_exec) != fs::perms::none)
//                     {
//                         // Получаем путь к директории программы
//                         const fs::path program_dir = entry.path().parent_path();

//                         // Если lang_dir не задана, возвращаем путь до программы
//                         if (lang_dir.empty())
//                         {
//                             return program_dir.string();
//                         }

//                         // Проверяем наличие директории локализации
//                         const fs::path locale_path = program_dir / lang_dir;
//                         if (fs::exists(locale_path) && fs::is_directory(locale_path))
//                         {
//                             return locale_path.string();
//                         }

//                         // Если директории локализации нет, создаем её
//                         try
//                         {
//                             fs::create_directories(locale_path);
//                             return locale_path.string();
//                         }
//                         catch (const fs::filesystem_error &e)
//                         {
//                             LOG_DEBUG << _("Не удалось создать директорию локализации: ") << e.what();
//                             return ""; // Возвращаем пустую строку в случае ошибки
//                         }
//                     }
//                 }
//                 catch (const fs::filesystem_error &)
//                 {
//                     continue; // Пропускаем недоступные файлы/директории
//                 }
//             }
//         }
//         catch (const fs::filesystem_error &)
//         {
//             continue; // Пропускаем недоступные пути
//         }
//     }

//     // Если ничего не найдено, возвращаем путь по умолчанию с созданием директории
//     const fs::path default_path = lang_dir.empty() ? fs::path(default_apps_path) / program_name : fs::path(default_apps_path) / program_name / lang_dir;

//     try
//     {
//         fs::create_directories(default_path);
//         return default_path.string();
//     }
//     catch (const fs::filesystem_error &e)
//     {
//         LOG_DEBUG << _("Не удалось создать директорию по умолчанию: ") << e.what();
//         return ""; // Возвращаем пустую строку в случае ошибки
//     }
// }
