#include <gtest/gtest.h>
#include <fstream>
#include <sstream>
#include <regex>

#include "../hpp/kvpLogger.hpp"

class LoggerTest : public ::testing::Test
{
protected:
    void SetUp() override
    {
        // Создаем временный файл для тестирования
        test_log_file = "test_log.txt";
        logger::init_logger("/opt/apps/kvaspro/kvaspro", test_log_file, crow::LogLevel::Debug);
    }

    void TearDown() override
    {
        // Удаляем временный файл после тестов
        std::remove(("/opt/apps/kvaspro/" + test_log_file).c_str());
    }

    std::string test_log_file;
};

// Тест getCurrentTimeFormatted
TEST_F(LoggerTest, GetCurrentTimeFormattedTest)
{
    std::string time_str = logger::getCurrentTimeFormatted();
    ASSERT_FALSE(time_str.empty());
    // Проверяем формат: должно быть 18 символов (dd-mmm-yy HH:MM:SS)
    EXPECT_EQ(time_str.length(), 18);
}

// Тест FileLogger
TEST_F(LoggerTest, FileLoggerTest)
{
    // Создаем FileLogger
    logger::FileLogger file_logger(test_log_file);

    // Устанавливаем уровень логирования
    file_logger.setLogLevel(crow::LogLevel::Debug);

    // Логируем сообщение
    std::string test_message = "Test message";
    file_logger.log(test_message, crow::LogLevel::Debug);

    // Проверяем, что сообщение записалось в файл
    std::ifstream log_file(test_log_file);
    std::string line;
    std::getline(log_file, line);
    EXPECT_TRUE(line.find(test_message) != std::string::npos);
    EXPECT_TRUE(line.find("ОТЛАДКА") != std::string::npos);
}

// Тест CustomCrowLogger
TEST_F(LoggerTest, CustomCrowLoggerTest)
{
    // Перенаправляем cerr во временный буфер
    std::stringstream buffer;
    std::streambuf *old = std::cerr.rdbuf(buffer.rdbuf());

    logger::CustomCrowLogger custom_logger;
    custom_logger.setLogLevel(crow::LogLevel::Info);

    std::string test_message = "Test info message";
    custom_logger.log(test_message, crow::LogLevel::Info);

    // Восстанавливаем cerr
    std::cerr.rdbuf(old);

    // Проверяем, что сообщение было записано в буфер
    std::string output = buffer.str();
    EXPECT_TRUE(output.find(test_message) != std::string::npos);
    EXPECT_TRUE(output.find("ЗАМЕТКА") != std::string::npos);
}

// Тест MultiLogger
TEST_F(LoggerTest, MultiLoggerTest)
{
    logger::MultiLogger multi_logger;

    // Добавляем обработчики
    multi_logger.addHandler(std::make_unique<logger::FileLogger>(test_log_file));
    multi_logger.addHandler(std::make_unique<logger::CustomCrowLogger>());

    // Устанавливаем уровень логирования
    multi_logger.setLogLevel(crow::LogLevel::Warning);

    // Перенаправляем cerr во временный буфер
    std::stringstream buffer;
    std::streambuf *old = std::cerr.rdbuf(buffer.rdbuf());

    // Логируем сообщение
    std::string test_message = "Test warning message";
    multi_logger.log(test_message, crow::LogLevel::Warning);

    // Восстанавливаем cerr
    std::cerr.rdbuf(old);

    // Проверяем вывод в файл
    std::ifstream log_file(test_log_file);
    std::string line;
    std::getline(log_file, line);
    EXPECT_TRUE(line.find(test_message) != std::string::npos);
    EXPECT_TRUE(line.find("ПРЕДУПРЕЖДЕНИЕ") != std::string::npos);

    // Проверяем вывод в cerr
    std::string cerr_output = buffer.str();
    EXPECT_TRUE(cerr_output.find(test_message) != std::string::npos);
    EXPECT_TRUE(cerr_output.find("ПРЕДУПРЕЖДЕНИЕ") != std::string::npos);
}

