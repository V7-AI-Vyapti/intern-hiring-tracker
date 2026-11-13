FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

ENV NODE_ENV="development"

COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY . .

RUN pnpm install
RUN pnpm --filter "intern-hiring-tracker..." --workspace-root run build
RUN printf '%s\n' \
  '#!/bin/sh' \
  'set -e' \
  'cd /app' \
  'if [ "${GENERATED_PROJECT_RUN_FIXTURES:-true}" = "true" ]; then' \
  '  if [ -f dist/scripts/ingest-fixtures.js ]; then' \
  '    pnpm run ingest:fixtures:prod' \
  '  else' \
  '    echo "Skipping fixtures: dist/scripts/ingest-fixtures.js not found (did nest build emit src/scripts?)"' \
  '  fi' \
  'fi' \
  'exec "$@"' \
  > /usr/local/bin/generated-project-entrypoint \
  && chmod +x /usr/local/bin/generated-project-entrypoint

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/generated-project-entrypoint"]
CMD ["pnpm", "run", "start:prod"]
