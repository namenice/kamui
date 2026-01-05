# --- Base Stage (โครงสร้างพื้นฐาน) ---
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# --- Development Stage (สำหรับเขียนโค้ด) ---
FROM base AS dev
# ลง dependencies ทั้งหมด (รวม devDependencies)
RUN npm install
# Copy โค้ดทั้งหมด (เผื่อไว้กรณีไม่ได้ Mount Volume)
COPY . .
# รันด้วย nodemon (ผ่าน script dev ใน package.json)
CMD ["npm", "run", "dev"]

# --- Production Stage (สำหรับใช้งานจริง) ---
FROM base AS production
# ลงเฉพาะ dependencies ที่จำเป็น (ตัด devDependencies ออก)
RUN npm ci --only=production
# Copy โค้ดเข้า image
COPY . .
# ใช้ user 'node' เพื่อความปลอดภัย (ไม่ใช้ root)
USER node
# รัน server
CMD ["node", "server.js"]
