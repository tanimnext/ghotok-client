# syntax=docker/dockerfile:1
# Ghotok client (Next.js, standalone output):
#   docker build --build-arg API_URL=http://ghotok-server:4000 \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://ghotok.com.bd \
#     --build-arg NEXT_PUBLIC_IMGBB_API_KEY=... -t ghotok-client .

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
# API_URL is where the Next.js server forwards /api (ghotok-server); rewrites are
# fixed at build time. NEXT_PUBLIC_* values are compiled into the browser bundle.
ARG API_URL=http://ghotok-server:4000
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_DEFAULT_LANG=en
ARG NEXT_PUBLIC_IMGBB_API_KEY=
ENV API_URL=$API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_DEFAULT_LANG=$NEXT_PUBLIC_DEFAULT_LANG \
    NEXT_PUBLIC_IMGBB_API_KEY=$NEXT_PUBLIC_IMGBB_API_KEY \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
