#include <gtest/gtest.h>
#include <fstream>
#include <filesystem> // C++17 или более поздняя версия

#include "../hpp/kvpLocalization.hpp"
// #include "../hpp/crowLib.hpp"

// Создаем фикстуру для тестов
class LocalizationManagerTest : public ::testing::Test
{
protected:
    std::string localePathTest;
    LocalizationManager *localizationManager; // Изменено на указатель

    LocalizationManagerTest() : localizationManager(nullptr) // Инициализируем nullptr
    {
    }

    void SetUp() override
    {
        // Инициализируем менеджер локализации
        localizationManager = &LocalizationManager::getInstance("kvaspro"); // Инициализация в SetUp()
        localePathTest = localizationManager->localePath;
        // Создаем тестовые файлы локализации
        createTestLocaleFiles();
    }

    void TearDown() override
    {
        // Удаляем тестовые файлы локализации
        // removeTestLocaleFiles();
    }

    void createTestLocaleFiles()
    {
        std::filesystem::create_directories(localePathTest); // Создаем директорию, если её нет

        std::ofstream trFile(localePathTest + "/tr.json");
        trFile << R"({"Привет": "merhaba", "Мир": "dünya"})";
        trFile.close();

        std::ofstream enFile(localePathTest + "/en.json");
        enFile << R"({"Привет": "hello", "Мир": "world"})";
        enFile.close();
    }

    void removeTestLocaleFiles()
    {
        std::filesystem::remove(localePathTest + "/tr.json");
        std::filesystem::remove(localePathTest + "/en.json");
    }
};

// Тесты для метода getLocalizationFileName
TEST_F(LocalizationManagerTest, GetLocalizationFileName_ValidLanguage_ReturnsCorrectFileName)
{
    EXPECT_EQ(localizationManager->getLocalizationFileName(Language::RU), "");
    EXPECT_EQ(localizationManager->getLocalizationFileName(Language::EN), localePathTest + "/en.json");
    EXPECT_EQ(localizationManager->getLocalizationFileName(Language::TR), localePathTest + "/tr.json");
}
TEST_F(LocalizationManagerTest, GetLocalizationFileName_UnknownLanguage_ReturnsEmptyString)
{
    EXPECT_EQ(localizationManager->getLocalizationFileName(Language::UNKNOWN), "");
}

TEST_F(LocalizationManagerTest, LanguageExists)
{
    EXPECT_TRUE(localizationManager->languageExists(Language::RU));
    EXPECT_TRUE(localizationManager->languageExists(Language::TR));
    EXPECT_TRUE(localizationManager->languageExists(Language::EN));
}
TEST_F(LocalizationManagerTest, LanguageExists_NonExistingLanguage_ReturnsFalse)
{
    EXPECT_FALSE(localizationManager->languageExists(Language::UNKNOWN));
}

TEST_F(LocalizationManagerTest, SetLanguage_InvalidLanguage_ReturnsFalse)
{
    EXPECT_FALSE(localizationManager->setLanguage(Language::UNKNOWN));
    // Проверяем, что язык не изменился
    EXPECT_EQ(localizationManager->currentLanguageCodeName, "ru");
}

// Тесты для метода getLocalizationInfo по полю "CODE"
TEST_F(LocalizationManagerTest, getLocalizationInfo_CODE)
{

    EXPECT_EQ(localizationManager->getLocalizationInfo(Language::RU, LocalizationInfoType::CODE), "ru");
    EXPECT_EQ(localizationManager->getLocalizationInfo(Language::TR, LocalizationInfoType::CODE), "tr");
    EXPECT_EQ(localizationManager->getLocalizationInfo(Language::EN, LocalizationInfoType::CODE), "en");
}

TEST_F(LocalizationManagerTest, getLocalizationInfo_UnknownLanguage_ReturnsEmptyString)
{
    EXPECT_EQ(localizationManager->getLocalizationInfo(Language::UNKNOWN, LocalizationInfoType::CODE), "unknown");
}

// Тесты для метода getLocalizationInfo по полю "LOCALE"
TEST_F(LocalizationManagerTest, getLocalizationInfo_LOCALE)
{

    EXPECT_EQ(localizationManager->getLocalizationInfo(Language::RU, LocalizationInfoType::LOCALE), "ru_RU.UTF-8");
    EXPECT_EQ(localizationManager->getLocalizationInfo(Language::TR, LocalizationInfoType::LOCALE), "tr_TR.UTF-8");
    EXPECT_EQ(localizationManager->getLocalizationInfo(Language::EN, LocalizationInfoType::LOCALE), "en_US.UTF-8");
}

