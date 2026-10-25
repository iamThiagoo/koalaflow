FROM node:24-slim AS build
RUN corepack enable
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile
RUN NX_DAEMON=false pnpm nx build @koalaflow/api

# Production dependencies only
RUN pnpm --filter @koalaflow/api deploy --prod --legacy /out
RUN cp -r apps/api/dist /out/dist

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /srv

# Rule: RDS certificates are signed by the Amazon RDS CA, which node does not trust by default.
ADD --chown=node:node https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /etc/ssl/rds-global-bundle.pem
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/rds-global-bundle.pem

COPY --from=build --chown=node:node /out ./

USER node
EXPOSE 3000

CMD ["node", "dist/main.js"]