// Тест на проверку уровней логирования
TEST_F(LoggerTest, LogLevelFilteringTest)
{
    logger::FileLogger file_logger(test_log_file);
    file_logger.setLogLevel(crow::LogLevel::Warning);

    // Сообщение с уровнем ниже установленного не должно логироваться
    file_logger.log("Debug message", crow::LogLevel::Debug);
    file_logger.log("Info message", crow::LogLevel::Info);

    // Сообщение с уровнем выше или равным установленному должно логироваться
    std::string warning_message = "Warning message";
    std::string error_message = "Error message";
    file_logger.log(warning_message, crow::LogLevel::Warning);
    file_logger.log(error_message, crow::LogLevel::Error);

    std::ifstream log_file(test_log_file);
    std::vector<std::string> lines;
    std::string line;
    while (std::getline(log_file, line))
    {
        lines.push_back(line);
    }

    // Должно быть только 2 сообщения (Warning и Error)
    EXPECT_EQ(lines.size(), 2);
    EXPECT_TRUE(lines[0].find(warning_message) != std::string::npos);
    EXPECT_TRUE(lines[1].find(error_message) != std::string::npos);
}

// Тест инициализации глобального логгера
TEST_F(LoggerTest, GlobalLoggerInitTest)
{
    // Перенаправляем cerr во временный буфер
    std::stringstream buffer;
    std::streambuf *old = std::cerr.rdbuf(buffer.rdbuf());

    // Инициализируем глобальный логгер
    logger::init_logger("./", test_log_file, crow::LogLevel::Info);

    auto message = "Тестовое сообщение из глобального логгера";
    // Проверяем, что глобальный логгер создан и работает
    CROW_LOG_INFO << message;

    // Восстанавливаем cerr
    std::cerr.rdbuf(old);

    // Проверяем вывод в файл и в cerr
    std::ifstream log_file(test_log_file);
    std::string line;
    std::getline(log_file, line);
    EXPECT_TRUE(line.find(message) != std::string::npos);

    std::string cerr_output = buffer.str();
    EXPECT_TRUE(cerr_output.find(message) != std::string::npos);
}

// Тест на обработку ошибок
TEST_F(LoggerTest, ErrorHandlingTest)
{
    // Попытка создать logger с несуществующим путем
    EXPECT_THROW(
        logger::FileLogger("/nonexistent/path/log.txt"),
        std::runtime_error);
}

// Тест на различные уровни логирования
TEST_F(LoggerTest, LogLevelsTest)
{
    logger::FileLogger file_logger(test_log_file);
    file_logger.setLogLevel(crow::LogLevel::Debug);

    std::vector<std::pair<crow::LogLevel, std::string>> test_cases = {
        {crow::LogLevel::Debug, "ОТЛАДКА"},
        {crow::LogLevel::Info, "ЗАМЕТКА"},
        {crow::LogLevel::Warning, "ПРЕДУПРЕЖДЕНИЕ"},
        {crow::LogLevel::Error, "ОШИБКА"},
        {crow::LogLevel::Critical, "КРИТИЧНО"}};

    for (const auto &test_case : test_cases)
    {
        std::string message = "Test message for " + std::to_string(static_cast<int>(test_case.first));
        file_logger.log(message, test_case.first);
    }

    std::ifstream log_file(test_log_file);
    std::vector<std::string> lines;
    std::string line;
    while (std::getline(log_file, line))
    {
        lines.push_back(line);
    }

    EXPECT_EQ(lines.size(), test_cases.size());
    for (size_t i = 0; i < lines.size(); ++i)
    {
        EXPECT_TRUE(lines[i].find(test_cases[i].second) != std::string::npos);
    }
}

