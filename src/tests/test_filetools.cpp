#include <gtest/gtest.h>
#include <filesystem>

#include "../hpp/kvpFilesTools.hpp"

namespace fs = std::filesystem;

class FindAppFolderTest : public ::testing::Test
{
protected:
    void SetUp() override
    {
        // Создаем временную структуру директорий для тестов
        test_root = fs::temp_directory_path() / "findappfolder_test";
        fs::create_directories(test_root);

        // Создаем тестовую программу и структуру директорий
        app_path = test_root / "testapp";
        fs::create_directories(app_path);
        test_executable = app_path / "testprogram";

        // Создаем пустой файл как тестовый исполняемый файл
        std::ofstream(test_executable).close();
    }

    void TearDown() override
    {
        // Удаляем временную тестовую директорию
        fs::remove_all(test_root);
    }

    fs::path test_root;
    fs::path app_path;
    fs::path test_executable;
};

// Тест поиска программы без указания директории локализации
TEST_F(FindAppFolderTest, FindsProgramPathWithoutLangDir)
{
    std::string result = findAppFolder(test_executable.string());
    EXPECT_EQ(result, app_path.string());
}

// Тест поиска с существующей директорией локализации
TEST_F(FindAppFolderTest, FindsExistingLocaleDirectory)
{
    // Создаем директорию локализации
    fs::path locale_dir = app_path / "locale";
    fs::create_directories(locale_dir);

    std::string result = findAppFolder(test_executable.string(), "locale");
    EXPECT_EQ(result, locale_dir.string());
}

// Тест создания отсутствующей директории локализации
TEST_F(FindAppFolderTest, CreatesNonExistentLocaleDirectory)
{
    std::string result = findAppFolder(test_executable.string(), "newlocale");
    fs::path expected_path = app_path / "newlocale";

    EXPECT_EQ(result, expected_path.string());
    EXPECT_TRUE(fs::exists(expected_path));
}

// Тест с несуществующей программой
TEST_F(FindAppFolderTest, HandlesNonExistentProgram)
{
    std::string result = findAppFolder("nonexistentprogram");
    EXPECT_EQ(result, "/opt/apps/nonexistentprogram");
}

// Тест с несуществующей программой и директорией локализации
TEST_F(FindAppFolderTest, HandlesNonExistentProgramWithLangDir)
{
    std::string result = findAppFolder("nonexistentprogram", "locale");
    EXPECT_EQ(result, "/opt/apps/nonexistentprogram/locale");
}

// Тест с абсолютным путем
TEST_F(FindAppFolderTest, HandlesAbsolutePath)
{
    std::string result = findAppFolder(test_executable.string(), "locale");
    fs::path expected_path = app_path / "locale";
    EXPECT_EQ(result, expected_path.string());
}

// Тест с путем, содержащим пробелы
TEST_F(FindAppFolderTest, HandlesPathWithSpaces)
{
    fs::path space_path = test_root / "test program";
    fs::create_directories(space_path);
    fs::path space_executable = space_path / "testprogram";
    std::ofstream(space_executable).close();

    std::string result = findAppFolder(space_executable.string(), "locale");
    fs::path expected_path = space_path / "locale";
    EXPECT_EQ(result, expected_path.string());
}

// Тест с путем, содержащим специальные символы
TEST_F(FindAppFolderTest, HandlesSpecialCharacters)
{
    fs::path special_path = test_root / "test-program_123";
    fs::create_directories(special_path);
    fs::path special_executable = special_path / "testprogram";
    std::ofstream(special_executable).close();

    std::string result = findAppFolder(special_executable.string(), "locale");
    fs::path expected_path = special_path / "locale";
    EXPECT_EQ(result, expected_path.string());
}

// Тест на отсутствие прав доступа
TEST_F(FindAppFolderTest, HandlesPermissionDenied)
{
    // Создаем директорию с ограниченными правами
    fs::path restricted_path = test_root / "restricted";
    fs::create_directories(restricted_path);
    fs::permissions(restricted_path,
                    fs::perms::none,
                    fs::perm_options::replace);

    std::string result = findAppFolder("testprogram", "locale");
    // Должен вернуть путь по умолчанию, так как не может получить доступ
    EXPECT_EQ(result, "/opt/apps/testprogram/locale");

    // Восстанавливаем права для очистки
    fs::permissions(restricted_path,
                    fs::perms::owner_all,
                    fs::perm_options::replace);
}

// Тест на поиск в текущей директории
TEST_F(FindAppFolderTest, FindsInCurrentDirectory)
{
    // Сохраняем текущую директорию
    fs::path original_path = fs::current_path();

    try
    {
        // Меняем текущую директорию на тестовую
        fs::current_path(app_path);

        std::string result = findAppFolder("testprogram");
        EXPECT_EQ(result, app_path.string());

        // Возвращаем исходную директорию
        fs::current_path(original_path);
    }
    catch (...)
    {
        // Обеспечиваем возврат в исходную директорию в случае ошибки
        fs::current_path(original_path);
        throw;
    }
}

// Тест на создание вложенных директорий локализации
TEST_F(FindAppFolderTest, CreatesNestedLocaleDirectories)
{
    std::string nested_locale = "locale/ru/LC_MESSAGES";
    std::string result = findAppFolder(test_executable.string(), nested_locale);
    fs::path expected_path = app_path / nested_locale;

    EXPECT_EQ(result, expected_path.string());
    EXPECT_TRUE(fs::exists(expected_path));
}

// Тест на обработку пустого имени файла
TEST_F(FindAppFolderTest, HandlesEmptyFileName)
{
    std::string result = findAppFolder("", "locale");
    EXPECT_EQ(result, "/opt/apps//locale");
}
