#!/bin/bash

# Use this script to generate a combined file from various source files in a project.
# It scans directories, filters files based on patterns, and allows manual file inclusion.
# Ensure the script is run from the project root directory
# and has the necessary permissions to read files.
# Then you can share the combined files with your favorite AI model.

# === Configuration ===
output_file="combined_data.txt"
max_lines=6500
render_tree_output=true
ignore_root_files=false
allow_root_files=("") # Root files to include if ignore_root_files is true

# Directories to scan — use ("NONE") to skip or ("ALL") to scan everything
directories=("ALL")

# Optional: manually include individual files
files=()

# Ignore folders/paths (partial match)
ignore_paths=(
  "node_modules" ".next" "dist" "build" "logs" "test" "__tests__"
  "schema" ".open-next" ".sst" ".trash" ".github"
  ".env" ".env.*" ".yarn" ".vscode" ".git"
)

# Ignore file patterns
ignore_patterns=(
  "*.test.ts" "*.test.tsx" "*.spec.ts" "*.spec.tsx" "*combined_data.txt"
  "*.stories.tsx" "*.stories.ts"
)

# === Colors (if supported) ===
if command -v tput &>/dev/null && [ "$(tput colors)" -ge 8 ]; then
  GREEN="$(tput setaf 2)"
  YELLOW="$(tput setaf 3)"
  RED="$(tput setaf 1)"
  RESET="$(tput sgr0)"
else
  GREEN="" YELLOW="" RED="" RESET=""
fi

# === Start Script ===
> "$output_file"
echo -e "${GREEN}🟢 Generating combined file from source...${RESET}"

# Adjust directories
if [[ ${#directories[@]} -eq 1 && ${directories[0]} == "ALL" ]]; then
  directories=(".")
  echo -e "${YELLOW}📁 Scanning all project directories recursively...${RESET}"
elif [[ ${directories[0]} == "NONE" ]]; then
  directories=()
  echo -e "${YELLOW}⚠️ Skipping directory scan (manual file mode)...${RESET}"
fi

# === Directory Tree (Optional) ===
if [[ "$render_tree_output" == true && -x "$(command -v tree)" ]]; then
  ignore_str=$(IFS="|"; echo "${ignore_paths[*]}")
  echo -e "\n########## DIRECTORY TREE ##########\n" >> "$output_file"
  tree . -I "$ignore_str" >> "$output_file"
  echo -e "\n\n" >> "$output_file"
fi

# === File Discovery ===
temp_file_list=$(mktemp)
trap 'rm -f "$temp_file_list"' EXIT

if [[ ${#directories[@]} -gt 0 ]]; then
  echo -e "${GREEN}🔍 Finding source files...${RESET}"
  find "${directories[@]}" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) > "$temp_file_list"
fi

# === Filter Results ===
filtered_list=$(mktemp)
trap 'rm -f "$filtered_list"' RETURN

grep -vE "$(IFS="|"; echo "${ignore_paths[*]}")" "$temp_file_list" | while read -r file; do
  # Match filename patterns
  skip=false
  for pattern in "${ignore_patterns[@]}"; do
    [[ "$file" == $pattern ]] && { skip=true; break; }
  done
  [[ "$skip" == false ]] && echo "$file"
done > "$filtered_list"

# === Write to Output File ===
included_count=0
while IFS= read -r file; do
  [[ ! -f "$file" ]] && continue

  # Skip root-level files (e.g., ./tsconfig.json) unless allowlisted
  if [[ "$ignore_root_files" == true && "$file" =~ ^\./[^/]+$ ]]; then
    basename_file=$(basename "$file")
    keep=false
    for allowed in "${allow_root_files[@]}"; do
      [[ "$basename_file" == "$allowed" ]] && keep=true
    done
    if [[ "$keep" == false ]]; then
      echo -e "${YELLOW}⚠️ Skipping root-level config file: $file${RESET}"
      continue
    fi
  fi

  line_count=$(wc -l < "$file")
  if (( line_count > max_lines )); then
    echo -e "${YELLOW}⚠️ Skipping large file ($line_count lines): $file${RESET}"
    continue
  fi

  echo "########## FILE: $file ##########" >> "$output_file"
  cat "$file" >> "$output_file"
  echo -e "\n\n" >> "$output_file"
  ((included_count++))
done < "$filtered_list"

# === Manual File Additions ===
if [[ ${#files[@]} -gt 0 ]]; then
  echo -e "${GREEN}📄 Including specified individual files...${RESET}"
  for file in "${files[@]}"; do
    [[ ! -f "$file" ]] && {
      echo -e "${RED}❌ File not found: $file${RESET}"
      continue
    }
    line_count=$(wc -l < "$file")
    if (( line_count > max_lines )); then
      echo -e "${YELLOW}⚠️ Skipping $file (too large)${RESET}"
      continue
    fi
    echo "########## FILE: $file ##########" >> "$output_file"
    cat "$file" >> "$output_file"
    echo -e "\n\n" >> "$output_file"
    ((included_count++))
  done
fi

# === Completion ===
echo -e "${GREEN}✅ Done! Combined $included_count files into $output_file.${RESET}"
