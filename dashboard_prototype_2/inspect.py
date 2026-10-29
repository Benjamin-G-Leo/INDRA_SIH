#!/usr/bin/env python3
filepath = r'c:\Users\User\Documents\INDRA_SIH\dashboard_prototype_2\components\dashboard\AnalysisView.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Total lines: {len(lines)}')
for i in range(318, min(330, len(lines))):
    print(f'Line {i+1}: {repr(lines[i])}')

print('---')
for i in range(334, min(342, len(lines))):
    print(f'Line {i+1}: {repr(lines[i])}')

print('---')
for i in range(374, min(382, len(lines))):
    print(f'Line {i+1}: {repr(lines[i])}')