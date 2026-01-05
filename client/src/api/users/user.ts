// src/api/users/user.ts
import apiClient from '../axios';

export interface User {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'pending' | 'banned'; 
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  results: User[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export const userApi = {
  // getUsers: async (): Promise<UserResponse> => {
  //   const response = await apiClient.get('/users');
  //   return response.data;
  // },
  // getUsers: async (page = 1, limit = 10): Promise<UserResponse> => {
  //   // ส่ง query params ไปหา backend
  //   const response = await apiClient.get(`/users?page=${page}&limit=${limit}`);
  //   return response.data;
  // },

  getUsers: async (
    page = 1, 
    limit = 10, 
    search = '', 
    sortBy = 'createdAt', 
    sortOrder = 'desc'
  ): Promise<UserResponse> => {
    // สร้าง Query String
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    // ถ้ามีคำค้นหา ค่อยส่งไป
    if (search) {
      params.append('search', search); // หรือ backend บางที่ใช้ 'q' หรือ 'keyword'
    }

    const response = await apiClient.get(`/users?${params.toString()}`);
    return response.data;
  },

  createUser: async (data: any) => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: any) => {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};