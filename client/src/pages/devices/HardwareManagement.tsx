// src/pages/devices/HardwareManagement.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { hardwareApi, type Hardware } from '../../api/devices/hardware';

// API Imports
import { hardwareInfoApi } from '../../api/devices/hardwareInfo'; // Master Data
import { interfaceConnectionApi, type InterfaceConnection } from '../../api/devices/interfaceConnection';
import { tenantApi } from '../../api/organization/tenancy/tenant';
import { regionApi } from '../../api/organization/locations/region';
import { zoneApi } from '../../api/organization/locations/zone';
import { siteApi } from '../../api/organization/locations/site';
import { roomApi } from '../../api/organization/locations/room';
import { rackApi } from '../../api/organization/locations/rack';

// Component Imports
import HardwareConnectionTab from './tabs/HardwareConnectionTab';
import SearchableSelect from '../../components/common/SearchableSelect'; 

import { 
  Plus, Edit, Trash2, X, Server, MapPin, 
  AlertTriangle, ChevronLeft, ChevronRight, 
  Search, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, ChevronUp, 
  Tag, Globe, User, Cpu, Box, Network, Plug, ArrowRight, Activity, Barcode
} from 'lucide-react';

export default function HardwareManagement() {
  const queryClient = useQueryClient();
  
  // --- States ---
  const [page, setPage] = useState(1);
  const limit = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  // Modal & Tab States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHardware, setEditingHardware] = useState<Hardware | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string }>({ isOpen: false, id: null, name: '' });
  const [activeTab, setActiveTab] = useState<'general' | 'connections'>('general');
  
  // Filter State
  const [filterManufacturer, setFilterManufacturer] = useState<string>('');

  // Draft State
  const [draftInterfaces, setDraftInterfaces] = useState<InterfaceConnection[]>([]);

  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLButtonElement>(null);

  // --- Effects ---
  useEffect(() => { 
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500); 
    return () => clearTimeout(timer); 
  }, [searchTerm]);

  useEffect(() => { if (isModalOpen) setTimeout(() => modalRef.current?.focus(), 50); }, [isModalOpen]);
  useEffect(() => { if (deleteModal.isOpen) setTimeout(() => deleteModalRef.current?.focus(), 50); }, [deleteModal.isOpen]);

  // --- Queries ---
  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ['hardwares', page, debouncedSearch, sortConfig], 
    queryFn: () => hardwareApi.getHardwares(page, limit, debouncedSearch, sortConfig.key, sortConfig.direction),
    placeholderData: keepPreviousData,
  });

  const { data: hardwareInfosData } = useQuery({ queryKey: ['hardwareInfos', 'list'], queryFn: () => hardwareInfoApi.getHardwareInfos(1, 1000) });
  const { data: tenantsData } = useQuery({ queryKey: ['tenants', 'list'], queryFn: () => tenantApi.getTenants(1, 100) });
  const { data: regionsData } = useQuery({ queryKey: ['regions', 'list'], queryFn: () => regionApi.getRegions(1, 100) });

  // Form Setup
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  
  const selectedRegionId = watch('regionId');
  const selectedZoneId = watch('zoneId');
  const selectedSiteId = watch('siteId');
  const selectedRoomId = watch('roomId');
  const selectedRackId = watch('rackId');
  const selectedInfoId = watch('hardwareInfoId');

  const { data: zonesData } = useQuery({ queryKey: ['zones', selectedRegionId], queryFn: () => zoneApi.getZones(1, 100, '', 'name', 'asc', selectedRegionId), enabled: !!selectedRegionId });
  const { data: sitesData } = useQuery({ queryKey: ['sites', selectedZoneId], queryFn: () => siteApi.getSites(1, 100, '', 'name', 'asc', selectedZoneId), enabled: !!selectedZoneId });
  const { data: roomsData } = useQuery({ queryKey: ['rooms', selectedSiteId], queryFn: () => roomApi.getRooms(1, 100, '', 'name', 'asc', selectedSiteId), enabled: !!selectedSiteId });
  const { data: racksData } = useQuery({ queryKey: ['racks', selectedRoomId], queryFn: () => rackApi.getRacks(1, 100, '', 'name', 'asc', selectedRoomId), enabled: !!selectedRoomId });

  // Options Logic
  const manufacturerOptions = useMemo(() => {
      if (!hardwareInfosData?.results) return [];
      const brands = hardwareInfosData.results.map((info: any) => info.manufacturer);
      return [...new Set(brands)].map(brand => ({ id: brand, name: brand }));
  }, [hardwareInfosData]);

  const modelOptions = useMemo(() => {
      if (!hardwareInfosData?.results) return [];
      let filtered = hardwareInfosData.results;
      if (filterManufacturer) filtered = filtered.filter((info: any) => info.manufacturer === filterManufacturer);
      return filtered.map((info: any) => ({ id: info.id, name: `${info.model} (${info.hardwareType?.name} - ${info.height}U)` }));
  }, [hardwareInfosData, filterManufacturer]);

  const selectedModelInfo = hardwareInfosData?.results?.find((info: any) => info.id === selectedInfoId);

  // --- Handlers ---
  const handleSort = (key: string) => { setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' })); setPage(1); };
  const toggleRow = (id: string) => setExpandedRowId(current => current === id ? null : id);
  const SortIcon = ({ columnKey }: { columnKey: string }) => { if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-400 opacity-50" />; return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />; };

  const openModal = (hw?: Hardware) => {
    setActiveTab('general');
    
    if (hw) {
      setEditingHardware(hw);
      setValue('name', hw.name);
      setValue('serialNumber', hw.serialNumber || '');
      setValue('status', hw.status);
      setValue('oobIp', hw.oobIp || '');
      setValue('note', hw.note || '');
      setValue('specifications', hw.specifications || '');
      setValue('hardwareInfoId', hw.hardwareInfoId); 
      const currentModelInfo = hardwareInfosData?.results?.find((info: any) => info.id === hw.hardwareInfoId);
      if (currentModelInfo) setFilterManufacturer(currentModelInfo.manufacturer);
      setValue('tenantId', hw.tenantId || '');
      setValue('warrantyStartDate', hw.warrantyStartDate || null);
      setValue('warrantyEndDate', hw.warrantyEndDate || null);
      setValue('uPosition', hw.uPosition);
      
      if (hw.rack?.room?.site?.zone?.region) {
         setValue('regionId', hw.rack.room.site.zone.region.id);
         setTimeout(() => {
             setValue('zoneId', hw.rack!.room!.site!.zone!.id);
             setTimeout(() => {
                 setValue('siteId', hw.rack!.room!.site!.id);
                 setTimeout(() => {
                     setValue('roomId', hw.rack!.room!.id);
                     setTimeout(() => setValue('rackId', hw.rack!.id), 200);
                 }, 150);
             }, 100);
         }, 50);
      }
      setDraftInterfaces([]);
    } else {
      setEditingHardware(null);
      setFilterManufacturer('');
      setDraftInterfaces([]);
      reset({ name: '', serialNumber: '', status: 'active', hardwareInfoId: '', tenantId: '', regionId: '', zoneId: '', siteId: '', roomId: '', rackId: '', uPosition: 1, oobIp: '', note: '', specifications: '' });
    }
    setIsModalOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      const { regionId, zoneId, siteId, roomId, ...payload } = formData;
      payload.uPosition = Number(payload.uPosition);
      if (payload.tenantId === '') payload.tenantId = null;
      if (payload.warrantyStartDate === '') payload.warrantyStartDate = null;
      if (payload.warrantyEndDate === '') payload.warrantyEndDate = null;

      let result;
      if (editingHardware) {
        result = await hardwareApi.updateHardware(editingHardware.id, payload);
      } else {
        result = await hardwareApi.createHardware(payload);
        if (draftInterfaces.length > 0) {
            await Promise.all(draftInterfaces.map(async (iface) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, ...ifaceData } = iface;
                return interfaceConnectionApi.createInterfaceConnection({ ...ifaceData, hardwareId: result.id });
            }));
        }
      }
      return result;
    },
    onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: ['hardwares'] }); 
        setIsModalOpen(false); 
        toast.success(editingHardware ? 'Updated' : 'Created successfully'); 
    },
    onError: (err: any) => toast.error(err.message || err.response?.data?.message || 'Failed')
  });

  const deleteMutation = useMutation({
    mutationFn: hardwareApi.deleteHardware,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hardwares'] }); setDeleteModal({ isOpen: false, id: null, name: '' }); toast.success('Deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Delete failed')
  });

  const hwList = data?.results || [];

  const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return 'bg-green-100 text-green-800 border-green-200';
        case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'failed': return 'bg-red-100 text-red-800 border-red-200';
        case 'offline': return 'bg-gray-100 text-gray-800 border-gray-200';
        default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  if (isLoading) return <div className="flex justify-center h-64 items-center gap-2 text-slate-500"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>Loading...</div>;
  if (isError) return <div className="text-center text-red-500 mt-10">Error loading data</div>;

  return (
    <div className="p-6 max-w-[95rem] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Server className="w-6 h-6 text-blue-600" /> Hardware Inventory
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage physical devices and assets ({data?.totalResults || 0} items)</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <div className="relative group w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" /></div>
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-shadow shadow-sm" />
            </div>
            <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap"><Plus className="w-4 h-4" /> Add Hardware</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                    <th className="w-10 px-4 py-4"></th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('name')}><div className="flex items-center">Name <SortIcon columnKey="name" /></div></th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Model / Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
                {hwList.map((item: any) => (
                <React.Fragment key={item.id}>
                    <tr className={`hover:bg-slate-50 transition-colors duration-150 group/row cursor-pointer ${expandedRowId === item.id ? 'bg-blue-50/50' : ''}`} onClick={() => toggleRow(item.id)}>
                        <td className="px-4 py-4 text-center">
                            <button onClick={(e) => { e.stopPropagation(); toggleRow(item.id); }} className="text-slate-400 hover:text-blue-600 transition-colors">
                                {expandedRowId === item.id ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                            </button>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                            {item.name}
                        </td>
                        
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900">{item.hardwareInfo?.manufacturer} {item.hardwareInfo?.model}</span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Server className="w-3 h-3"/> {item.hardwareInfo?.hardwareType?.name} ({item.hardwareInfo?.height}U)
                                </span>
                            </div>
                        </td>

                        {/* 👇 1. แสดง Serial Number แทน Interfaces */}
                        <td className="px-6 py-4">
                            {item.serialNumber ? (<div className="flex items-center gap-1.5 text-slate-700 text-sm">{item.serialNumber}</div>) : <span className="text-slate-400 text-xm italic">none</span>}
                        </td>

                        <td className="px-6 py-4">
                             {item.tenant ? <div className="flex items-center gap-1.5 text-slate-700 text-sm"><User className="w-3.5 h-3.5 text-slate-400" /> {item.tenant.name}</div> : <span className="text-slate-400 text-xs italic">Internal</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                             <div className="flex items-center gap-1"><span className="font-bold text-slate-800">{item.rack?.name}</span><span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs border border-slate-200">U{item.uPosition}</span></div>
                        </td>
                        <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase ${getStatusColor(item.status)}`}>{item.status}</span></td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                <button onClick={() => openModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => setDeleteModal({ isOpen: true, id: item.id, name: item.name })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </td>
                    </tr>
                    
                    {/* 👇 Expanded Detail (เพิ่ม Note & Serial Number ใน Dropdown) */}
                    {expandedRowId === item.id && (
                        <tr className="bg-slate-50/50 animate-fade-in">
                            <td colSpan={9} className="px-8 py-8 border-b border-gray-100 shadow-inner">
                                <div className="flex flex-col gap-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        {/* Left: Location */}
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2"><MapPin className="w-4 h-4 text-blue-600"/> Location Details</h4>
                                            <div className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
                                                <span className="text-slate-500 font-medium">Region:</span><span className="text-slate-900">{item.rack?.room?.site?.zone?.region?.name || '-'}</span>
                                                <span className="text-slate-500 font-medium">Zone:</span><span className="text-slate-900">{item.rack?.room?.site?.zone?.name || '-'}</span>
                                                <span className="text-slate-500 font-medium">Site:</span><span className="text-slate-900">{item.rack?.room?.site?.name || '-'}</span>
                                                <span className="text-slate-500 font-medium">Room:</span><span className="text-slate-900">{item.rack?.room?.name || '-'}</span>
                                                <span className="text-slate-500 font-medium">Target Rack:</span><span className="text-slate-900 font-bold">{item.rack?.name || '-'}</span>
                                                <span className="text-slate-500 font-medium">Position:</span><span className="flex items-center gap-2"><span className="font-bold text-blue-600">U{item.uPosition}</span><span className="text-slate-400 text-xs">({item.hardwareInfo?.height}U Height)</span></span>
                                            </div>
                                        </div>
                                        {/* Right: General Info */}
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2"><Tag className="w-4 h-4 text-blue-600"/> General Information</h4>
                                            <div className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
                                                <span className="text-slate-500 font-medium">Hardware Type:</span><span className="text-slate-900">{item.hardwareInfo?.hardwareType?.name || '-'}</span>
                                                <span className="text-slate-500 font-medium">Manufacturer:</span><span className="text-slate-900">{item.hardwareInfo?.manufacturer || '-'}</span>
                                                <span className="text-slate-500 font-medium">Model:</span><span className="text-slate-900">{item.hardwareInfo?.model || '-'}</span>
                                                
                                                {/* 2. เพิ่ม Serial Number ใน Detail */}
                                                <span className="text-slate-500 font-medium">Serial Number:</span><span className="text-slate-900 font-mono">{item.serialNumber || '-'}</span>
                                                
                                                <span className="text-slate-500 font-medium">OOB IP:</span><span className="font-mono text-slate-900">{item.oobIp ? <a href={`https://${item.oobIp}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{item.oobIp}</a> : '-'}</span>
                                                <span className="text-slate-500 font-medium">Warranty:</span>
                                                <span className={`font-medium ${item.warrantyEndDate && new Date(item.warrantyEndDate) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                                                    {item.warrantyEndDate ? (
                                                        <>
                                                            {new Date(item.warrantyStartDate!).toLocaleDateString()} - {new Date(item.warrantyEndDate).toLocaleDateString()}
                                                            {new Date(item.warrantyEndDate) < new Date() && <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full ml-1">Expired</span>}
                                                        </>
                                                    ) : '-'}
                                                </span>
                                                <span className="text-slate-500 font-medium">Tenant:</span>
                                                <span className="flex items-center gap-1.5 text-slate-900"><User className="w-3.5 h-3.5 text-slate-400"/>{item.tenant?.name || 'Internal Resource'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ---------------- BOTTOM SECTION (Specs, Notes, Interfaces) ---------------- */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 border-t border-slate-100">
                                        
                                        {/* 1. Specs */}
                                        <div className="flex flex-col h-full">
                                            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3"><Cpu className="w-5 h-5 text-blue-600"/> Extra Specifications</h4>
                                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex-1">
                                                <p className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-7">
                                                    {/* @ts-ignore */}
                                                    {item.specifications || <span className="text-slate-500 italic">No extra specifications</span>}
                                                </p>
                                            </div>
                                        </div>

                                        {/* 2. Note / Remarks */}
                                        <div className="flex flex-col h-full">
                                            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3"><Globe className="w-5 h-5 text-blue-600"/> Note / Remarks</h4>
                                            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5 shadow-sm flex-1 relative">
                                                <div className="absolute top-4 left-0 w-1 h-8 bg-yellow-400 rounded-r-full"></div>
                                                <p className="text-sm text-slate-700 italic whitespace-pre-wrap leading-7 pl-2">
                                                    {item.note || <span className="text-slate-400 not-italic">No additional notes</span>}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* 3. Full Interfaces */}
                                        <div className="flex flex-col h-full">
                                            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3"><Network className="w-5 h-5 text-blue-600"/> Connections</h4>
                                            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex-1 overflow-y-auto max-h-[200px]">
                                                {item.interfaces && item.interfaces.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {item.interfaces.map((iface: any) => (
                                                            <div key={iface.id} className="flex flex-col p-2 bg-slate-50 rounded border border-slate-100 text-sm gap-1">
                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex items-center gap-2">
                                                                        <Plug className="w-3.5 h-3.5 text-blue-500"/>
                                                                        <div className="font-bold text-blue-700">{iface.name}</div>
                                                                    </div>
                                                                    <div className="font-mono text-xs text-slate-500 bg-white px-1.5 rounded border">{iface.ipAddress}</div>
                                                                </div>
                                                                {iface.connectedSwitch ? (
                                                                    <div className="flex items-center gap-1 text-xs pl-5">
                                                                        <ArrowRight className="w-3 h-3 text-slate-300"/>
                                                                        <span className="text-slate-500">Uplink:</span>
                                                                        <span className="font-bold text-slate-800">{iface.connectedSwitch.name}</span>
                                                                        <span className="text-slate-400">/</span>
                                                                        <span className="text-blue-600 font-mono">{iface.connectedPort}</span>
                                                                    </div>
                                                                ) : <span className="text-xs text-slate-400 italic pl-5">No Uplink</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-slate-400 italic text-sm p-2">No interfaces configured.</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </React.Fragment>
                ))}
            </tbody>
            </table>
        </div>
        
        {/* Pagination & Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">Page <span className="font-semibold text-gray-900">{data?.page || 1}</span> of <span className="font-semibold text-gray-900">{data?.totalPages || 1}</span></div>
            <div className="flex gap-2">
                 <button onClick={() => setPage(old => Math.max(old - 1, 1))} disabled={page === 1 || isPlaceholderData} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center transition-colors"><ChevronLeft className="w-4 h-4 mr-1" /> Previous</button>
                 <button onClick={() => { if (!isPlaceholderData && data && page < data.totalPages) setPage(old => old + 1) }} disabled={isPlaceholderData || (data && page === data.totalPages)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center transition-colors">Next <ChevronRight className="w-4 h-4 ml-1" /></button>
            </div>
        </div>
      </div>

      {/* MODAL: CREATE / EDIT */}
       {isModalOpen && (
         <div 
            ref={modalRef} 
            tabIndex={-1} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 outline-none overflow-y-auto" 
            onClick={() => setIsModalOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setIsModalOpen(false); }}
         >
             <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl transform transition-all scale-100 my-8" onClick={e => e.stopPropagation()}>
                 <div className="bg-slate-900 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">{editingHardware ? <Edit className="w-5 h-5"/> : <Plus className="w-5 h-5"/>} {editingHardware ? `Edit: ${editingHardware.name}` : 'Add Hardware'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                 </div>

                 {/* TAB BAR (Always visible) */}
                 <div className="flex border-b border-gray-200 px-6 pt-4 gap-6 bg-white sticky top-[60px] z-10">
                    <button onClick={() => setActiveTab('general')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        <Server className="w-4 h-4" /> General Information
                    </button>
                    <button onClick={() => setActiveTab('connections')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'connections' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        <Network className="w-4 h-4" /> Connections & Ports
                        {/* Show count badge for draft */}
                        {!editingHardware && draftInterfaces.length > 0 && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 rounded-full">{draftInterfaces.length}</span>}
                    </button>
                 </div>
                 
                 <div className="p-6">
                    {/* TAB 1: GENERAL FORM */}
                    <div className={activeTab === 'general' ? 'block' : 'hidden'}>
                        <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* LEFT COLUMN */}
                                <div className="space-y-5">
                                    <h4 className="font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2"><Server className="w-4 h-4"/> Device Information</h4>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Hostname <span className="text-red-500">*</span></label>
                                            <input {...register('name', {required:true})} className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="SVR-01" />
                                            {errors.name && <span className="text-red-500 text-xs">Required</span>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Serial Number</label>
                                            <input {...register('serialNumber')} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                                        </div>
                                    </div>

                                    {/* Manufacturer Filter */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Manufacturer Filter</label>
                                        <SearchableSelect options={manufacturerOptions} value={filterManufacturer} onChange={(val) => { setFilterManufacturer(val); setValue('hardwareInfoId', ''); }} placeholder="Filter by Brand..." isClearable={true} />
                                    </div>

                                    {/* Model Selection */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Hardware Model <span className="text-red-500">*</span></label>
                                        <input type="hidden" {...register('hardwareInfoId', { required: true })} />
                                        <SearchableSelect 
                                            options={modelOptions} 
                                            value={watch('hardwareInfoId')} 
                                            onChange={(val) => setValue('hardwareInfoId', val, {shouldValidate:true})} 
                                            placeholder={filterManufacturer ? `Select ${filterManufacturer} Model...` : "Select Model..."}
                                            error={!!errors.hardwareInfoId} 
                                            disabled={!filterManufacturer && modelOptions.length > 100} 
                                        />
                                        {errors.hardwareInfoId && <span className="text-red-500 text-xs">Required</span>}
                                        
                                        {selectedModelInfo && (
                                            <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm grid grid-cols-3 gap-2">
                                                <div><span className="text-xs text-slate-400 block font-bold uppercase">Brand</span>{selectedModelInfo.manufacturer}</div>
                                                <div><span className="text-xs text-slate-400 block font-bold uppercase">Type</span>{selectedModelInfo.hardwareType?.name}</div>
                                                <div><span className="text-xs text-slate-400 block font-bold uppercase">Size</span>{selectedModelInfo.height}U</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">OOB IP</label>
                                            <input {...register('oobIp')} className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="192.168.x.x" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                                            <select {...register('status')} className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white">
                                                <option value="active">Active</option>
                                                <option value="maintenance">Maintenance</option>
                                                <option value="failed">Failed</option>
                                                <option value="offline">Offline</option>
                                                <option value="reserved">Reserved</option>
                                                <option value="deprecated">Deprecated</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Extra Specifications</label>
                                        <textarea {...register('specifications')} className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 text-sm font-mono" placeholder="e.g. Added 2x 10G NIC..." />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Warranty Start</label>
                                            <input type="date" {...register('warrantyStartDate')} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Warranty End</label>
                                            <input type="date" {...register('warrantyEndDate')} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN */}
                                <div className="space-y-5">
                                    <h4 className="font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4"/> Location & Tenant</h4>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Tenant</label>
                                        <input type="hidden" {...register('tenantId')} />
                                        <SearchableSelect options={tenantsData?.results || []} value={watch('tenantId')} onChange={(val) => setValue('tenantId', val)} placeholder="Internal (No Tenant)" isClearable={true} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Region</label>
                                            <input type="hidden" {...register('regionId')} />
                                            <SearchableSelect options={regionsData?.results || []} value={selectedRegionId} onChange={(val) => { setValue('regionId', val); setValue('zoneId', ''); setValue('siteId', ''); setValue('roomId', ''); setValue('rackId', ''); }} placeholder="Region..." />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Zone</label>
                                            <input type="hidden" {...register('zoneId')} />
                                            <SearchableSelect options={zonesData?.results || []} value={selectedZoneId} disabled={!selectedRegionId} onChange={(val) => { setValue('zoneId', val); setValue('siteId', ''); setValue('roomId', ''); setValue('rackId', ''); }} placeholder="Zone..." />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Site</label>
                                            <input type="hidden" {...register('siteId')} />
                                            <SearchableSelect options={sitesData?.results || []} value={selectedSiteId} disabled={!selectedZoneId} onChange={(val) => { setValue('siteId', val); setValue('roomId', ''); setValue('rackId', ''); }} placeholder="Site..." />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Room</label>
                                            <input type="hidden" {...register('roomId')} />
                                            <SearchableSelect options={roomsData?.results || []} value={selectedRoomId} disabled={!selectedSiteId} onChange={(val) => { setValue('roomId', val); setValue('rackId', ''); }} placeholder="Room..." />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Target Rack <span className="text-red-500">*</span></label>
                                        <input type="hidden" {...register('rackId', { required: true })} />
                                        <SearchableSelect options={racksData?.results || []} value={selectedRackId} onChange={(val) => setValue('rackId', val, { shouldValidate: true })} placeholder="Select Rack..." disabled={!selectedRoomId} error={!!errors.rackId} />
                                        {errors.rackId && <span className="text-red-500 text-xs">Required</span>}
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Start U Position <span className="text-red-500">*</span></label>
                                        <div className="flex items-center gap-3">
                                            <input type="number" {...register('uPosition', {required:true, min: 1})} className="w-24 border border-slate-300 rounded-lg px-3 py-2" placeholder="U1" />
                                            {selectedModelInfo && (
                                                <div className="text-sm text-slate-500 flex items-center gap-2">
                                                    <span>+ Height: <b>{selectedModelInfo.height}U</b></span>
                                                    <span>= Ends at U{Number(watch('uPosition') || 1) + Number(selectedModelInfo.height) - 1}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Note / Description</label>
                                        <textarea {...register('note')} className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 resize-none" placeholder="Notes..." />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                                <button type="submit" disabled={mutation.isPending} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md">
                                    {mutation.isPending ? 'Saving...' : editingHardware ? 'Update Hardware' : 'Create Hardware'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* TAB 2: CONNECTIONS */}
                    {activeTab === 'connections' && (
                        <HardwareConnectionTab 
                            hardwareId={editingHardware?.id} 
                            draftInterfaces={draftInterfaces}
                            onDraftChange={setDraftInterfaces}
                        />
                    )}
                 </div>
             </div>
         </div>
      )}

      {/* DELETE MODAL */}
      {deleteModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteModal({isOpen:false, id:null, name:''})}>
              <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-short ring-8 ring-red-50/50"><AlertTriangle className="w-10 h-10 text-red-600"/></div>
                  <h3 className="font-bold text-2xl text-slate-800 mb-3">Delete Hardware?</h3>
                  <div className="text-slate-500 mb-8">Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteModal.name}"</span>?</div>
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setDeleteModal({isOpen:false, id:null, name:''})} className="w-full py-3 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                      <button onClick={() => deleteModal.id && deleteMutation.mutate(deleteModal.id)} className="w-full py-3 bg-red-600 rounded-xl font-bold text-white">Delete</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}