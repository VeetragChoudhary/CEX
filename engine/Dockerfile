FROM node:22-alpine AS build
WORKDIR /app

# Copy manifests first so npm ci is only re-run when dependencies change.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc -b

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

USER node
CMD ["node", "./dist/index.js"]
