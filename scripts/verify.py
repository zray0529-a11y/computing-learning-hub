#!/usr/bin/env python3
"""Verify trusted local teaching examples and Markdown links; no network calls."""
import importlib.util
import json
import re
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import unquote, urlsplit

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
IGNORED = {'.git', '.venv', 'venv', '__pycache__', 'learning', 'outputs', 'tmp'}


def public_path(path):
    resolved = path.resolve()
    return (resolved.is_relative_to(ROOT) and not path.is_symlink()
            and not resolved.name.endswith('.local.md')
            and not IGNORED.intersection(resolved.relative_to(ROOT).parts))


FILES = sorted(p for p in ROOT.rglob('*') if public_path(p) and p.is_file())
ERRORS = []
FENCE = re.compile(r'(?ms)^(```|~~~)([\w-]*)\n(.*?)^\1[ \t]*$')


def check(ok, message):
    if not ok:
        ERRORS.append(message)


def execute(arguments):
    with tempfile.TemporaryDirectory() as directory:
        return subprocess.run(arguments, cwd=directory, capture_output=True,
                              text=True, timeout=15)


def snippets():
    expected_core = {
        '07': "rollback\n[('e1', 'low')]\n",
        '08': '[False, True, True, False, False]\n',
        '09': "2 (2, 'high')\n",
        '10': '2.6 16.0 0.64\n',
        '11': 'near\n',
        '12': '2 low\n',
        '13': 'True\nFalse\nFalse\n',
        '14': "{'east': 5.0, 'west': 8.0}\neast\n",
    }
    count = 0
    paths = sorted((ROOT / 'docs/chapters').glob('[0-9]*.md'))
    paths += sorted((ROOT / 'architecture').glob('[0-9]*.md'))
    paths = [p for p in paths if public_path(p)]
    for path in paths:
        blocks = list(FENCE.finditer(path.read_text()))
        for i, block in enumerate(blocks):
            if block.group(2) != 'python':
                continue
            count += 1
            next_block = blocks[i + 1] if i + 1 < len(blocks) else None
            if next_block is not None and next_block.group(2) == 'text':
                expected = next_block.group(3).rstrip('\n') + '\n'
            elif path.parent.name == 'chapters' and path.name[:2] in expected_core:
                expected = expected_core[path.name[:2]]
            else:
                check(False, f'No expected output for {path.relative_to(ROOT)}')
                continue
            result = execute([sys.executable, '-B', '-c', block.group(3)])
            check(result.returncode == 0 and result.stdout == expected and not result.stderr,
                  f'Snippet failed: {path.relative_to(ROOT)}: {result.stdout!r} {result.stderr!r}')
    check(sum(p.parent.name == 'chapters' for p in paths) == 14,
          'Expected 14 core chapters')
    check(sum(p.parent.name == 'architecture' for p in paths) == 4,
          'Expected 4 architecture topics')
    return count


