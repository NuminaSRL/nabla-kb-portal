#!/bin/bash
# Add dynamic export to all API routes that don't have it

find src/app/api -name "route.ts" -type f | while read file; do
  if ! grep -q "export const dynamic" "$file"; then
    echo "Fixing $file"
    # Add after imports, before first export function
    sed -i.bak '/^export async function/i\
export const dynamic = '\''force-dynamic'\'';' "$file"
  fi
done

echo "Done!"
