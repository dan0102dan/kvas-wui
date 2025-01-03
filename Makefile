include $(TOPDIR)/rules.mk

PKG_NAME:=kvaspro
PKG_VERSION:=0.0.1_alpha-2
PKG_RELEASE:= 1
PKG_MAINTAINER:=Zeleza <kvaspro@zeleza.ru>
PKG_LICENSE:=EULA
PKG_LICENSE_FILES:=LICENSE

# Включаем сборку тестов по умолчанию
BUILD_TESTING:=0
# Отладка: 0 - выключить, 1 - включить
PKG_DEBUG:=1
# Путь установки пакета на маршрутизаторе
PKG_INSTALL_PATH:=/opt/apps/$(PKG_NAME)

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
	SECTION:=utils
	CATEGORY:=Utilities
	TITLE:=Квас Про - инструмент для защиты соединений Ваших клиентов на роутерах компании Keenetic
	URL:=https://github.com/qzeleza/kvaspro
	DEPENDS:=+libstdcpp +zlib +libc +wget
endef

define Package/$(PKG_NAME)/description
	Квас Про - инструмент для защиты соединений Ваших клиентов на роутерах компании Keenetic.
	Это продвинутая версия Кваса с WUI.
endef

# Переменные для Google Test
GTEST_DIR:=$(BUILD_DIR)
GTEST_LAST_VER:=1.12.1
GTEST_URL:=https://github.com/google/googletest/archive/refs/tags/release-$(GTEST_LAST_VER).tar.gz
GTEST_TAR:=googletest-release-$(GTEST_LAST_VER).tar.gz
GTEST_EXTRACTED_DIR:=$(GTEST_DIR)/googletest-release-$(GTEST_LAST_VER)

# Переменные для Asio Boost
ASIO_VERSION:=1.30.2
ASIO_SOURCE:=asio-$(ASIO_VERSION).tar.gz
ASIO_SOURCE_URL:=https://deac-riga.dl.sourceforge.net/project/asio/asio/$(ASIO_VERSION)%20%28Stable%29/$(ASIO_SOURCE)
ASIO_DIR:=$(BUILD_DIR)/asio
ASIO_EXTRACTED_DIR=$(ASIO_DIR)/include
ASIO_DL_DIR:=$(DL_DIR)

# Переменные для компиляции
TARGET_CXXFLAGS += \
		-I$(STAGING_DIR)/usr/include \
		-I$(BUILD_DIR)/asio/include \
		-I$(PKG_BUILD_DIR)/hpp

# Переменные для линковки
TARGET_LDFLAGS += \
		-lz -lpthread -lstdc++fs -std=c++17 \
		-DCROW_BUILD_EXAMPLES=OFF \
		-DCROW_BUILD_TESTS=OFF \
		-DCROW_BUILD_BENCHMARKS=OFF \
		-DCROW_ENABLE_COMPRESSION \
		-L$(STAGING_DIR)/usr/lib \
		-Wall -Wfatal-errors -O3

# Проверка отладки PKG_DEBUG
ifeq ($(PKG_DEBUG),1)
	TARGET_CXXFLAGS += -DDEBUG
endif

CONFIG_FILE:=$(PKG_BUILD_DIR)/config.json

# Макрос для скачивания файла, если он не существует
define DownloadIfNotExists
	if [ ! -d "$(4)" ]; then \
			echo "===> Скачивание $(2)..."; \
			wget $(3) -O $(1)/$(2); \
	fi
endef

# Макрос для распаковки архива, если директория не существует
define ExtractIfNotExists
	if [ ! -d "$(2)" ]; then \
			echo "===> Распаковка $(1)..."; \
			mkdir -p $(2); \
			tar -xzf $(3) -C $(2) --strip-components=1; \
			rm -f $(3); \
	fi
endef

# Блок подготовки к сборке
define Build/Prepare

	mkdir -p $(PKG_BUILD_DIR) $(PKG_BUILD_DIR)/locales
	cp -r ./src/. $(PKG_BUILD_DIR)
	cp -r ./locales/. $(PKG_BUILD_DIR)/locales/

	# Скачивание Asio, если еще не скачано
	$(call DownloadIfNotExists,$(ASIO_DL_DIR),$(ASIO_SOURCE),$(ASIO_SOURCE_URL),$(ASIO_EXTRACTED_DIR))

	# Распаковка Asio, если еще не распаковано
	$(call ExtractIfNotExists,Asio Boost,$(ASIO_EXTRACTED_DIR),$(ASIO_DL_DIR)/$(ASIO_SOURCE))

	# Скачивание Google Test, если еще не скачано
	$(call DownloadIfNotExists,$(GTEST_DIR),$(GTEST_TAR),$(GTEST_URL),$(GTEST_EXTRACTED_DIR))

	# Распаковка Google Test, если еще не распаковано
	$(call ExtractIfNotExists,Google Test,$(GTEST_EXTRACTED_DIR),$(GTEST_DIR)/$(GTEST_TAR))

endef

