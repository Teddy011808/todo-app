
# ---- build: compile TypeScript to dist/ ----
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# No install scripts needed: argon2 ships prebuilt Linux binaries
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---- runtime: only dist/ and production packages ----
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
# Run node directly: `npm start` would trigger the prestart hook
CMD ["node", "dist/main.js"]
