# HumanizeAI Frontend
FROM node:18-alpine as frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production

COPY frontend/ ./
RUN npm run build

# HumanizeAI Backend
FROM node:18-alpine as backend-build

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./
RUN npm run build

# Final production image
FROM node:18-alpine

WORKDIR /app

# Copy backend build
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["node", "backend/dist/index.js"]
