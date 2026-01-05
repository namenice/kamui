// src/api/organization/locations/rack.ts
import apiClient from '../../axios';
import { type Room } from './room';

export interface Rack {
  id: string;
  name: string;
  description?: string;
  unit: number; // ความสูงตู้ (U)
  roomId: string;
  room?: Room; // 👈 Nested: Rack -> Room -> Site -> Zone -> Region
  createdAt: string;
  updatedAt: string;
}

export interface RackResponse {
  results: Rack[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export const rackApi = {
  getRacks: async (page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc') => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), sortBy, sortOrder });
    if (search) params.append('search', search);
    const response = await apiClient.get(`/racks?${params.toString()}`);
    return response.data;
  },

  createRack: async (data: any) => { const r = await apiClient.post('/racks', data); return r.data; },
  updateRack: async (id: string, data: any) => { const r = await apiClient.patch(`/racks/${id}`, data); return r.data; },
  deleteRack: async (id: string) => { const r = await apiClient.delete(`/racks/${id}`); return r.data; },
};