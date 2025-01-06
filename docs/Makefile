# Минимальный Makefile для документации Sphinx
#

# Вы можете установить эти переменные из командной строки, а также
# из окружения для первых двух.
# SPHINXBUILD   = sphinx-build
SPHINXOPTS    ?= 
DOCS_ROOT     = /${APP_NAME}/docs
SPHINXBUILD   = sphinx-multiversion
SOURCEDIR     = $(DOCS_ROOT)/source
BUILDDIR      = $(DOCS_ROOT)/build
TARGET_DIR    = $(DOCS_ROOT)/ready

# Помещаем эту цель первой, чтобы "make" без аргументов работал как "make help".
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS)

# Цель-ловушка: перенаправляет все неизвестные цели в Sphinx, используя новую
# опцию "make mode". $(O) - это сокращение для $(SPHINXOPTS).
%: 
	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)
	@echo "-----------------------------------------"
	@echo "Документация успешно собрана."
	@echo "-----------------------------------------"

# Сборка HTML
html:
	@rm -rf "$(BUILDDIR)/html"
	@rm -rf "$(TARGET_DIR)/html"
# $(SPHINXBUILD) -b html -d "$(BUILDDIR)/doctrees" "$(SOURCEDIR)" "$(BUILDDIR)/html"
	$(SPHINXBUILD) "$(SOURCEDIR)" "$(BUILDDIR)/html" $(SPHINXOPTS)
#@mkdir -p "$(TARGET_DIR)/html"
#@echo "-----------------------------------------"
#@mv "$(BUILDDIR)/html" "$(TARGET_DIR)" && echo "Документация успешно перемещена в $(TARGET_DIR)/html"
	@echo "-----------------------------------------"
	@echo "HTML документация успешно собрана."
	@echo "-----------------------------------------"

# Сборка EPUB
epub:
	@rm -rf "$(BUILDDIR)/epub" "$(TARGET_DIR)/epub"
	$(SPHINXBUILD) "$(SOURCEDIR)" "$(BUILDDIR)/epub" -b epub $(SPHINXOPTS)
	@echo "-----------------------------------------"
	@echo "EPUB документация успешно собрана."
	@echo "-----------------------------------------"

# Сборка PDF
pdf:
	@rm -rf "$(BUILDDIR)/pdf" "$(TARGET_DIR)/pdf"
	$(SPHINXBUILD) "$(SOURCEDIR)" "$(BUILDDIR)/pdf" -b latex $(SPHINXOPTS)
	@TEXFILES=$$(find "$(BUILDDIR)/pdf" -maxdepth 1 -name "*.tex" -print); \
		if [ -z "$$TEXFILES" ]; then \
			echo "Ошибка: не найден .tex файл в $(BUILDDIR)/pdf. Проверьте настройки Sphinx и документацию."; \
			exit 1; \
		fi; \
		for TEXFILE in $$TEXFILES; do \
			echo "Собираю $$TEXFILE"; \
			cd "$(BUILDDIR)/pdf" && latexmk -xelatex -pdf /app/docs/$$TEXFILE; \
		done;
	@echo "-----------------------------------------"
	@echo "PDF документация успешно собрана."
	@echo "-----------------------------------------"

# Очистка
clean:
	rm -rf "$(BUILDDIR)"
	@echo "-----------------------------------------"
	@echo "Папка сборки успешно очищена."
	@echo "-----------------------------------------"

# Копирование собранных файлов в целевую директорию
move:
	@mkdir -p "$(TARGET_DIR)/html"
	@mkdir -p "$(TARGET_DIR)/epub"
	@mkdir -p "$(TARGET_DIR)/pdf"
	@mv "$(BUILDDIR)/html" "$(TARGET_DIR)"
	@mv "$(BUILDDIR)/epub"/*.epub "$(TARGET_DIR)/epub"
	@mv "$(BUILDDIR)/pdf"/*.pdf "$(TARGET_DIR)/pdf"
# rm -rf "$(BUILDDIR)"
	@echo "-----------------------------------------"
	@echo "Собранные файлы успешно скопированы в целевую директорию."
	@echo "-----------------------------------------"

# Полная сборка и копирование
all: clean html epub pdf move

.PHONY: all clean html epub pdf move help