// src/api/devices/hardwareType.ts
import apiClient from '../axios';

export interface HardwareType {
  id: string;
  name: string;
  category?: string;
  description?: string;
  hardwareCount?: number | string; // 👈 รับค่าจำนวนอุปกรณ์
  createdAt: string;
  updatedAt: string;
}

export interface HardwareTypeResponse {
  results: HardwareType[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export const hardwareTypeApi = {
  getHardwareTypes: async (
    page = 1, 
    limit = 10, 
    search = '', 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    category = ''
  ): Promise<HardwareTypeResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });
    if (search) params.append('search', search);
    if (category) params.append('category', category);

    const response = await apiClient.get(`/hardware-types?${params.toString()}`);
    return response.data;
  },

  createHardwareType: async (data: any) => {
    const response = await apiClient.post('/hardware-types', data);
    return response.data;
  },

  updateHardwareType: async (id: string, data: any) => {
    const response = await apiClient.patch(`/hardware-types/${id}`, data);
    return response.data;
  },

  deleteHardwareType: async (id: string) => {
    const response = await apiClient.delete(`/hardware-types/${id}`);
    return response.data;
  },
};