# --- Base Stage (โครงสร้างพื้นฐาน) ---
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# --- Development Stage (สำหรับเขียนโค้ด) ---
FROM base AS dev
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# --- Production Stage (สำหรับใช้งานจริง) ---
FROM base AS production
RUN npm ci --only=production
ENV NODE_ENV=production
COPY . .
USER node
CMD ["node", "server.js"]
