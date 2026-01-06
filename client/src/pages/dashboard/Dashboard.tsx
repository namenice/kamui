// src/pages/dashboard/Dashboard.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Server, Box, MapPin, Users, Activity, 
  HardDrive, Network, Building, Layers,
  Cpu, LayoutGrid, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// API Imports
import { hardwareApi } from '../../api/devices/hardware';
import { hardwareInfoApi } from '../../api/devices/hardwareInfo';
import { interfaceConnectionApi } from '../../api/devices/interfaceConnection';
import { tenantApi } from '../../api/organization/tenancy/tenant';
import { siteApi } from '../../api/organization/locations/site';
import { rackApi } from '../../api/organization/locations/rack';
import { zoneApi } from '../../api/organization/locations/zone';

// --- Components ---

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  colorClass: string;
  isLoading: boolean;
  link?: string;
}

const StatCard = ({ title, value, icon, colorClass, isLoading, link }: StatCardProps) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden`}
      onClick={() => link && navigate(link)}
    >
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-300 ${colorClass.replace('bg-', 'text-')}`}>
         {/* Background Icon Effect */}
         {React.cloneElement(icon as React.ReactElement, { size: 64 })}
      </div>

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded"></div>
          ) : (
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClass} text-white shadow-sm`}>
          {icon}
        </div>
      </div>
      
      {link && (
        <div className="mt-4 flex items-center text-xs font-medium text-slate-400 group-hover:text-blue-600 transition-colors">
          View Details <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  
  // --- Queries (Fetch limit=1 just to get totalResults) ---
  
  // 1. Devices Stats
  const { data: hwData, isLoading: hwLoading } = useQuery({
    queryKey: ['dashboard', 'hw-count'],
    queryFn: () => hardwareApi.getHardwares(1, 1),
    staleTime: 60 * 1000 // Cache 1 min
  });

  const { data: modelData, isLoading: modelLoading } = useQuery({
    queryKey: ['dashboard', 'model-count'],
    queryFn: () => hardwareInfoApi.getHardwareInfos(1, 1),
    staleTime: 60 * 1000
  });

  const { data: portData, isLoading: portLoading } = useQuery({
    queryKey: ['dashboard', 'port-count'],
    queryFn: () => interfaceConnectionApi.getInterfaceConnections('', 1, 1), // Empty string = Get All
    staleTime: 60 * 1000
  });

  // 2. Organization Stats
  const { data: siteData, isLoading: siteLoading } = useQuery({
    queryKey: ['dashboard', 'site-count'],
    queryFn: () => siteApi.getSites(1, 1),
    staleTime: 60 * 1000
  });

  const { data: zoneData, isLoading: zoneLoading } = useQuery({
    queryKey: ['dashboard', 'zone-count'],
    queryFn: () => zoneApi.getZones(1, 1),
    staleTime: 60 * 1000
  });

  const { data: rackData, isLoading: rackLoading } = useQuery({
    queryKey: ['dashboard', 'rack-count'],
    queryFn: () => rackApi.getRacks(1, 1),
    staleTime: 60 * 1000
  });

  // 3. Tenancy Stats
  const { data: tenantData, isLoading: tenantLoading } = useQuery({
    queryKey: ['dashboard', 'tenant-count'],
    queryFn: () => tenantApi.getTenants(1, 1),
    staleTime: 60 * 1000
  });

  return (
    <div className="p-6 max-w-[95rem] mx-auto animate-fade-in space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <LayoutGrid className="w-7 h-7 text-blue-600" /> Dashboard Overview
        </h1>
        <p className="text-slate-500 mt-1">System status and resource summary</p>
      </div>

      {/* Section 1: Inventory Status */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4" /> Device Inventory
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="Total Hardware" 
                value={hwData?.totalResults || 0} 
                icon={<Server className="w-6 h-6" />} 
                colorClass="bg-blue-600" 
                isLoading={hwLoading}
                link="/devices/hardwareinventory"
            />
            <StatCard 
                title="Hardware Models" 
                value={modelData?.totalResults || 0} 
                icon={<Box className="w-6 h-6" />} 
                colorClass="bg-indigo-500" 
                isLoading={modelLoading}
                link="/devices/hardwareinfo"
            />
            <StatCard 
                title="Network Interfaces" 
                value={portData?.totalResults || 0} 
                icon={<Network className="w-6 h-6" />} 
                colorClass="bg-cyan-500" 
                isLoading={portLoading}
                link="/devices/interfaceconnections"
            />
            {/* Placeholder for future metric */}
            {/* <StatCard 
                title="System Health" 
                value="98.5%" 
                icon={<Activity className="w-6 h-6" />} 
                colorClass="bg-emerald-500" 
                isLoading={false}
            /> */}
        </div>
      </div>

      {/* Section 2: Organization & Tenancy */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Infrastructure & Organization
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="Active Tenants" 
                value={tenantData?.totalResults || 0} 
                icon={<Users className="w-6 h-6" />} 
                colorClass="bg-orange-500" 
                isLoading={tenantLoading}
                link="/org/tenancy/tenant" 
            />
            <StatCard 
                title="Data Center Sites" 
                value={siteData?.totalResults || 0} 
                icon={<Building className="w-6 h-6" />} 
                colorClass="bg-slate-600" 
                isLoading={siteLoading}
                link="/org/locations/sites"
            />
            <StatCard 
                title="Zones" 
                value={zoneData?.totalResults || 0} 
                icon={<Layers className="w-6 h-6" />} 
                colorClass="bg-violet-500" 
                isLoading={zoneLoading}
                link="/org/locations/zones"
            />
            <StatCard 
                title="Total Racks" 
                value={rackData?.totalResults || 0} 
                icon={<HardDrive className="w-6 h-6" />} 
                colorClass="bg-slate-700" 
                isLoading={rackLoading}
                link="/org/locations/racks"
            />
        </div>
      </div>
    </div>
  );
}
