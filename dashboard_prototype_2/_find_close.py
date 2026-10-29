with open('lib/data.ts', 'r') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if line.strip() == ']' and i > 540:
        for j in range(i+1, min(i+5, len(lines))):
            if lines[j].strip() and 'export const alerts' in lines[j]:
                print('Found closing ] at line', i+1)
                print('  Content:', repr(lines[i].rstrip()))
                print('  Next line:', repr(lines[i+1].rstrip() if i+1 < len(lines) else 'EOF'))
                break