// Тест на многопоточность
TEST_F(LoggerTest, ThreadSafetyTest)
{
    logger::FileLogger file_logger(test_log_file);
    file_logger.setLogLevel(crow::LogLevel::Debug);

    const int num_threads = 10;
    const int messages_per_thread = 100;
    std::vector<std::thread> threads;

    // Считаем существующие строки в файле
    std::ifstream log_file(test_log_file);
    std::vector<std::string> existing_lines;
    std::string line;
    while (std::getline(log_file, line))
    {
        existing_lines.push_back(line);
    }
    log_file.close();

    for (int i = 0; i < num_threads; ++i)
    {
        threads.emplace_back([&file_logger, i, messages_per_thread]()
                             {
            for (int j = 0; j < messages_per_thread; ++j) {
                std::string message = "Thread " + std::to_string(i) + 
                                    " Message " + std::to_string(j);
                file_logger.log(message, crow::LogLevel::Info);
            } });
    }

    for (auto &thread : threads)
    {
        thread.join();
    }

    // Проверяем, что все сообщения были записаны
    log_file.open(test_log_file);
    std::vector<std::string> lines;
    while (std::getline(log_file, line))
    {
        lines.push_back(line);
    }

    EXPECT_EQ(lines.size(), existing_lines.size() + num_threads * messages_per_thread);
}

// Тест на корректность форматирования времени
TEST_F(LoggerTest, TimeFormatTest)
{
    std::string time_str = logger::getCurrentTimeFormatted();

    // Проверяем формат даты и времени (dd-mmm-yy HH:MM:SS)
    std::regex time_pattern(R"(\d{2}-[A-Za-z]{3}-\d{2} \d{2}:\d{2}:\d{2})");
    EXPECT_TRUE(std::regex_match(time_str, time_pattern));
}

// Тест на переполнение буфера (продолжение)
TEST_F(LoggerTest, BufferOverflowTest)
{
    logger::FileLogger file_logger(test_log_file);

    // Создаем длинное сообщение
    std::string long_message(1024 * 1024, 'X'); // 1MB строка

    // Проверяем, что большое сообщение может быть записано
    EXPECT_NO_THROW(file_logger.log(long_message, crow::LogLevel::Info));

    // Проверяем, что сообщение было корректно записано
    std::ifstream log_file(test_log_file);
    std::string line;
    std::getline(log_file, line);
    EXPECT_TRUE(line.find(long_message) != std::string::npos);
}

// Тест на последовательное изменение уровня логирования
TEST_F(LoggerTest, LogLevelChangeTest)
{
    logger::MultiLogger multi_logger;
    multi_logger.addHandler(std::make_unique<logger::FileLogger>(test_log_file));

    std::string test_message = "Test message";

    // Тестируем последовательное изменение уровней логирования
    std::vector<crow::LogLevel> levels = {
        crow::LogLevel::Debug,
        crow::LogLevel::Info,
        crow::LogLevel::Warning,
        crow::LogLevel::Error,
        crow::LogLevel::Critical};

    for (auto level : levels)
    {
        multi_logger.setLogLevel(level);

        // Проверяем, что сообщения ниже текущего уровня не логируются
        for (auto test_level : levels)
        {
            multi_logger.log(test_message, test_level);
        }
    }

    std::ifstream log_file(test_log_file);
    std::vector<std::string> lines;
    std::string line;
    while (std::getline(log_file, line))
    {
        lines.push_back(line);
    }

    // Проверяем корректность фильтрации сообщений
    int expected_messages = 0;
    for (size_t i = 0; i < levels.size(); i++)
    {
        expected_messages += levels.size() - i;
    }
    EXPECT_EQ(lines.size(), expected_messages);
}

// Тест на корректность работы при отсутствии обработчиков
TEST_F(LoggerTest, NoHandlersTest)
{
    logger::MultiLogger multi_logger;

    // Логирование без обработчиков не должно вызывать ошибок
    EXPECT_NO_THROW(multi_logger.log("Test message", crow::LogLevel::Info));
}

// Тест на повторную инициализацию глобального логгера
TEST_F(LoggerTest, GlobalLoggerReInitTest)
{
    // Первая инициализация
    logger::init_logger("./", test_log_file, crow::LogLevel::Info);

    // Запоминаем указатель на первый логгер
    auto *first_logger = logger::global_logger.get();

    // Повторная инициализация не должна создавать новый логгер
    logger::init_logger("./", "another_log.txt", crow::LogLevel::Debug);

    // Проверяем, что указатель не изменился
    EXPECT_EQ(first_logger, logger::global_logger.get());
}

