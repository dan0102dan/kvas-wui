// Собственные заголовочные файлы
#include "../hpp/kvpLocalization.hpp" // Менеджер локализации
#include "../hpp/crowLib.hpp"         // Библиотека Инструментов

// Статический метод для получения экземпляра (возвращаем обратно)
ILocalization &getInstance(const std::string &localePath, const Language &language)
// ILocalization &ILocalization::getInstance(const std::string &localePath = "", const Language &language = Language::RU)
{
    static std::unique_ptr<LocalizationManager> instance;

    if (!instance)
    {
        // Проверяем, что localePath не пустой
        std::string locPath = localePath.empty() ? appLocalePath : localePath;
        if (locPath)
        {
            throw std::runtime_error(_("LocalizationManager: appLocalePath не может быть пустой в момент инициализации."));
        }

        // Получаем логгер
        logger::ILogger *actualLogger = nullptr;
        actualLogger = logger::global_logger.get();
        if (logger::global_logger)
        {
            actualLogger = logger::global_logger.get();
        }
        else
        {
            LOG_WARNING << _("Глобальный логгер не инициализирован. Локализация будет использовать nullptr.");
        }

        // Получаем конфиг
        IConfig *actualConfig = nullptr;
        // actualConfig = &IConfig::getInstance();
        try
        {
            actualConfig = &IConfig::getInstance();
        }
        catch (const std::runtime_error &e)
        {
                LOG_ERROR << _("Не удалось получить экземпляр IConfig: ") + e.what());
        }
        instance.reset(new LocalizationManager(localePath, language, actualLogger, actualConfig));
        // instance = std::make_unique<LocalizationManager>(localePath, language, actualLogger, actualConfig);
    }
    else if (!localePath.empty())
    {
        LOG_INFO << _("LocalizationManager уже был инициализирован. Игнорируем новый localePath, язык и useGlobals.");
    }

    return *instance;
}

LocalizationManager::LocalizationManager(const std::string &localePath, const Language &language, logger::ILogger *logger, IConfig *config)
    : defaultLanguage(language), currentLanguage(language), appLocalePath(localePath), logger_(logger), config_(config)
{
    // Получаем путь к директории локализации
    appLocalePath = localePath;

    // Устанавливаем язык перевода по умолчанию
    setDefaultLanguage(language);

    // Устанавливаем локаль
    std::locale loc = setLocale(language);
    std::cout.imbue(loc);
    std::cerr.imbue(loc);

    // Устанавливаем текущий язык перевода
    if (!setLanguage(language))
    {
        std::cerr << "[Конструктор LocalizationManager] Не удалось установить язык на '" << currentLanguageCodeName << "'!" << std::endl;
    }

    // Загрузить переводы для языка по умолчанию
    loadTranslations(defaultLanguage);
}

// Функция для установки и возврата локали в зависимости от языка
std::locale LocalizationManager::setLocale(const Language &language) const
{
    auto it = localeMap.find(language);
    if (it != localeMap.end())
    {
        return std::locale(it->second.localeName);
    }
    else
    {
        // Если язык не поддерживается, вернуть стандартную локаль
        return std::locale::global(std::locale(""));
    }
}

// Загрузить переводы из файла локализации
void LocalizationManager::loadTranslations(const Language &language)
{
    translations.clear();

    // Если язык отличается от русского, загружаем переводы
    if (language != Language::RU)
    {

        std::string filePath = getLocalizationFileName(language);
        std::ifstream file(filePath);

        if (!file.is_open())
        {
            std::cerr << "[LocalizationManager::loadTranslations] Файл локализации " << filePath << " не может быть открыт" << std::endl;
            return;
        }

        std::ostringstream contents;
        contents << file.rdbuf();
        auto json = crow::json::load(contents.str());

        if (!json)
        {
            std::cerr << "[LocalizationManager::loadTranslations] Недопустимый JSON-формат в файле: " << filePath << std::endl;
            return;
        }

        for (const auto &item : json)
        {
            translations[item.key()] = item.s();
        }
    }
}

// Получить информацию о локализации (имя языка или код или название локали)
std::string LocalizationManager::getLocalizationInfo(const Language &language, LocalizationInfoType infoType) const
{
    auto it = localeMap.find(language);
    if (it != localeMap.end())
    {
        switch (infoType)
        {
        case LocalizationInfoType::NAME:
            return it->second.languageName;
        case LocalizationInfoType::CODE:
            return it->second.languageCode;
        case LocalizationInfoType::LOCALE:
            return it->second.localeName;
        default:
            std::cerr << "[LocalizationManager::getLocalizationInfo] Неизвестный тип информации: "
                      << std::to_string(static_cast<int>(infoType)) << std::endl;
            return "unknown";
        }
    }
    else
    {
        std::cerr << "[LocalizationManager::getLocalizationInfo] Неизвестный язык с кодом: "
                  << std::to_string(static_cast<int>(language)) << std::endl;
        return "unknown";
    }
}

