# Minimal makefile for Sphinx documentation
#

# You can set these variables from the command line, and also
# from the environment for the first two.
SPHINXOPTS    ?=
SPHINXBUILD   = sphinx-build
SOURCEDIR     = .
BUILDDIR      = build

# Put it first so that "make" without argument is like "make help".
help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

# Catch-all target: route all unknown targets to Sphinx using the new
# "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
# %: Makefile
# 	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)
# 	@echo "Документация собрана."

# Сборка HTML
html:
	$(SPHINXBUILD) -b html "$(SOURCEDIR)" "$(BUILDDIR)/html" $(SPHINXOPTS)
	@echo "HTML документация собрана."

# Сборка EPUB
epub:
	$(SPHINXBUILD) -b epub "$(SOURCEDIR)" "$(BUILDDIR)/epub" $(SPHINXOPTS)
	@echo "EPUB документация собрана."

# Сборка PDF
pdf:
	$(SPHINXBUILD) -b latex "$(SOURCEDIR)" "$(BUILDDIR)/latex" $(SPHINXOPTS)
	cd "$(BUILDDIR)/latex" && make all-pdf
	@echo "PDF документация собрана."

# Очистка
clean:
	rm -rf "$(BUILDDIR)"
	@echo "Папка сборки очищена."

# Копирование собранных файлов в целевую директорию
copy:
	mkdir -p "$(TARGET_DIR)/html"
	mkdir -p "$(TARGET_DIR)/epub"
	mkdir -p "$(TARGET_DIR)/pdf"
	cp -r "$(BUILDDIR)/html" "$(TARGET_DIR)/html"
	cp -r "$(BUILDDIR)/epub"/*.epub "$(TARGET_DIR)/epub"
	cp -r "$(BUILDDIR)/latex"/*.pdf "$(TARGET_DIR)/pdf"
	@echo "Собранные файлы скопированы в целевую директорию."

# Полная сборка и копирование
all: help html epub pdf copy

.PHONY: all clean html epub pdf copy