// Тест на обработку специальных символов в сообщениях (продолжение)
TEST_F(LoggerTest, SpecialCharactersTest)
{
    logger::FileLogger file_logger(test_log_file);

    std::string special_message = "Test\nwith\tspecial\rcharacters\n\r\t!@#$%^&*()";
    EXPECT_NO_THROW(file_logger.log(special_message, crow::LogLevel::Info));

    std::ifstream log_file(test_log_file);
    std::string line;
    std::getline(log_file, line);
    EXPECT_TRUE(line.find("Test") != std::string::npos);
}

// Тест на работу с Unicode символами
TEST_F(LoggerTest, UnicodeCharactersTest)
{
    logger::FileLogger file_logger(test_log_file);

    std::string unicode_message = "Тестовое сообщение с Unicode символами: 你好, こんにちは, 안녕하세요";
    EXPECT_NO_THROW(file_logger.log(unicode_message, crow::LogLevel::Info));

    std::ifstream log_file(test_log_file);
    std::string line;
    std::getline(log_file, line);
    EXPECT_TRUE(line.find("Тестовое сообщение") != std::string::npos);
}

// Тест на проверку очистки ресурсов
TEST_F(LoggerTest, ResourceCleanupTest)
{
    {
        logger::FileLogger file_logger(test_log_file);
        file_logger.log("Test message", crow::LogLevel::Info);
    } // Здесь должен вызваться деструктор

    // Проверяем, что файл все еще доступен для чтения
    std::ifstream log_file(test_log_file);
    EXPECT_TRUE(log_file.good());
}

// Тест на одновременное использование нескольких файловых логгеров
TEST_F(LoggerTest, MultipleFileLoggersTest)
{
    std::string second_log_file = "test_log2.txt";

    {
        logger::FileLogger logger1(test_log_file);
        logger::FileLogger logger2(second_log_file);

        std::string message = "Test multiple loggers";
        logger1.log(message, crow::LogLevel::Info);
        logger2.log(message, crow::LogLevel::Info);
    }

    // Проверяем оба файла
    std::ifstream file1(test_log_file);
    std::ifstream file2(second_log_file);

    std::string line1, line2;
    std::getline(file1, line1);
    std::getline(file2, line2);

    EXPECT_TRUE(line1.find("Test multiple loggers") != std::string::npos);
    EXPECT_TRUE(line2.find("Test multiple loggers") != std::string::npos);

    // Очистка
    std::remove(second_log_file.c_str());
}

// Тест на проверку атомарности записи (продолжение)
TEST_F(LoggerTest, AtomicWriteTest)
{
    logger::FileLogger file_logger(test_log_file);

    const int num_threads = 5;
    const int messages_per_thread = 1000;
    std::vector<std::thread> threads;

    // Считаем существующие строки в файле
    std::ifstream log_file(test_log_file);
    std::set<std::string> existing_messages;
    std::string line;
    while (std::getline(log_file, line))
    {
        existing_messages.insert(line);
    }
    log_file.close();

    auto start_time = std::chrono::high_resolution_clock::now();

    for (int i = 0; i < num_threads; ++i)
    {
        threads.emplace_back([&file_logger, i, messages_per_thread]()
                             {
            for (int j = 0; j < messages_per_thread; ++j) {
                std::string message = "Thread" + std::to_string(i) + 
                                    "_Message" + std::to_string(j);
                file_logger.log(message, crow::LogLevel::Info);
            } });
    }

    for (auto &thread : threads)
    {
        thread.join();
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);

    // Проверяем, что все сообщения записаны
    log_file.open(test_log_file);
    std::set<std::string> unique_messages;
    while (std::getline(log_file, line))
    {
        unique_messages.insert(line);
    }

    EXPECT_EQ(unique_messages.size(), existing_messages.size() + num_threads * messages_per_thread);
}

// Тест на проверку производительности
TEST_F(LoggerTest, PerformanceTest)
{
    logger::FileLogger file_logger(test_log_file);

    const int num_messages = 10000;
    auto start_time = std::chrono::high_resolution_clock::now();

    for (int i = 0; i < num_messages; ++i)
    {
        file_logger.log("Performance test message", crow::LogLevel::Info);
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);

    // Проверяем, что среднее время записи одного сообщения не превышает 1мс
    double avg_time_per_message = static_cast<double>(duration.count()) / num_messages;
    EXPECT_LT(avg_time_per_message, 1.0);
}

