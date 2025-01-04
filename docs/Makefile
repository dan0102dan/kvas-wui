# Минимальный Makefile для документации Sphinx
#

# Вы можете установить эти переменные из командной строки, а также
# из окружения для первых двух.
SPHINXOPTS    ?=
SPHINXBUILD   = sphinx-build
SOURCEDIR     = ./source
BUILDDIR      = build
TARGET_DIR    = /app/docs/ready  # Добавлена переменная для целевой директории, по умолчанию ./dist

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
	$(SPHINXBUILD) -b html "$(SOURCEDIR)" "$(BUILDDIR)/html" $(SPHINXOPTS)
	@echo "-----------------------------------------"
	@echo "HTML документация успешно собрана."
	@echo "-----------------------------------------"

# Сборка EPUB
epub:
	$(SPHINXBUILD) -b epub "$(SOURCEDIR)" "$(BUILDDIR)/epub" $(SPHINXOPTS)
	@echo "-----------------------------------------"
	@echo "EPUB документация успешно собрана."
	@echo "-----------------------------------------"

# Сборка PDF
pdf:
	$(SPHINXBUILD) -b latex "$(SOURCEDIR)" "$(BUILDDIR)/latex" $(SPHINXOPTS)
	@TEXFILES=$$(find "$(BUILDDIR)/latex" -maxdepth 1 -name "*.tex" -print); \
		if [ -z "$$TEXFILES" ]; then \
			echo "Ошибка: не найден .tex файл в $(BUILDDIR)/latex. Проверьте настройки Sphinx и документацию."; \
			exit 1; \
		fi; \
		for TEXFILE in $$TEXFILES; do \
			echo "Собираю $$TEXFILE"; \
			cd "$(BUILDDIR)/latex" && latexmk -xelatex -pdf /app/docs/$$TEXFILE; \
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
copy:
	mkdir -p "$(TARGET_DIR)/html"
	mkdir -p "$(TARGET_DIR)/epub"
	mkdir -p "$(TARGET_DIR)/pdf"
	cp -r "$(BUILDDIR)/html" "$(TARGET_DIR)/html"
	cp -r "$(BUILDDIR)/epub"/*.epub "$(TARGET_DIR)/epub"
	cp -r "$(BUILDDIR)/latex"/*.pdf "$(TARGET_DIR)/pdf"
	@echo "-----------------------------------------"
	@echo "Собранные файлы успешно скопированы в целевую директорию."
	@echo "-----------------------------------------"

# Полная сборка и копирование
all: clean html epub pdf copy

.PHONY: all clean html epub pdf copy help