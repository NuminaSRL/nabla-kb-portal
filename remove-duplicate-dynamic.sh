#!/bin/bash
# Remove duplicate dynamic exports

find src/app/api -name "route.ts" -type f | while read file; do
  # Count occurrences
  count=$(grep -c "export const dynamic" "$file" 2>/dev/null || echo "0")
  
  if [ "$count" -gt 1 ]; then
    echo "Fixing duplicates in $file"
    # Keep only the first occurrence
    awk '!seen && /export const dynamic/ {seen=1; print; next} !/export const dynamic/ {print}' "$file" > "$file.tmp"
    mv "$file.tmp" "$file"
  fi
done

echo "Done!"