# Блок конфигурации сборки
define Build/Configure

	if [ "$(BUILD_TESTING)" = "1" ]; then \
		echo && echo "===> Конфигурация Google Test..." && \
		mkdir -p $(GTEST_EXTRACTED_DIR)/build && \
		cd $(GTEST_EXTRACTED_DIR)/build && \
		cmake .. \
			-DCMAKE_C_COMPILER=$(TARGET_CC) \
			-DCMAKE_CXX_COMPILER=$(TARGET_CXX) \
			-DCMAKE_SYSTEM_NAME=Linux \
			-DCMAKE_SYSTEM_PROCESSOR=$(CONFIG_ARCH) \
			-DCMAKE_POSITION_INDEPENDENT_CODE=ON \
			-DCMAKE_BUILD_TYPE=Release \
			-DGTEST_ENABLE_SHARED=OFF; \
	fi
endef

define Build/Compile

	# Сборка Google Test
	if [ "$(BUILD_TESTING)" = "1" ]; then \
		echo "===>  Сборка Google Test..."; \
		$(MAKE) -C $(GTEST_EXTRACTED_DIR)/build; \
	fi

	echo && echo "===> Компиляция основной программы..."; \
		$(TARGET_CXX) $(TARGET_CPPFLAGS) $(TARGET_CXXFLAGS) \
		-o $(PKG_BUILD_DIR)/$(PKG_NAME) \
		$(PKG_BUILD_DIR)/$(PKG_NAME).cpp \
		$(PKG_BUILD_DIR)/libs/*.cpp \
		$(TARGET_LDFLAGS) \


	if [ "$(BUILD_TESTING)" = "1" ]; then \
		echo && echo "===> Компиляция тестов..."; \
		$(TARGET_CXX) \
		$(TARGET_CPPFLAGS) $(TARGET_CXXFLAGS) \
		-I$(PKG_BUILD_DIR)/hpp \
		-I$(GTEST_EXTRACTED_DIR)/googletest \
		-I$(GTEST_EXTRACTED_DIR)/googlemock/include \
		-I$(GTEST_EXTRACTED_DIR)/googletest/include \
		$(PKG_BUILD_DIR)/tests/run_all_tests.cpp \
		$(PKG_BUILD_DIR)/libs/*.cpp \
		-o $(PKG_BUILD_DIR)/run_all_tests \
		$(TARGET_LDFLAGS) \
		$(GTEST_EXTRACTED_DIR)/build/lib/libgtest.a \
		$(GTEST_EXTRACTED_DIR)/build/lib/libgtest_main.a \
		$(GTEST_EXTRACTED_DIR)/build/lib/libgmock.a \
		-DUNIT_TEST; \
	fi

endef

# Блок для упаковки пакета
define Package/$(PKG_NAME)/install

	echo && echo "===> Упаковка пакета $(PKG_NAME)..."
	$(INSTALL_DIR) $(1)$(PKG_INSTALL_PATH)
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/$(PKG_NAME) $(1)$(PKG_INSTALL_PATH)/
	$(INSTALL_DIR) $(1)$(PKG_INSTALL_PATH)/locales
	$(CP) $(PKG_BUILD_DIR)/config.json $(1)$(PKG_INSTALL_PATH)/
	$(CP) $(PKG_BUILD_DIR)/locales/. $(1)$(PKG_INSTALL_PATH)/locales

	if [ "$(BUILD_TESTING)" = "1" ]; then \
		echo && echo "===> Упаковка Google Test..."; \
		$(INSTALL_DIR) $(1)$(PKG_INSTALL_PATH)/tests; \
		$(INSTALL_BIN) $(PKG_BUILD_DIR)/run_all_tests $(1)$(PKG_INSTALL_PATH)/tests/; \
	fi
endef


# Добавляем цель clean
define Build/Clean
	rm -rf $(PKG_BUILD_DIR)
	rm -rf $(ASIO_DIR)
	rm -rf $(GTEST_EXTRACTED_DIR)
	rm -f $(ASIO_DL_DIR)/$(ASIO_SOURCE)
	rm -f $(GTEST_DIR)/$(GTEST_TAR)
endef

# Скрипт действий после установки пакета
define Package/$(PKG_NAME)/postinst

#!/bin/sh
set -e

# Устанавливаем права на исполнение для бинарного файла
chmod +x "${PKG_INSTALL_PATH}/${PKG_NAME}"
if [ $$? -ne 0 ]; then
	logger -t "$(basename $$0)[$$]" "Ошибка: Не удалось установить права на исполнение для ${PKG_INSTALL_PATH}/${PKG_NAME}"
	exit 1
fi

# Проверяем существование /opt/bin и создаем, если нужно
if [ ! -d /opt/bin ]; then
	mkdir -p /opt/bin
fi

# Создаем символическую ссылку в /opt/bin
ln -sf "${PKG_INSTALL_PATH}/${PKG_NAME}" /opt/bin/${PKG_NAME}
if [ $$? -ne 0 ]; then
	logger -t "$(basename $$0)[$$]" "Ошибка: Не удалось создать символическую ссылку /opt/bin/${PKG_NAME}"
	exit 1
fi

exit 0

endef

$(eval $(call BuildPackage,$(PKG_NAME)))