// Тест на обработку ошибок при переполнении диска
TEST_F(LoggerTest, DiskFullErrorTest)
{
    // Создаем временный файл в /tmp (если это возможно)
    std::string temp_log_file = "/tmp/test_log_full.txt";

    logger::FileLogger file_logger(temp_log_file);

    // Пытаемся записать очень большой объем данных
    std::string large_message(1024 * 1024 * 10, 'X'); // 10MB строка

    // Записываем данные в цикле, пока не закончится место или не произойдет ошибка
    int iteration = 0;
    const int max_iterations = 100;

    while (iteration < max_iterations)
    {
        try
        {
            file_logger.log(large_message, crow::LogLevel::Info);
            iteration++;
        }
        catch (const std::exception &e)
        {
            // Ожидаем, что при переполнении диска будет выброшено исключение
            EXPECT_TRUE(std::string(e.what()).find("error") != std::string::npos);
            break;
        }
    }

    // Очистка
    std::remove(temp_log_file.c_str());
}

// Тест на корректное поведение при отзыве прав доступа к файлу
TEST_F(LoggerTest, FilePermissionsTest)
{
    logger::FileLogger file_logger(test_log_file);

    // Сначала проверяем, что логирование работает
    EXPECT_NO_THROW(file_logger.log("Test message", crow::LogLevel::Info));
}

// Тест на корректную работу с пустыми сообщениями
TEST_F(LoggerTest, EmptyMessageTest)
{
    logger::FileLogger file_logger(test_log_file);

    EXPECT_NO_THROW(file_logger.log("", crow::LogLevel::Info));

    std::ifstream log_file(test_log_file);
    std::string line;
    std::getline(log_file, line);

    // Проверяем, что временная метка и уровень логирования присутствуют
    EXPECT_TRUE(line.find("ЗАМЕТКА") != std::string::npos);
}

// Тест на корректную работу с очень частыми вызовами логирования
TEST_F(LoggerTest, HighFrequencyLoggingTest)
{
    logger::FileLogger file_logger(test_log_file);

    const int num_iterations = 1000;
    const auto start = std::chrono::high_resolution_clock::now();

    for (int i = 0; i < num_iterations; ++i)
    {
        file_logger.log("Quick message", crow::LogLevel::Debug);
    }

    const auto end = std::chrono::high_resolution_clock::now();
    const auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);

    // Подсчитываем количество успешно записанных строк
    std::ifstream log_file(test_log_file);
    int line_count = 0;
    std::string line;
    while (std::getline(log_file, line))
    {
        line_count++;
    }

    EXPECT_EQ(line_count, num_iterations);
}

// Тест на корректную работу с разными локалями
TEST_F(LoggerTest, LocaleTest)
{
    logger::FileLogger file_logger(test_log_file);

    // Сохраняем текущую локаль
    std::string current_locale = std::locale().name();

    std::vector<std::string> test_locales = {"C", "en_US.UTF-8", "ru_RU.UTF-8"};

    for (const auto &locale_name : test_locales)
    {
        try
        {
            std::locale::global(std::locale(locale_name));
            std::string test_message = "Test message with locale: " + locale_name;
            EXPECT_NO_THROW(file_logger.log(test_message, crow::LogLevel::Info));
        }
        catch (const std::runtime_error &)
        {
            // Пропускаем недоступные локали
            continue;
        }
    }

    // Восстанавливаем исходную локаль
    std::locale::global(std::locale(current_locale));
}

// Тест на корректную работу с разными кодировками
TEST_F(LoggerTest, EncodingTest)
{
    logger::FileLogger file_logger(test_log_file);

    std::vector<std::string> test_messages = {
        u8"ASCII message",
        u8"Русское сообщение",
        u8"中文信息",
        u8"🌟 Unicode symbols 🌍"};

    for (const auto &message : test_messages)
    {
        EXPECT_NO_THROW(file_logger.log(message, crow::LogLevel::Info));
    }

    std::ifstream log_file(test_log_file);
    std::vector<std::string> lines;
    std::string line;
    while (std::getline(log_file, line))
    {
        lines.push_back(line);
    }

    EXPECT_EQ(lines.size(), test_messages.size());
}

