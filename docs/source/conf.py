import sys
from pathlib import Path

sys.path.insert(0, str(Path('..', 'src').resolve()))

# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'kvas-pro'
copyright = 'Железа & Кo, 2024 - %Y гг.'
author = 'Железа & Кo'
release = '0.0.1-alpha-2'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

# Включаем различные расширения
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.todo',
    'sphinx_rtd_theme',
    'sphinx_multiversion',
    'sphinx.ext.mathjax',  # Для математических формул
    'sphinx.ext.imgmath',  # Для встраивания формул в PDF
]

templates_path = ['_templates']
exclude_patterns = []
today_fmt = '%d %b, %Y'
language = 'ru'

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
html_show_sphinx = False            # Отключаем показ футропа HTML-формате Sphinx

# Подключите собственного файла CSS
html_css_files = [
    'custom.css',
]

# Дополнительные настройки
numfig_format = {
    'code-block': 'Список %s',
    'figure': 'Рис. %s',
    'section': 'Секция',
    'table': 'Таблица %s',
}

# Настройки для LaTeX
latex_engine = 'pdflatex'
latex_elements = {
    'papersize': 'a4paper',
    'pointsize': '12pt',
    'figure_align': 'htbp',
    'fncychap': '\\usepackage[Bjarne]{fncychap}',  # Оформление глав
}

# Настройки для EPUB
epub_title = 'Проект Квас Pro'
epub_author = 'Zeleza and Co'
epub_language = 'ru'
epub_show_urls = 'footnote'

# Определяем базовый шаблон для URL версий
html_baseurl = 'https://docs.kvaspro.zeleza.ru/'

# Настраиваем для мульти-версионной документации
smv_branch_whitelist = r'^.*$'  # Включить все ветки
smv_tag_whitelist = r'^v\d+\.\d+.*$'  # Включить теги, соответствующие версиям (например, v1.0.0)
smv_remote_whitelist = r'^origin$'  # Использовать только удаленный репозиторий 'origin'
smv_prefer_remote_refs = False  # По умолчанию использовать локальные ветки

# smv_tag_whitelist = r'.*'  # Все теги
# smv_branch_whitelist = r'.*'  # Все ветки
# smv_remote_whitelist = r'.*'  # Все удалённые репозитории
# smv_released_pattern = r'^.*$'  # Все версии считаются релизами

# Настройки для sphinx_multiversion
smv_tag_whitelist = r'^v\d+\.\d+\.\d+$'  # Включать только теги, соответствующие версиям (например, v1.0.0)
smv_branch_whitelist = r'.*'  # Включать только ветку main
smv_remote_whitelist = r'^origin$'  # Использовать только удаленный репозиторий origin
smv_outputdir_format = '{ref.name}'  # Имя директории для каждой версии
smv_released_pattern = r'^.*$'  # Все версии считаются релизами