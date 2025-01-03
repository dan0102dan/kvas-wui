#pragma once

#include <iostream>
#include <fstream>
#include <string>
#include <filesystem>
#include <exception>
#include <vector>

std::string findAppFolder(const std::string &appFileName, const std::string &lang_dir = "");
