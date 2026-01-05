// src/api/devices/hardwareInfo.ts
import apiClient from '../axios';

// Interface สำหรับข้อมูล 1 แถว
export interface HardwareInfo {
  id: string;
  manufacturer: string;
  model: string;
  height: number;
  hardwareTypeId: string;
  hardwareCount?: number;
  // Relation ที่ Backend Include มาให้ (ชื่อ alias 'hardwareType')
  hardwareType?: {
    id: string;
    name: string;
    category?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Interface สำหรับ Response ของ List (Pagination)
export interface HardwareInfoResponse {
  results: HardwareInfo[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export const hardwareInfoApi = {
  // 1. Get List (รองรับ Search & Filter)
  getHardwareInfos: async (
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    // Filters เพิ่มเติม
    manufacturer = '',
    hardwareTypeId = ''
  ): Promise<HardwareInfoResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    if (search) params.append('search', search);
    if (manufacturer) params.append('manufacturer', manufacturer);
    if (hardwareTypeId) params.append('hardwareTypeId', hardwareTypeId);

    const response = await apiClient.get(`/hardware-infos?${params.toString()}`);
    return response.data;
  },

  // 2. Get One (เผื่อใช้ดึงข้อมูลตอน Edit)
  getHardwareInfoById: async (id: string): Promise<HardwareInfo> => {
    const response = await apiClient.get(`/hardware-infos/${id}`);
    return response.data;
  },

  // 3. Create
  createHardwareInfo: async (data: {
    manufacturer: string;
    model: string;
    height: number;
    hardwareTypeId: string;
  }) => {
    const response = await apiClient.post('/hardware-infos', data);
    return response.data;
  },

  // 4. Update
  updateHardwareInfo: async (id: string, data: Partial<HardwareInfo>) => {
    const response = await apiClient.patch(`/hardware-infos/${id}`, data);
    return response.data;
  },

  // 5. Delete
  deleteHardwareInfo: async (id: string) => {
    const response = await apiClient.delete(`/hardware-infos/${id}`);
    return response.data;
  },
};