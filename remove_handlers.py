import os

file_path = r'c:\GitRepos\TheBlackBox\src\components\widgets\WidgetCanvas.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_index = -1
end_index = -1

for i, line in enumerate(lines):
    if 'onResizeStart={() => startAutoScroll()}' in line:
        start_index = i
    if 'onDragStop={(e, d) => {' in line:
        end_index = i
        # We want to keep onDragStop, so we stop deleting before it.

if start_index != -1 and end_index != -1:
    print(f"Deleting lines {start_index} to {end_index}")
    # Remove lines from start_index up to (but not including) end_index
    final_lines = lines[:start_index] + lines[end_index:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(final_lines)
    print("Success")
else:
    print("Could not find start/end markers")
