// src/api/organization/tenancy/tenant.ts

import apiClient from '../../axios';
import { type TenantGroup } from './tenantGroup';

export interface Tenant {
  id: string;
  name: string;
  description?: string;
  tenantGroupId: string;
  group?: TenantGroup; // 👈 เพื่อให้เข้าถึง tenant.group.name ได้
  createdAt: string;
  updatedAt: string;
}

export interface TenantResponse {
  results: Tenant[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export const tenantApi = {
  getTenants: async (
    page = 1, 
    limit = 10, 
    search = '', 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    tenantGroupId?: string
  ): Promise<TenantResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });
    if (search) params.append('search', search);
    if (tenantGroupId) params.append('tenantGroupId', tenantGroupId);

    const response = await apiClient.get(`/tenants?${params.toString()}`);
    return response.data;
  },

  createTenant: async (data: any) => {
    const response = await apiClient.post('/tenants', data);
    return response.data;
  },

  updateTenant: async (id: string, data: any) => {
    const response = await apiClient.patch(`/tenants/${id}`, data);
    return response.data;
  },

  deleteTenant: async (id: string) => {
    const response = await apiClient.delete(`/tenants/${id}`);
    return response.data;
  },
};