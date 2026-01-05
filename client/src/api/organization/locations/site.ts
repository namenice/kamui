// src/api/organization/locations/site.ts
import apiClient from '../../axios';
import { type Zone } from './zone'; // ต้องใช้ Type Zone

export interface Site {
  id: string;
  name: string;
  description?: string;
  roomCount?: number | string;
  zoneId: string;
  zone?: Zone; // 👈 Nested Object (Site -> Zone -> Region)
  createdAt: string;
  updatedAt: string;
}

export interface SiteResponse {
  results: Site[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export const siteApi = {
  getSites: async (
    page = 1, 
    limit = 10, 
    search = '', 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    zoneId?: string
  ): Promise<SiteResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });
    if (search) params.append('search', search);
    if (zoneId) params.append('zoneId', zoneId);

    const response = await apiClient.get(`/sites?${params.toString()}`);
    return response.data;
  },

  createSite: async (data: any) => {
    const response = await apiClient.post('/sites', data);
    return response.data;
  },

  updateSite: async (id: string, data: any) => {
    const response = await apiClient.patch(`/sites/${id}`, data);
    return response.data;
  },

  deleteSite: async (id: string) => {
    const response = await apiClient.delete(`/sites/${id}`);
    return response.data;
  },
};