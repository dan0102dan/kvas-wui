#include <gtest/gtest.h>

// Здесь будут подключены остальные тестовые файлы
// #include "test_localization.cpp"
// #include "test_logger.cpp"
#include "test_filetools.cpp"

int main(int argc, char **argv)
{
    testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}