#pragma once

#include <string>
#include <vector>
#include <locale>
#include <unordered_map>
#include <memory>
#include <iostream>
#include <stdexcept>

enum class Language
{
    RU,
    EN,
    TR,
    UNKNOWN
    // Добавьте другие языки по мере необходимости
};

// Структура для хранения информации о локали
struct LocaleInfo
{
    std::string languageCode;
    std::string languageName;
    std::string localeName;
};

// В заголовочном файле
enum class LocalizationInfoType
{
    NAME,  // Для получения имени языка
    CODE,  // Для получения кода языка
    LOCALE // Для получения локали
};

class ILocalization
{
public:
    virtual ~ILocalization() = default;

    // Добавляем статический метод getInstance
    // friend ILocalization &getInstance(const std::string &localePath, const Language &language);
    static ILocalization &getInstance(const std::string &localePath = "", const Language &language = Language::RU);

    virtual bool setLanguage(const Language &language) = 0;
    virtual std::locale setLocale(const Language &language) const = 0;
    virtual std::string getLocalizationFileName(const Language &language) const = 0;
    virtual std::string getLocalizationInfo(
        const Language &language,
        LocalizationInfoType infoType = LocalizationInfoType::NAME) const = 0;
    virtual void setDefaultLanguage(const Language &language) = 0;
    virtual const Language &getDefaultLanguage() const = 0;
    virtual const Language &getCurrentLanguage() const = 0;
    virtual std::vector<std::string> getAvailableLanguageNames() const = 0;
    virtual bool languageExists(const Language &language) const = 0;
    virtual const std::string &translate(const std::string &text) const = 0;
};
