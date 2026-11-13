#!/usr/bin/env bash
set -euo pipefail

read -rp "Enter module name: " MODULE_NAME

if [[ -z "$MODULE_NAME" ]]; then
  echo "Module name is required"
  exit 1
fi

MODULE_DIR="$(echo "$MODULE_NAME" | tr '-' '_')"
FILE_NAME="$(echo "$MODULE_NAME" | tr '_' '-')"
CONST_PREFIX="$(echo "$MODULE_NAME" | tr '[:lower:]-' '[:upper:]_')"
CLASS_NAME="$(echo "$MODULE_NAME" | sed -E 's/[-_]+/ /g' | awk '{ for (i=1; i<=NF; i++) printf toupper(substr($i,1,1)) substr($i,2) }')Module"

mkdir -p "$MODULE_DIR/controller" "$MODULE_DIR/dto" "$MODULE_DIR/services"

touch "$MODULE_DIR/$FILE_NAME.constants.ts"
touch "$MODULE_DIR/$FILE_NAME.config.ts"

cat > "$MODULE_DIR/$FILE_NAME.module.ts" <<EOF
import { Module } from '@nestjs/common';

@Module({
    imports: [],
    controllers: [],
    providers: [],
    exports: [],
})
export class $CLASS_NAME {}
EOF

cat > "$MODULE_DIR/$FILE_NAME.config.ts" <<EOF
export const ${CONST_PREFIX}_TAGS: string[] = ['$CLASS_NAME'];

export const ${CONST_PREFIX}_CONFIG = {} as const;
EOF

cat > "$MODULE_DIR/$FILE_NAME.constants.ts" <<EOF
export const ${CONST_PREFIX}_RESPONSES: Record<number, string> = {};
EOF

echo "Created module: $MODULE_DIR"