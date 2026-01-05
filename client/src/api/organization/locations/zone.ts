// src/api/organization/locations/zone.ts
import apiClient from '../../axios';
import { type Region } from './region'; 

export interface Zone {
  id: string;
  name: string;
  description?: string;
  siteCount?: number | string;
  regionId: string;
  createdAt: string;
  updatedAt: string;
  region?: Region;
}

export interface ZoneResponse {
  results: Zone[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export const zoneApi = {
  // 👇 แก้บรรทัดนี้: เพิ่ม regionId? ท้ายสุด
  getZones: async (
    page = 1, 
    limit = 10, 
    search = '', 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    regionId?: string // 👈 เพิ่ม Optional Parameter
  ): Promise<ZoneResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });
    if (search) params.append('search', search);
    // 👇 เพิ่ม Logic ส่ง regionId ไป Backend
    if (regionId) params.append('regionId', regionId);

    const response = await apiClient.get(`/zones?${params.toString()}`);
    return response.data;
  },

  // ... (create, update, delete เหมือนเดิม) ...
  createZone: async (data: any) => { const r = await apiClient.post('/zones', data); return r.data; },
  updateZone: async (id: string, data: any) => { const r = await apiClient.patch(`/zones/${id}`, data); return r.data; },
  deleteZone: async (id: string) => { const r = await apiClient.delete(`/zones/${id}`); return r.data; },
};