# Укажите, какие версии вы хотите собирать
# Например, если у вас есть ветки main и v1.0.0
# Вы можете указать их так:
# import sphinx_multiversion

# Добавляем путь к текущей папке (где лежит conf.py) в sys.path
# sys.path.insert(0, str(Path(__file__).parent.parent.resolve()))
# Теперь Python сможет найти versions.py
# from versions import get_versions

# Импортируем функцию, которая наполняет переменную versions
# from versions import get_versions
    
# sys.path.insert(0, str(Path('..', 'src').resolve()))

# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information
# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output


project = 'KvasPro'
copyright = 'Железа & Кo, 2024 - 2025 гг.'
author = 'Железа & Кo'
release = '0.0.1-alpha-2'

docs_tags_available = [ "0.0.1", "0.0.2" ]

# Настройка базового URL для документации
html_baseurl = "https://example.com/docs/" 

# Включаем различные расширения
extensions = [
    'sphinx_rtd_theme',
    'sphinx_multiversion',
    'sphinx.ext.autodoc',
    'sphinx.ext.autosummary',
    'sphinx.ext.todo',
    'sphinx.ext.mathjax',  # Для математических формул
    'sphinx.ext.imgmath',  # Для встраивания формул в PDF
]
# Настройка исключений расширений 
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

pygments_style = None

# Настройки для sphinx_rtd_theme
html_theme = 'sphinx_rtd_theme'

html_show_sphinx = False            # Отключаем показ футропа HTML-формате Sphinx
# Настройка боковой панели
html_theme_options = {
    'navigation_depth': 4,
    'collapse_navigation': False,
    'sticky_navigation': True,
    'logo_only': False,
    'prev_next_buttons_location': 'bottom',
    'style_external_links': False,
}

# Настройка контекста
html_context = {
    'display_github': True,
    'github_user': 'kvas-pro',
    'github_repo': 'server',
    'github_version': 'main',
    'conf_py_path': '/docs/source/',
}

# # Дополнительные настройки
numfig_format = {
    'code-block': 'Список %s',
    'figure': 'Рис. %s',
    'section': 'Секция',
    'table': 'Таблица %s',
}
today_fmt = '%d %b, %Y'
language = 'ru'
source_suffix = {'.rst': 'restructuredtext'}
master_doc = 'index'


# Настройки для создания PDF файлов
latex_engine = 'pdflatex'
latex_elements = {
    'papersize': 'a4paper',
    'pointsize': '12pt',
    'figure_align': 'htbp',
    'fncychap': '\\usepackage[Bjarne]{fncychap}',  # Оформление глав
}

# Настройки для EPUB
# settings for EPUB
epub_basename = project
epub_title = 'Проект ' + project
epub_author = 'Zeleza and Co'
epub_language = language
epub_show_urls = 'footnote'
epub_exclude_files = ['search.html']

#  Настройки для sphinx_multiversion
templates_path = ['_templates']
html_static_path = ['_static']

# Подключаем собственный файл CSS
html_css_files = ['custom.css',]
html_sidebars = {
    '**': [
        'versions.html',
    ],
}

# Grouping the document tree into LaTeX files. List of tuples
# (source start file, target name, title,
#  author, documentclass [howto, manual, or own class]).
latex_documents = [
    (master_doc, project + '.tex', 'Документация по проекту' + project,
     author, 'manual'),
]


# -- Options for manual page output ------------------------------------------

# One entry per manual page. List of tuples
# (source start file, name, description, authors, manual section).
man_pages = [
    (master_doc, project, 'Документация по проекту' + project,
     [author], 1)
]


# -- Options for Texinfo output ----------------------------------------------

# Grouping the document tree into Texinfo files. List of tuples
# (source start file, target name, title, author,
#  dir menu entry, description, category)
texinfo_documents = [
    (master_doc, project, 'Документация по проекту' + project,
     author, project, 'Пояснение к проекту.', 'Miscellaneous'),
]


############################
# SETUP THE RTD LOWER-LEFT #
############################

import os
import sys

try:
   html_context
except NameError:
   html_context = dict()
   
# html_context.['display_lower_left'] = True

if 'REPO_NAME' in os.environ:
	REPO_NAME = os.environ['REPO_NAME']
else:
    REPO_NAME = ''
 