def labs():
    path = ROOT / 'docs/practice/lab.py'
    body = (path.parent / '01-labs.md').read_text()
    expected = [b.group(3).rstrip('\n') + '\n' for b in FENCE.finditer(body)
                if b.group(2) == 'text']
    check(len(expected) == 6, 'Expected six documented lab outputs')
    for n, output in enumerate(expected, 1):
        result = execute([sys.executable, '-B', str(path), '--lesson', str(n)])
        full = f'\n=== Lesson {n} ===\n' + output
        check(result.returncode == 0 and result.stdout == full and not result.stderr,
              f'Lab {n} output mismatch: {result.stdout!r} {result.stderr!r}')
    default = execute([sys.executable, '-B', str(path)])
    all_mode = execute([sys.executable, '-B', str(path), '--lesson', 'all'])
    help_mode = execute([sys.executable, '-B', str(path), '--help'])
    invalid = execute([sys.executable, '-B', str(path), '--lesson', '7'])
    check(default.returncode == all_mode.returncode == 0 and default.stdout == all_mode.stdout,
          'Default and all modes differ')
    check(help_mode.returncode == 0 and '--lesson' in help_mode.stdout, 'Help mode failed')
    check(invalid.returncode == 2, 'Invalid lesson should exit with code 2')

    spec = importlib.util.spec_from_file_location('teaching_lab', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    data = module.fixture()
    index, _ = module.build_index(data)
    duplicated, _ = module.build_index(data + data)
    reversed_index, _ = module.build_index(list(reversed(data)))
    baseline = module.latest_observation(index, 'zone-a', module.ALLOWED)
    cases = [
        ('replay', module.latest_observation(duplicated, 'zone-a', module.ALLOWED) == baseline),
        ('out_of_order', module.latest_observation(reversed_index, 'zone-a', module.ALLOWED) == baseline),
        ('expired', module.latest_observation(index, 'zone-a', module.ALLOWED, now=1501)['status'] == 'unknown'),
        ('future', module.latest_observation(index, 'zone-future', module.ALLOWED)['status'] == 'unknown'),
        ('boundary', module.latest_observation(index, 'zone-edge', module.ALLOWED)['status'] == 'observed'),
        ('conflict', module.latest_observation(index, 'zone-conflict', module.ALLOWED)['reason'] == 'conflicting_observations'),
        ('invalid_time', all(not module.valid_event(module.event('bad', 'zone-a', t, 'clear'))
                             for t in [None, True, '900', -1])),
        ('read_denied', module.latest_observation(None, 'zone-secret', module.ALLOWED) == {'status': 'denied'}),
        ('search_denied', module.retrieve(None, 'zone-secret', 'occupied', module.ALLOWED) == {'status': 'denied', 'hits': []}),
        ('workflow_denied', module.workflow(None, 'zone-secret', module.ALLOWED) == {'status': 'denied', 'attempts': 0}),
        ('budget', module.workflow(index, 'zone-a', module.ALLOWED, timeouts=99)['attempts'] == 2),
        ('missing_evidence', module.workflow(index, 'zone-a', module.ALLOWED, strip_evidence=True)['status'] == 'unknown'),
        ('wrong_evidence', not module.evidence_ok(dict(baseline, evidence_ids=['e-edge']), index, 'zone-a', module.ALLOWED)),
    ]
    for label, ok in cases:
        check(ok, 'Lab invariant failed: ' + label)
    return len(expected), len(cases)


def documents():
    link_count = 0
    for path in FILES:
        if path.suffix != '.md':
            continue
        text = path.read_text()
        check('\ufffd' not in text, f'Replacement character: {path.relative_to(ROOT)}')
        check(not re.search(r'\b(?:TODO|TBD|FIXME)\b', text), f'Unfilled marker: {path.name}')
        for delimiter in ['```', '~~~']:
            check(sum(line.startswith(delimiter) for line in text.splitlines()) % 2 == 0,
                  f'Unbalanced code fence: {path.name}')
        clean = FENCE.sub('', text)
        for raw in re.findall(r'!?\[[^\]]*\]\(([^)]+)\)', clean):
            parsed = urlsplit(raw.strip('<>'))
            if parsed.scheme or parsed.netloc:
                continue
            link_count += 1
            target = (path.parent / unquote(parsed.path)) if parsed.path else path
            allowed = public_path(target)
            check(allowed and target.exists(),
                  f'Missing local link: {path.relative_to(ROOT)} -> {raw}')
            if allowed and parsed.fragment and target.is_file() and target.suffix == '.md':
                headings = re.findall(r'^#{1,6}\s+(.*)$', target.read_text(), re.M)
                slugs = {re.sub(r'[^\w\s\-]', '', h.lower()).replace(' ', '-') for h in headings}
                check(unquote(parsed.fragment) in slugs, f'Missing heading: {path.name} -> {raw}')
    for filename in ['README.md', 'LICENSE', 'LICENSE-DOCS', 'NOTICE.md', 'AGENTS.md',
                     'CONTRIBUTING.md', '.gitignore', 'templates/learning-progress.md']:
        check((ROOT / filename).is_file(), 'Missing required file: ' + filename)
    return link_count


def main():
    snippet_count = snippets()
    lab_count, invariant_count = labs()
    link_count = documents()
    print(json.dumps({'python': sys.version.split()[0], 'sqlite': sqlite3.sqlite_version,
                      'files': len(FILES), 'markdown_files': sum(p.suffix == '.md' for p in FILES),
                      'python_snippets': snippet_count, 'labs': lab_count,
                      'lab_invariants': invariant_count, 'local_links': link_count,
                      'errors': ERRORS}, ensure_ascii=False, indent=2))
    return 1 if ERRORS else 0


if __name__ == '__main__':
    raise SystemExit(main())