// Тест на корректную работу при переименовании лог-файла
TEST_F(LoggerTest, FileRenameTest)
{
    logger::FileLogger file_logger(test_log_file);

    // Записываем начальное сообщение
    file_logger.log("Initial message", crow::LogLevel::Info);

    // Переименовываем файл
    std::string new_filename = test_log_file + ".renamed";
    std::rename(test_log_file.c_str(), new_filename.c_str());

    // Пытаемся записать новое сообщение
    EXPECT_NO_THROW(file_logger.log("Message after rename", crow::LogLevel::Info));

    // Проверяем содержимое обоих файлов
    std::ifstream old_file(new_filename);
    std::string line;
    EXPECT_TRUE(std::getline(old_file, line));
    EXPECT_TRUE(line.find("Initial message") != std::string::npos);

    // Очистка
    std::remove(new_filename.c_str());
}

// Тест на корректную работу при достижении максимального размера файла
TEST_F(LoggerTest, MaxFileSizeTest)
{
    const size_t max_file_size = 1024;   // 1KB
    std::string large_message(100, 'X'); // 100 байт

    logger::FileLogger file_logger(test_log_file);

    // Записываем сообщения, пока размер файла не превысит лимит
    size_t current_size = 0;
    int message_count = 0;

    while (current_size < max_file_size)
    {
        file_logger.log(large_message, crow::LogLevel::Info);
        message_count++;

        std::ifstream file(test_log_file, std::ios::binary | std::ios::ate);
        current_size = file.tellg();
    }

    // Проверяем, что все сообщения были записаны
    std::ifstream log_file(test_log_file);
    int line_count = 0;
    std::string line;
    while (std::getline(log_file, line))
    {
        line_count++;
    }

    EXPECT_EQ(line_count, message_count);
}

// Тест на корректную работу при одновременном чтении и записи (продолжение)
TEST_F(LoggerTest, SimultaneousReadWriteTest)
{
    logger::FileLogger file_logger(test_log_file);

    std::atomic<bool> stop_flag(false);
    std::vector<std::thread> threads;

    // Поток для записи
    threads.emplace_back([&file_logger, &stop_flag]()
                         {
        int counter = 0;
        while (!stop_flag) {
            file_logger.log("Write message " + std::to_string(counter++), 
                          crow::LogLevel::Info);
            std::this_thread::sleep_for(std::chrono::milliseconds(1));
        } });

    // Поток для чтения
    threads.emplace_back([this, &stop_flag]()
                         {
        while (!stop_flag) {
            std::ifstream log_file(test_log_file);
            std::string line;
            while (std::getline(log_file, line)) {
                // Просто читаем файл
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(1));
        } });

    // Даем потокам поработать некоторое время
    std::this_thread::sleep_for(std::chrono::seconds(1));
    stop_flag = true;

    for (auto &thread : threads)
    {
        thread.join();
    }

    // Проверяем, что файл не поврежден
    std::ifstream log_file(test_log_file);
    std::string line;
    while (std::getline(log_file, line))
    {
        EXPECT_TRUE(line.find("Write message") != std::string::npos);
    }
}

// Тест на корректную работу при внезапном завершении программы
TEST_F(LoggerTest, AbruptTerminationTest)
{
    {
        logger::FileLogger file_logger(test_log_file);

        // Записываем несколько сообщений
        for (int i = 0; i < 10; ++i)
        {
            file_logger.log("Message " + std::to_string(i), crow::LogLevel::Info);
        }

        // Симулируем внезапное завершение, не закрывая файл явно
    }

    // Проверяем, что все сообщения были корректно записаны
    std::ifstream log_file(test_log_file);
    std::vector<std::string> lines;
    std::string line;
    while (std::getline(log_file, line))
    {
        lines.push_back(line);
    }

    EXPECT_EQ(lines.size(), 10);
}
