FROM node:22-alpine

WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@9 --activate

ENV NODE_ENV="development"

COPY . .

RUN pnpm install
RUN pnpm turbo build --filter=intern-hiring-tracker
RUN printf '%s\n' \
  '#!/bin/sh' \
  'set -e' \
  'cd /workspace' \
  'if [ "${GENERATED_PROJECT_RUN_FIXTURES:-true}" = "true" ]; then' \
  '  if pnpm --filter "intern-hiring-tracker" exec test -f dist/scripts/ingest-fixtures.js; then' \
  '    pnpm --filter "intern-hiring-tracker" run ingest:fixtures:prod' \
  '  else' \
  '    echo "Skipping fixtures: dist/scripts/ingest-fixtures.js not found (did nest build emit src/scripts?)"' \
  '  fi' \
  'fi' \
  'exec "$@"' \
  > /usr/local/bin/generated-project-entrypoint \
  && chmod +x /usr/local/bin/generated-project-entrypoint

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/generated-project-entrypoint"]
CMD ["pnpm", "--filter", "intern-hiring-tracker", "run", "start:prod"]
