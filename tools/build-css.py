#!/usr/bin/env python3
"""Build step for performance.

Reads css/styles.css (the source file you edit) and produces:
  - css/styles.min.css : full minified stylesheet, loaded without blocking render
  - css/critical.css   : above-the-fold subset (header, hero, buttons, layout), inlined in <head>
Then updates every *.html in the project root so each page inlines the critical CSS
and loads styles.min.css asynchronously.

Run from the project root after editing css/styles.css:   python3 tools/build-css.py
"""
import re, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'css', 'styles.css')

CRITICAL = re.compile(
    r'^(:root|\*|html|body|a|img|svg|h[1-6]|p|ul|ol|li|button|'
    r'\.container|\.sr-only|\.skip-link|\.text-center|\.pt-1|\.pb-1|'
    r'\.emergency-bar|\.site-header|\.header-inner|\.site-logo|\.logo|\.site-nav|\.nav|'
    r'\.has-dropdown|\.dropdown|\.drop-chevron|\.header-phone|\.mobile|'
    r'\.breadcrumb|\.hero|\.page-hero|\.btn|\.section-label)')

def strip_comments(s):
    return re.sub(r'/\*.*?\*/', '', s, flags=re.S)

def minify(s):
    strings = []
    def keep(m):
        strings.append(m.group(0)); return f'\x00{len(strings)-1}\x00'
    s = re.sub(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'', keep, strip_comments(s))
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'\s*([{};,>~])\s*', r'\1', s)
    s = re.sub(r':\s+', ':', s)
    s = re.sub(r';}', '}', s)
    s = s.strip()
    return re.sub(r'\x00(\d+)\x00', lambda m: strings[int(m.group(1))], s)

def split_rules(css):
    """Yield top-level (prelude, body) pairs."""
    i, n, out = 0, len(css), []
    while i < n:
        j = css.find('{', i)
        if j < 0: break
        prelude = css[i:j].strip()
        depth, k = 1, j + 1
        while k < n and depth:
            c = css[k]
            if c == '{': depth += 1
            elif c == '}': depth -= 1
            k += 1
        out.append((prelude, css[j + 1:k - 1]))
        i = k
    return out

def is_critical_selector(sel):
    return any(CRITICAL.match(p.strip()) for p in sel.split(','))

def critical_of(css):
    out = []
    for prelude, body in split_rules(css):
        if prelude.startswith('@media') or prelude.startswith('@supports'):
            inner = critical_of(body)
            if inner:
                out.append(f'{prelude}{{{inner}}}')
        elif prelude.startswith('@'):
            continue  # @keyframes, @font-face, @print etc. load with the async file
        elif is_critical_selector(prelude):
            out.append(f'{prelude}{{{body}}}')
    return ''.join(out)

full = minify(open(SRC).read())
crit = critical_of(full)
# print rules are not needed above the fold
crit = re.sub(r'@media print\{.*?\}\}', '', crit)
open(os.path.join(ROOT, 'css', 'styles.min.css'), 'w').write(full)
open(os.path.join(ROOT, 'css', 'critical.css'), 'w').write(crit)
print(f'styles.css {os.path.getsize(SRC)/1024:.1f} KiB -> styles.min.css {len(full)/1024:.1f} KiB, critical {len(crit)/1024:.1f} KiB')

BLOCK = ('<!--critical-css:start--><style>' + crit + '</style>\n'
         '    <link rel="preload" href="/css/styles.min.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'" />\n'
         '    <noscript><link rel="stylesheet" href="/css/styles.min.css" /></noscript><!--critical-css:end-->')
HERO_PRELOAD = '<link rel="preload" as="image" href="/images/north-floorida-locksmith-banner.webp" fetchpriority="high" />'

for f in glob.glob(os.path.join(ROOT, '*.html')):
    s = open(f).read()
    if '<!--critical-css:start-->' in s:
        s = re.sub(r'<!--critical-css:start-->.*?<!--critical-css:end-->', lambda m: BLOCK, s, flags=re.S)
    else:
        s, n = re.subn(r'<link rel="stylesheet" href="/?css/styles\.css" />', lambda m: BLOCK, s)
        assert n == 1, f
    if 'north-floorida-locksmith-banner.webp" fetchpriority' not in s:
        s = s.replace('<!--critical-css:start-->', HERO_PRELOAD + '\n    <!--critical-css:start-->', 1)
    open(f, 'w').write(s)
print('updated pages')
