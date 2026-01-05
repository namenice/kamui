// src/api/auth/auth.ts
import apiClient from '../axios';

export const authApi = {
  login: async (credentials: any) => {
    // ส่ง email, password ไปที่ backend
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  }
};