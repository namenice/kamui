// src/api/organization/locations/room.ts
import apiClient from '../../axios';
import { type Site } from './site';

export interface Room {
  id: string;
  name: string;
  description?: string;
  rackCount?: number | string;
  siteId: string;
  site?: Site;
  createdAt: string;
  updatedAt: string;
}

export interface RoomResponse {
  results: Room[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export const roomApi = {
  // 👇 แก้บรรทัดนี้: เพิ่ม siteId?
  getRooms: async (
    page = 1, 
    limit = 10, 
    search = '', 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    siteId?: string // 👈 เพิ่ม Optional Param
  ): Promise<RoomResponse> => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), sortBy, sortOrder });
    if (search) params.append('search', search);
    // 👇 ส่ง siteId ไปหา Backend
    if (siteId) params.append('siteId', siteId);

    const response = await apiClient.get(`/rooms?${params.toString()}`);
    return response.data;
  },

  createRoom: async (data: any) => { const r = await apiClient.post('/rooms', data); return r.data; },
  updateRoom: async (id: string, data: any) => { const r = await apiClient.patch(`/rooms/${id}`, data); return r.data; },
  deleteRoom: async (id: string) => { const r = await apiClient.delete(`/rooms/${id}`); return r.data; },
};