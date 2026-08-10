FROM node:22.23.2-alpine3.23 AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/Vibe-Workflow/packages/workflow-builder/package*.json ./packages/Vibe-Workflow/packages/workflow-builder/
COPY packages/Open-Poe-AI/packages/agents/package*.json ./packages/Open-Poe-AI/packages/agents/
COPY packages/Open-AI-Design-Agent/packages/design-agent/package*.json ./packages/Open-AI-Design-Agent/packages/design-agent/
COPY packages/studio/package*.json ./packages/studio/
RUN npm ci --ignore-scripts

FROM deps AS builder
COPY . .
RUN npm run build:packages
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
USER node
EXPOSE 3000
CMD ["./node_modules/.bin/next", "start"]
