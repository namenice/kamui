# --- Base Stage (ติดตั้ง Library) ---
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
# ติดตั้ง dependencies (ใช้ร่วมกันทั้ง dev และตอน build)
RUN npm install

# --- Development Stage (สำหรับเขียนโค้ด) ---
FROM base AS dev
COPY . .
EXPOSE 5173
# รัน Vite แบบเปิด Host
CMD ["npm", "run", "dev", "--", "--host"]

# --- Builder Stage (เตรียมไฟล์สำหรับ Prod) ---
FROM base AS build
COPY . .
# สั่ง Build (จะได้ folder /dist ออกมา)
RUN npm run build

# --- Production Stage (ใช้ Nginx) ---
FROM nginx:alpine AS production
# Copy ไฟล์ที่ Build เสร็จแล้วจาก stage 'build' มาไว้ที่ Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Copy config ของ Nginx เข้าไป (ต้องสร้างไฟล์ nginx.conf ด้วย)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
