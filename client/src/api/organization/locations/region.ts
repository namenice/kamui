// src/api/organization/locations/region.ts

import apiClient from '../../axios'; 

export interface Region {
  id: string;
  name: string;
  description: string;
  zoneCount?: number | string;
  createdAt: string;
  updatedAt: string;
}

export interface RegionResponse {
  results: Region[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export const regionApi = {
  getRegions: async (
    page = 1, 
    limit = 10, 
    search = '', 
    sortBy = 'createdAt', 
    sortOrder = 'desc'
  ): Promise<RegionResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    // ถ้ามีการค้นหา ให้ส่ง param ไป (Backend ต้องรองรับ param 'search' หรือ 'name' นะครับ)
    if (search) {
      params.append('search', search); 
    }

    const response = await apiClient.get(`/regions?${params.toString()}`);
    return response.data;
  },

  // รับแค่ name กับ description ตอนสร้าง
  createRegion: async (data: { name: string; description?: string }) => {
    const response = await apiClient.post('/regions', data);
    return response.data;
  },

  // รับ partial data ตอนแก้ไข
  updateRegion: async (id: string, data: { name?: string; description?: string }) => {
    const response = await apiClient.patch(`/regions/${id}`, data);
    return response.data;
  },

  deleteRegion: async (id: string) => {
    const response = await apiClient.delete(`/regions/${id}`);
    return response.data;
  },
};