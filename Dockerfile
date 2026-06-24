# --- build stage ---
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime stage ---
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# Same image serves both roles. Default is the API; set SERVICE_ROLE=worker
# (Railway worker service) to run the queue consumer instead.
CMD ["sh", "-c", "if [ \"$SERVICE_ROLE\" = worker ]; then node dist/worker.js; else node dist/main.js; fi"]
