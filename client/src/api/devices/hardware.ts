// src/api/devices/hardware.ts
import apiClient from '../axios';
import { type HardwareType } from './HardwareTypes';
import { type Tenant } from '../organization/tenancy/tenant';
import { type Rack } from '../organization/locations/rack';

export interface Hardware {
  id: string;
  name: string;
  serialNumber?: string;
  status: 'active' | 'maintenance' | 'failed' | 'offline' | 'reserved' | 'deprecated';
  manufacturer?: string;
  model?: string;
  
  // Location
  rackId: string;
  uPosition: number;
  uHeight: number;
  rack?: Rack; // Nested Path: Rack -> Room -> Site -> Zone -> Region

  // Relations
  hardwareTypeId: string;
  hardwareType?: HardwareType;
  tenantId?: string;
  tenant?: Tenant;

  createdAt: string;
  updatedAt: string;
}

export interface HardwareResponse {
  results: Hardware[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export const hardwareApi = {
  getHardwares: async (
    page = 1, 
    limit = 10, 
    search = '', 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    filters: Record<string, any> = {}
  ): Promise<HardwareResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });
    if (search) params.append('search', search);
    
    // Append filters (rackId, typeId, etc.)
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });

    const response = await apiClient.get(`/hardwares?${params.toString()}`);
    return response.data;
  },

  createHardware: async (data: any) => {
    const response = await apiClient.post('/hardwares', data);
    return response.data;
  },

  updateHardware: async (id: string, data: any) => {
    const response = await apiClient.patch(`/hardwares/${id}`, data);
    return response.data;
  },

  deleteHardware: async (id: string) => {
    const response = await apiClient.delete(`/hardwares/${id}`);
    return response.data;
  },
};