#pragma once

#include "kvpInfaceLogger.hpp"
#include "kvpInfaceConfig.hpp"
#include "crowLib.hpp"

class Config : public IConfig
{
public:
  bool load() override;
  const AppConfig &get() const override;
  std::string getAppRootPath() const override;
  void initCommandLine(int argc, char **argv) override;
  std::optional<std::string> getCommandLineArgument(const std::string &name) const override;
  const ServerConfig &getServerConfig() const override;
  const DatabaseConfig &getDatabaseConfig() const override;
  const LoggingConfig &getLoggingConfig() const override;
  int getTimeout() const override;
  void overrideWithEnvironmentVariables() override;
  void overrideWithCommandLineArguments() override;
  void setAppRootPath(const std::string &path) override;
  void setLocalization(ILocalization *localization) override;
  void updateLoggerSettings() override;

private:
  Config(const std::string &configFileName);
  Config(const Config &) = delete;
  Config &operator=(const Config &) = delete;

  // Объявляем IConfig::getInstance дружественной функцией
  friend IConfig &IConfig::getInstance(const std::string &configFileName);

  bool loadFromJson();
  // Рекурсивная функция для парсинга JSON и заполнения структуры
  template <typename T>
  void parseJsonToStruct(const crow::json::rvalue &json, T &structure);

  std::string configFileName_;
  AppConfig config_;
  int argc_;
  char **argv_;
  std::unordered_map<std::string, std::string> commandLineArgs_;
  std::string appRootPath_;

  logger::ILogger *logger_;
  ILocalization *localization_;
};