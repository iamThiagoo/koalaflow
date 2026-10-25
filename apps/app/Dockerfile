FROM node:24-slim AS build
RUN corepack enable
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile
RUN NX_DAEMON=false pnpm nx build @koalaflow/app

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /srv

COPY --from=build --chown=node:node /repo/apps/app/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/app/.next/static ./apps/app/.next/static

USER node
EXPOSE 3001

CMD ["node", "apps/app/server.js"]
