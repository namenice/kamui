// src/api/organization/tenancy/tenantGroup.ts

import apiClient from '../../axios'; // ปรับ path ตามโครงสร้างโปรเจกต์จริงของคุณ

export interface TenantGroup {
  id: string;
  name: string;
  description?: string;
  tenantCount: string | number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantGroupResponse {
  results: TenantGroup[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export const tenantGroupApi = {
  getTenantGroups: async (
    page = 1, 
    limit = 10, 
    search = '', 
    sortBy = 'createdAt', 
    sortOrder = 'desc'
  ): Promise<TenantGroupResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });
    if (search) params.append('search', search);

    const response = await apiClient.get(`/tenant-groups?${params.toString()}`);
    return response.data;
  },

  createTenantGroup: async (data: any) => {
    const response = await apiClient.post('/tenant-groups', data);
    return response.data;
  },

  updateTenantGroup: async (id: string, data: any) => {
    const response = await apiClient.patch(`/tenant-groups/${id}`, data);
    return response.data;
  },

  deleteTenantGroup: async (id: string) => {
    const response = await apiClient.delete(`/tenant-groups/${id}`);
    return response.data;
  },
};