// src/api/devices/interfaceConnection.ts
import apiClient from '../axios';

export interface InterfaceConnection {
  id: string;
  name: string;
  macAddress?: string;
  ipAddress?: string;
  speed?: string;
  type?: string;
  hardwareId: string;
  connectedSwitchId?: string | null;
  connectedPort?: string;
  
  // Relations (Backend includes these)
  parentDevice?: {
    id: string;
    name: string;
    serialNumber?: string;
  };
  connectedSwitch?: {
    id: string;
    name: string;
    oobIp?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface InterfaceConnectionResponse {
  results: InterfaceConnection[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export const interfaceConnectionApi = {
getInterfaceConnections: async (
    hardwareId: string = '', 
    page = 1, 
    limit = 20, 
    sortBy = 'name', 
    sortOrder = 'asc',
    search = '' // รองรับ search ด้วย
  ): Promise<InterfaceConnectionResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    if (hardwareId) params.append('hardwareId', hardwareId);
    if (search) params.append('search', search); // ส่งคำค้นหาไป

    const response = await apiClient.get(`/interface-connections?${params.toString()}`);
    return response.data;
  },


  createInterfaceConnection: async (data: any) => {
    const response = await apiClient.post('/interface-connections', data);
    return response.data;
  },

  updateInterfaceConnection: async (id: string, data: any) => {
    const response = await apiClient.patch(`/interface-connections/${id}`, data);
    return response.data;
  },

  deleteInterfaceConnection: async (id: string) => {
    const response = await apiClient.delete(`/interface-connections/${id}`);
    return response.data;
  },
};