FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.10.13 prune @repo/api --docker

FROM base AS builder
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
RUN pnpm turbo build --filter=@repo/api

FROM builder AS migrator
CMD ["pnpm", "--filter", "@repo/database", "db:migrate"]

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=prod PORT=4000
COPY --from=builder --chown=node:node /repo/apps/api/dist ./dist
USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]