# SET CURRENT_LANGUAGE
if 'current_language' in os.environ:
   # get the current_language env var set by buildDocs.sh
   current_language = os.environ['current_language']
else:
#    the user is probably doing `make html`
#    set this build's current language to english
    current_language = language
 
# # # # tell the theme which language to we're currently building
html_context['current_language'] = current_language
 
# SET CURRENT_VERSION
from git import Repo
repo = Repo( search_parent_directories=True )

# # Словарь версий
versions = repo.git.tag().split('\n') 
first_version = versions[0]

if 'current_version' in os.environ:
   # get the current_version env var set by buildDocs.sh
   current_version = os.environ['current_version']
else:
#    the user is probably doing `make html`
#    set this build's current version by looking at the branch
    current_version = first_version
#    current_version = repo.active_branch.name
 
# tell the theme which version we're currently on ('current_version' affects
# the lower-left rtd menu and 'version' affects the logo-area version)
html_context['current_version'] = current_version
html_context['version'] = current_version
 
# POPULATE LINKS TO OTHER LANGUAGES
html_context['languages'] = list()
 
languages = [lang.name for lang in os.scandir('locales') if lang.is_dir()]
for lang in languages:
   html_context['languages'].append( (lang, '/' +REPO_NAME+ '/' +lang+ '/' +current_version+ '/') )
 
# POPULATE LINKS TO OTHER VERSIONS
html_context['versions'] = list()
# index_file_html = 'index.html'
# path_to_docs = '/docs/build/html'
# versions = [branch.name for branch in repo.branches]
for version in versions:
    if version not in docs_tags_available:
        # /docs/build/html/v0.0.1/index.html
        # html_context['versions'].append( (version, '/' + REPO_NAME + '/' + current_language + '/' +version+ '/') )
        html_context['versions'].append( (version, '/' +version+ '/') )
 
# POPULATE LINKS TO OTHER FORMATS/DOWNLOADS
 
# settings for creating PDF with rinoh
rinoh_documents = [
    ( master_doc, 'target', project+ ' Documentation', '© ' +copyright,)
]
# today_fmt = "%B %d, %Y"

 
html_context['downloads'] = list()
html_context['downloads'].append( ('pdf', '/' +REPO_NAME+ '/' +current_language+ '/' +current_version+ '/' +project+ '-docs_' +current_language+ '_' +current_version+ '.pdf') )
html_context['downloads'].append( ('epub', '/' +REPO_NAME+ '/' +current_language+ '/' +current_version+ '/' +project+ '-docs_' +current_language+ '_' +current_version+ '.epub') )

# import os
# import json
# from pathlib import Path

# def get_current_version(app, pagename, templatename, context, doctree):
#     # Путь к файлу состояния в директории сборки
#     state_file = Path(app.outdir) / '.sphinx_version_state.json'
    
#     if state_file.exists():
#         with state_file.open('r') as f:
#             state = json.load(f)
#             if 'current_version' in state:
#                 context['current_version'] = state['current_version']

# def setup(app):
#     # app.connect('html-page-context', get_current_version)
#     return {
#         'version': '0.0.1',
#         'parallel_read_safe': True,
#         'parallel_write_safe': True,
#     }

# Настройки sphinx-multiversion

smv_tag_whitelist = r'^v\d+\.\d+\.\d+$'  # Обработка только тегов формата vX.Y.Z
smv_branch_whitelist = r'^(main).*$' 
smv_remote_whitelist = r'^$'  # Только репозиторий origin
# smv_released_pattern = r'^v\d+\.\d+\.\d+$'  # Все теги в формате vX.Y.Z считаются "выпущенными"
smv_outputdir_format = '{ref.name}'
smv_prefer_remote_refs = False

# smv_tag_whitelist = r'^v\d+\.\d+\.\d+$'  # Только теги в формате v1.0.0, v2.3.4 и т.д.
# smv_branch_whitelist = None  # Только ветки main и release/*
# smv_remote_whitelist =  None  # Только стандартный удаленный репозиторий
# smv_released_pattern = r'^v\d+\.\d+\.\d+$'  # Теги в формате v1.0.0 считаются выпущенными


html_context['display_versions'] = True
sys.path.insert(0, os.path.abspath('../src'))