// Тесты для метода getLocalizationInfo по полю "NAME"
TEST_F(LocalizationManagerTest, getLocalizationInfo_LANGUAGE)
{

    EXPECT_EQ(localizationManager->getLocalizationInfo(Language::RU, LocalizationInfoType::NAME), "Русский");
    EXPECT_EQ(localizationManager->getLocalizationInfo(Language::TR, LocalizationInfoType::NAME), "Türkçe");
    EXPECT_EQ(localizationManager->getLocalizationInfo(Language::EN, LocalizationInfoType::NAME), "English");
}

// Тесты для метода setDefaultLanguage
TEST_F(LocalizationManagerTest, SetDefaultLanguage_SetsDefaultLanguageCorrectly)
{
    localizationManager->setDefaultLanguage(Language::EN);
    // Проверяем, что язык по умолчанию изменился (можно добавить проверку через отдельный метод, если он есть)
    // В данном случае, мы можем только косвенно проверить через сброс языка
    localizationManager->setLanguage(Language::TR);
    EXPECT_EQ(localizationManager->currentLanguageCodeName, "tr");
    localizationManager->setLanguage(Language::RU); // Сбрасываем на дефолтный
    EXPECT_EQ(localizationManager->currentLanguageCodeName, "ru");
}

// Тесты для метода getAvailableLanguageNames
TEST_F(LocalizationManagerTest, GetAvailableLanguageNames_ReturnsCorrectListOfLanguages)
{
    std::vector<std::string> expectedLanguages = {"ru", "en", "tr"};
    std::vector<std::string> actualLanguages = localizationManager->getAvailableLanguageNames();
    std::sort(expectedLanguages.begin(), expectedLanguages.end());
    std::sort(actualLanguages.begin(), actualLanguages.end());
    EXPECT_EQ(expectedLanguages, actualLanguages);
}

TEST_F(LocalizationManagerTest, TranslateRussian)
{
    localizationManager->setLanguage(Language::RU);
    EXPECT_EQ(localizationManager->translate("Привет"), "Привет");
    EXPECT_EQ(localizationManager->translate("Мир"), "Мир");
}

TEST_F(LocalizationManagerTest, TranslateEnglish)
{
    localizationManager->setLanguage(Language::EN);
    EXPECT_EQ(localizationManager->translate("Привет"), "hello");
    EXPECT_EQ(localizationManager->translate("Мир"), "world");
}

TEST_F(LocalizationManagerTest, TranslateTurkish)
{
    localizationManager->setLanguage(Language::TR);
    EXPECT_EQ(localizationManager->translate("Привет"), "merhaba");
    EXPECT_EQ(localizationManager->translate("Мир"), "dünya");
}

TEST_F(LocalizationManagerTest, Translate_NonExistingTranslation_ReturnsOriginalString)
{
    EXPECT_EQ(localizationManager->translate("Несуществующий текст"), "Несуществующий текст");
}

TEST_F(LocalizationManagerTest, Translate_NonExistingTranslation_CurrentLanguageUnknown_ReturnsOriginalString)
{
    localizationManager->setLanguage(Language::UNKNOWN);
    EXPECT_EQ(localizationManager->translate("Привет"), "Привет");
}

// Тесты для глобальной функции _()
TEST_F(LocalizationManagerTest, GlobalTranslateFunction_ExistingTranslation_ReturnsTranslatedString)
{
    EXPECT_EQ(_("Привет"), "Привет");
    localizationManager->setLanguage(Language::EN);
    EXPECT_EQ(_("Привет"), "hello");
    localizationManager->setLanguage(Language::TR);
    EXPECT_EQ(_("Мир"), "dünya");
}

TEST_F(LocalizationManagerTest, GlobalTranslateFunction_NonExistingTranslation_ReturnsOriginalString)
{
    EXPECT_EQ(_("Несуществующий текст"), "Несуществующий текст");
}

// Тест на повторную инициализацию getInstance с appPath
TEST(LocalizationManagerInitialization, GetInstance_ReinitializationWithAppPath_PrintsWarning)
{
    // Перенаправляем cerr в буфер для проверки вывода
    std::stringstream buffer;
    std::streambuf *old = std::cerr.rdbuf(buffer.rdbuf());

    LocalizationManager::getInstance("some_path");                  // Первая инициализация
    LocalizationManager::getInstance("another_path", Language::EN); // Повторная инициализация

    // Восстанавливаем cerr
    std::cerr.rdbuf(old);

    // Проверяем, что было выведено предупреждение
    EXPECT_NE(buffer.str().find("Замечание: LocalizationManager уже был инициализирован. Игнорируем новый appPath и язык."), std::string::npos);
}