// Получить файл названия локализации
std::string LocalizationManager::getLocalizationFileName(const Language &language) const
{
    if (language == Language::RU || language == Language::UNKNOWN)
        return "";
    else
    {
        if (appLocalePath.empty())
        {
            std::string message = "[LocalizationManager::getLocalizationFileName] Директория локализации " + appLocalePath + " не найдена";
            throw std::runtime_error(message);
        }

        // std::cout << "[getLocalizationFileName] appLocalePath: " << appLocalePath << std::endl;

        return appLocalePath + "/" + getLocalizationInfo(language, LocalizationInfoType::CODE) + localeExtension;
    }
}

// Установить язык по умолчанию
void LocalizationManager::setDefaultLanguage(const Language &language)
{
    defaultLanguage = language;
}

// Получить список доступных языков
std::vector<std::string> LocalizationManager::getAvailableLanguageNames() const
{
    std::vector<std::string> languages = {"ru"};
    for (const auto &entry : std::filesystem::directory_iterator(appLocalePath))
    {
        if (entry.path().extension() == localeExtension)
        {
            languages.push_back(entry.path().stem().string());
        }
    }

    return languages;
}

// Установить текущий язык
bool LocalizationManager::setLanguage(const Language &language)
{

    // Если язык отличается от русского, загружаем переводы
    if (language != Language::RU)
    {
        // Если хотят установить неизвестный язык
        if (Language::UNKNOWN == language)
        {
            // Устанавливаем язык по умолчанию
            defaultLanguage = Language::RU;
            currentLanguage = defaultLanguage;
            currentLanguageCodeName = getLocalizationInfo(defaultLanguage, LocalizationInfoType::CODE);
            std::cerr << "[LocalizationManager::setLanguage] Неизвестный язык с кодом: " << std::to_string(static_cast<int>(language)) << std::endl;
            return false;
        }
        else
        {
            // Получаем путь к файлу локализации
            std::string filePath = getLocalizationFileName(language);

            // std::cout << "Путь к файлу локализации: " << filePath << std::endl;

            // Проверяем, что файл локализации существует
            std::ifstream file(filePath);

            if (!file.is_open())
            {
                // Если файл локализации не существует, возвращаем false
                std::cerr << "[LocalizationManager::setLanguage] файл локализации " << filePath << " не существует: " << std::endl;
                return false; // Язык не найден
            }
            else
            {
                // Устанавливаем текущий язык
                currentLanguage = language;
                currentLanguageCodeName = getLocalizationInfo(language, LocalizationInfoType::CODE);
                // Загружаем переводы
                loadTranslations(language);
            }
        }
    }
    else
    {
        // Устанавливаем текущий язык
        currentLanguage = language;
        currentLanguageCodeName = getLocalizationInfo(language, LocalizationInfoType::CODE);
    }

    // Возвращаем true, если язык успешно установлен или если язык русский
    return true;
}

// Проверить, существует ли язык
bool LocalizationManager::languageExists(const Language &language) const
{
    if (language == Language::RU)
    {
        return true;
    }
    else
    {
        // Получаем путь к файлу локализации
        std::string filePath = getLocalizationFileName(language);
        // std::cout << "Путь к файлу локализации: " << filePath << std::endl;

        // Проверяем, что файл локализации существует
        std::ifstream file(filePath);
        return file.is_open();
    }
}

// Перевод строки на установленный текущий язык
const std::string &LocalizationManager::translate(const std::string &text) const
{
    static const std::string empty_string = "";

    try
    {
        // Проверяем входной текст
        if (text.empty())
        {
            return empty_string;
        }

        // Если язык текущий — русский, возвращаем строку как есть
        if (currentLanguage == Language::RU || currentLanguage == Language::UNKNOWN)
        {
            return text;
        }

        // Пытаемся найти перевод
        auto it = translations.find(text);
        if (it != translations.end() && !it->second.empty())
        {
            return it->second;
        }

        // Если перевод не найден или пустой, возвращаем оригинал
        return text;
    }
    catch (const std::exception &e)
    {
        std::cerr << "[LocalizationManager::translate] Возникла ошибка при переводе '" << text << "': " << e.what() << std::endl;
        // В случае любой ошибки возвращаем оригинальный текст
        return text;
    }
}

// Глобальная функция для перевода (с аргументом по умолчанию)
inline const std::string &_(const std::string &text, ILocalization *localization = nullptr)
{
    static const std::string empty_string = "";
    try
    {
        if (localization)
        {
            return localization->translate(text);
        }
        else
        {
            // Если localization не передан, используем глобальный экземпляр
            try
            {
                auto &_localizationManager = LocalizationManager::getInstance();
                _localizationManager.getInstance().translate(text);
            }
            catch (const std::runtime_error &e)
            {
                LOG_DEBUG << "Функция _(): не удалось получить экземпляр LocalizationManager: " << e.what();
                return text;
            }
        }
    }
    catch (const std::exception &e)
    {
        LOG_DEBUG << (std::string("Ошибка при переводе: ") + e.what());
        return empty_string;
    }
}