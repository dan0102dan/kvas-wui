#pragma once

#include <fstream>
#include <map>

#include "kvpLogger.hpp"
#include "kvpInfaceConfig.hpp"

// Карта соответствия между языками и локалью
static const std::map<Language, LocaleInfo> localeMap = {
    {Language::RU, {"ru", "Русский", "ru_RU.UTF-8"}},
    {Language::TR, {"tr", "Türkçe", "tr_TR.UTF-8"}},
    {Language::EN, {"en", "English", "en_US.UTF-8"}},
};

class LocalizationManager : public ILocalization
{
private:
    std::unordered_map<std::string, std::string> translations;
    Language defaultLanguage = Language::RU;
    Language currentLanguage = Language::RU;

    std::string appLocalePath;             // Задаем путь папке к локализации
    std::string localeExtension = ".json"; // Задаем расширение файла локализации

    void loadTranslations(const Language &language);

    // Объявляем ILocalization::getInstance дружественной функцией
    friend ILocalization &ILocalization::getInstance(const std::string &localePath, const Language &language);

    // Объявляем класс для тестов как friend
    friend class LocalizationManagerTest;

    logger::ILogger *logger_;
    IConfig *config_;

public:
    LocalizationManager(const std::string &localePath, const Language &language, logger::ILogger *logger = nullptr, IConfig *config = nullptr);

    // Добавляем метод для установки logger и config
    void setLoggerAndConfig(logger::ILogger *logger, IConfig *config);

    // Установить текущий язык
    bool setLanguage(const Language &language) override;

    // Функция для установки локали в зависимости от языка
    std::locale setLocale(const Language &language) const override;

    // Получить файл названия локализации
    std::string getLocalizationFileName(const Language &language) const override;

    // Получить название локализации типа "ru"
    std::string getLocalizationInfo(
        const Language &language,
        LocalizationInfoType infoType = LocalizationInfoType::NAME) const override;

    // Установить язык по умолчанию
    void setDefaultLanguage(const Language &language) override;

    // Получить язык по умолчанию
    const Language &getDefaultLanguage() const override { return defaultLanguage; }

    // Получить текущий язык
    const Language &getCurrentLanguage() const override { return currentLanguage; }

    // Получить список доступных языков
    std::vector<std::string> getAvailableLanguageNames() const override;

    // Проверить, существует ли язык
    bool languageExists(const Language &language) const override;

    // Перевод строки
    const std::string &translate(const std::string &text) const override;

    // Имя текущего языка
    std::string currentLanguageCodeName;

    // Статический метод для получения экземпляра (возвращаем обратно)
    // static LocalizationManager &getInstance(const std::string &localePath = "", const Language &language = Language::RU);
    // Деструктор
    ~LocalizationManager() = default;
};

// Глобальная функция для перевода (с аргументом по умолчанию)
inline const std::string &_(const std::string &text, ILocalization *localization = nullptr);
