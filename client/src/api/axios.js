// src/api/axios.js
import axios from 'axios';


const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. ก่อนส่ง Request: แอบยัด Token ใส่ Header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. หลังรับ Response: ถ้า Token หมดอายุ (401) ให้ดีดไปหน้า Login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // เช็คว่า Error มาจาก Request ไหน
    const originalRequest = error.config;

    // ถ้าเป็น 401 และ **ไม่ใช่** การยิงไปที่ /auth/login (คือ Token หมดอายุจริงๆ) ค่อย Redirect
    if (
      error.response && 
      error.response.status === 401 && 
      !originalRequest.url.includes('/auth/login') // 👈 เพิ่มเงื่อนไขนี้
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
