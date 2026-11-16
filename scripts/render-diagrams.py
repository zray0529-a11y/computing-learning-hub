#!/usr/bin/env python3
"""Rebuild the three existing Mermaid flowcharts as SVG. Requires Graphviz dot.

Only the flowchart syntax used by this curriculum is accepted; an unsupported
line fails explicitly, so future edits cannot silently lose a node or edge.
"""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NODE = r'([A-Za-z][A-Za-z0-9_]*)(?:\[(?:"([^"]*)"|([^\]]*))\]|\{([^}]*)\})?'
EDGE = re.compile(r'^\s*' + NODE + r'\s*-->\s*(?:\|([^|]*)\|\s*)?' + NODE + r'\s*$')


def render(source):
    nodes = {}
    edges = []
    for line in source.strip().splitlines():
        if line.strip() in ('flowchart TD', 'flowchart TB'):
            continue
        match = EDGE.fullmatch(line)
        if not match:
            raise ValueError('Unsupported diagram line: ' + line)
        left, quoted, plain, decision, label, right, quoted_r, plain_r, decision_r = match.groups()
        for key, q, p, d in [(left, quoted, plain, decision), (right, quoted_r, plain_r, decision_r)]:
            if q is not None or p is not None or d is not None:
                value = (q if q is not None else p if p is not None else d, 'diamond' if d is not None else 'box')
                if key in nodes and nodes[key] != value:
                    raise ValueError('Conflicting node: ' + key)
                nodes[key] = value
        edges.append((left, right, label))
    if any(key not in nodes for edge in edges for key in edge[:2]):
        raise ValueError('Diagram contains an undefined node')
    lines = ['digraph G {',
             'graph [rankdir=TB,bgcolor="transparent",pad="0.25",nodesep="0.35",ranksep="0.45"];',
             'node [fontname="Noto Sans CJK SC",fontsize=14,style="rounded,filled",fillcolor="#e8f2ec",color="#8ba99a",fontcolor="#174f3e",margin="0.18,0.12"];',
             'edge [fontname="Noto Sans CJK SC",fontsize=11,color="#6f8c7e",fontcolor="#355d4c",arrowsize=0.65];']
    for key, (label, shape) in nodes.items():
        lines.append(key + ' [label=' + json.dumps(label, ensure_ascii=False) + ',shape=' + shape + '];')
    for left, right, label in edges:
        lines.append(left + ' -> ' + right + (' [label=' + json.dumps(label, ensure_ascii=False) + ']' if label else '') + ';')
    lines.append('}')
    result = subprocess.run(['dot', '-Tsvg'], input='\n'.join(lines), text=True, capture_output=True, check=True)
    svg = result.stdout[result.stdout.index('<svg '):]
    return svg.replace('<svg ', '<svg role="img" aria-label="教材流程图" ', 1)


def main():
    catalog = json.loads((ROOT / 'site-src/catalog.json').read_text())
    diagrams = {}
    fence = chr(96) * 3
    for entry in catalog['documents']:
        path = ROOT / entry['path']
        if path.suffix != '.md':
            continue
        for source in re.findall(fence + r'mermaid\s*\n(.*?)' + fence, path.read_text(), re.S):
            source = source.strip()
            digest = hashlib.sha256(source.encode()).hexdigest()
            diagrams[digest] = {'source': source, 'path': entry['path'], 'svg': render(source)}
    (ROOT / 'site-src/diagrams.json').write_text(json.dumps(diagrams, ensure_ascii=False, indent=2) + '\n')
    print('Rendered', len(diagrams), 'source-verified flowcharts')


if __name__ == '__main__':
    main()
