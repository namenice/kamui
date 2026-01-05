// src/pages/organization/locations/RackManagement.tsx
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { rackApi, type Rack } from '../../../api/organization/locations/rack';
import { roomApi } from '../../../api/organization/locations/room';
import { siteApi } from '../../../api/organization/locations/site';
import { zoneApi } from '../../../api/organization/locations/zone';
import { regionApi } from '../../../api/organization/locations/region';
import { 
  Plus, Edit, Trash2, X, MapPin, Building2, Globe, Box, Server, // 👈 ใช้ Icon Server สำหรับ Rack
  Clock, AlertTriangle, ChevronLeft, ChevronRight, 
  Search, ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';
import SearchableSelect from '../../../components/common/SearchableSelect'; 

export default function RackManagement() {
  const queryClient = useQueryClient();
  
  // --- States ---
  const [page, setPage] = useState(1);
  const limit = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRack, setEditingRack] = useState<Rack | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string }>({ isOpen: false, id: null, name: '' });

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
  // 1. Main Table Data
  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ['racks', page, debouncedSearch, sortConfig], 
    queryFn: () => rackApi.getRacks(page, limit, debouncedSearch, sortConfig.key, sortConfig.direction),
    placeholderData: keepPreviousData,
  });

  // 2. Load Regions (Level 1)
  const { data: regionsData } = useQuery({
    queryKey: ['regions', 'dropdown'],
    queryFn: () => regionApi.getRegions(1, 100, '', 'name', 'asc'),
    staleTime: 5 * 60 * 1000,
  });

  // --- Form Setup ---
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  
  const selectedRegionId = watch('regionId');
  const selectedZoneId = watch('zoneId');
  const selectedSiteId = watch('siteId');
  const selectedRoomId = watch('roomId');

  // 3. Load Zones (Level 2)
  const { data: zonesData } = useQuery({
    queryKey: ['zones', 'dropdown', selectedRegionId], 
    queryFn: () => zoneApi.getZones(1, 100, '', 'name', 'asc', selectedRegionId),
    enabled: !!selectedRegionId,
  });

  // 4. Load Sites (Level 3)
  const { data: sitesData } = useQuery({
    queryKey: ['sites', 'dropdown', selectedZoneId], 
    queryFn: () => siteApi.getSites(1, 100, '', 'name', 'asc', selectedZoneId),
    enabled: !!selectedZoneId,
  });

  // 5. Load Rooms (Level 4)
  const { data: roomsData } = useQuery({
    queryKey: ['rooms', 'dropdown', selectedSiteId], 
    queryFn: () => roomApi.getRooms(1, 100, '', 'name', 'asc', selectedSiteId),
    enabled: !!selectedSiteId,
  });

  // --- Handlers ---
  const handleSort = (key: string) => { setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' })); setPage(1); };
  const SortIcon = ({ columnKey }: { columnKey: string }) => { if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-400 opacity-50" />; return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />; };

  const openModal = (rack?: Rack) => {
    if (rack) {
      setEditingRack(rack);
      setValue('name', rack.name);
      setValue('unit', rack.unit);
      setValue('description', rack.description || '');
      
      // 👇 Pre-fill Cascading Dropdowns (4 Levels!)
      // Path: Rack -> Room -> Site -> Zone -> Region
      const room = rack.room;
      const site = room?.site;
      const zone = site?.zone;
      const region = zone?.region;

      if (region) {
        setValue('regionId', region.id);
        
        if (zone) {
            setTimeout(() => setValue('zoneId', zone.id), 50);
            if (site) {
                setTimeout(() => setValue('siteId', site.id), 100);
                if (room) {
                    setTimeout(() => setValue('roomId', room.id), 150);
                }
            }
        }
      }
    } else {
      setEditingRack(null);
      reset({ name: '', unit: 42, description: '', regionId: '', zoneId: '', siteId: '', roomId: '' });
    }
    setIsModalOpen(true);
  };

  const mutation = useMutation({
    mutationFn: (formData: any) => {
      // ตัด field นอกเหนือจาก roomId ออก (Backend ใช้แค่ roomId ในการสร้าง Rack)
      const { regionId, zoneId, siteId, ...payload } = formData;
      if (editingRack) return rackApi.updateRack(editingRack.id, payload);
      return rackApi.createRack(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['racks'] }); setIsModalOpen(false); toast.success(editingRack ? 'Rack updated' : 'Rack created'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Operation failed')
  });

  const deleteMutation = useMutation({
    mutationFn: rackApi.deleteRack,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['racks'] }); setDeleteModal({ isOpen: false, id: null, name: '' }); toast.success('Rack deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Delete failed')
  });

  const racksList = data?.results || [];

  if (isLoading) return <div className="flex justify-center h-64 items-center gap-2 text-slate-500"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>Loading...</div>;
  if (isError) return <div className="text-center text-red-500 mt-10">Error loading data</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Server className="w-6 h-6 text-blue-600" /> Rack Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage server racks and capacity ({data?.totalResults || 0} racks)</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative group w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" /></div>
                <input type="text" placeholder="Search rack..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm" />
            </div>
            <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap"><Plus className="w-4 h-4" /> Add Rack</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('name')}>
                        <div className="flex items-center">Rack Name <SortIcon columnKey="name" /></div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit (U)</th>
                    
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Room</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Site</th>
                    
                    {/* 👇 แยก Zone */}
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Zone</th>

                    {/* 👇 แยก Region */}
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Region</th>

                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
                {racksList.map((item: Rack) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors duration-150 group/row">
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-3 border border-blue-100 shrink-0">
                                <Server className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-slate-900">{item.name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.unit} U
                        </span>
                    </td>
                    
                    {/* Room */}
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                             <Box className="w-4 h-4 text-slate-400" />
                             <span className="text-sm font-medium text-slate-700">{item.room?.name || 'Unknown'}</span>
                        </div>
                    </td>

                    {/* Site */}
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                             <Building2 className="w-4 h-4 text-slate-400" />
                             <span className="text-sm text-slate-600">{item.room?.site?.name || '-'}</span>
                        </div>
                    </td>
                    
                    {/* Zone */}
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                             <MapPin className="w-4 h-4 text-slate-400" />
                             <span className="text-sm text-slate-600">{item.room?.site?.zone?.name || '-'}</span>
                        </div>
                    </td>

                    {/* Region */}
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">{item.room?.site?.zone?.region?.name || '-'}</span>
                        </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                        {item.description || <span className="text-slate-300 italic">No description</span>}
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => openModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteModal({ isOpen: true, id: item.id, name: item.name })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
                {racksList.length === 0 && (
                    <tr>
                        <td colSpan={8} className="text-center py-12 text-gray-500">
                            <div className="flex flex-col items-center justify-center">
                                <Server className="w-10 h-10 text-gray-300 mb-3" />
                                <p>No racks found matching "{debouncedSearch}"</p>
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 outline-none" 
            onClick={() => setIsModalOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setIsModalOpen(false); }}
         >
             <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                 <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">{editingRack ? <Edit className="w-5 h-5"/> : <Plus className="w-5 h-5"/>} {editingRack ? 'Edit Rack' : 'Create Rack'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                 </div>
                 
                 <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-5">
                    
                    {/* 👇 1. Region Dropdown */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Region <span className="text-red-500">*</span></label>
                        <input type="hidden" {...register('regionId', { required: true })} />
                        <SearchableSelect 
                           options={regionsData?.results || []}
                           value={selectedRegionId} 
                           onChange={(val) => {
                             setValue('regionId', val, { shouldValidate: true });
                             setValue('zoneId', ''); 
                             setValue('siteId', ''); 
                             setValue('roomId', ''); 
                           }}
                           placeholder="Select Region..."
                           error={!!errors.regionId}
                        />
                    </div>

                    {/* 👇 2. Zone Dropdown */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Zone <span className="text-red-500">*</span></label>
                        <input type="hidden" {...register('zoneId', { required: true })} />
                        <SearchableSelect 
                           options={zonesData?.results || []}
                           value={selectedZoneId} 
                           onChange={(val) => {
                               setValue('zoneId', val, { shouldValidate: true });
                               setValue('siteId', '');
                               setValue('roomId', '');
                           }}
                           placeholder={selectedRegionId ? "Select Zone..." : "Please select region first"}
                           error={!!errors.zoneId}
                           disabled={!selectedRegionId}
                        />
                    </div>

                     {/* 👇 3. Site Dropdown */}
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Site <span className="text-red-500">*</span></label>
                        <input type="hidden" {...register('siteId', { required: true })} />
                        <SearchableSelect 
                           options={sitesData?.results || []}
                           value={selectedSiteId} 
                           onChange={(val) => {
                               setValue('siteId', val, { shouldValidate: true });
                               setValue('roomId', '');
                           }}
                           placeholder={selectedZoneId ? "Select Site..." : "Please select zone first"}
                           error={!!errors.siteId}
                           disabled={!selectedZoneId}
                        />
                    </div>

                    {/* 👇 4. Room Dropdown */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Room <span className="text-red-500">*</span></label>
                        <input type="hidden" {...register('roomId', { required: true })} />
                        <SearchableSelect 
                           options={roomsData?.results || []}
                           value={selectedRoomId} 
                           onChange={(val) => setValue('roomId', val, { shouldValidate: true })}
                           placeholder={selectedSiteId ? "Select Room..." : "Please select site first"}
                           error={!!errors.roomId}
                           disabled={!selectedSiteId}
                        />
                        {errors.roomId && <span className="text-red-500 text-xs">Room is required</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Rack Name <span className="text-red-500">*</span></label>
                            <input {...register('name', {required:true})} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. R-01" />
                            {errors.name && <span className="text-red-500 text-xs">Name is required</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Unit Height (U) <span className="text-red-500">*</span></label>
                            <input type="number" {...register('unit', {required:true, min: 1})} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="42" />
                            {errors.unit && <span className="text-red-500 text-xs">Unit is required</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                        <textarea {...register('description')} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" placeholder="Optional description..." />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md">{mutation.isPending ? 'Saving...' : 'Save Rack'}</button>
                    </div>
                 </form>
             </div>
         </div>
      )}

      {/* MODAL: DELETE */}
      {deleteModal.isOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity" 
            onClick={() => setDeleteModal({isOpen:false, id:null, name:''})}
            onKeyDown={(e) => { if (e.key === 'Escape') setDeleteModal({isOpen:false, id:null, name:''}); }}
          >
              <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center shadow-2xl transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-short ring-8 ring-red-50/50"><AlertTriangle className="w-10 h-10 text-red-600"/></div>
                  <h3 className="font-bold text-2xl text-slate-800 mb-3">Delete Rack?</h3>
                  <div className="text-slate-500 mb-8 text-base leading-relaxed">Are you sure you want to delete rack <br/><span className="font-bold text-slate-900 text-lg">"{deleteModal.name}"</span>?<div className="mt-2 text-sm text-red-500 bg-red-50 py-1 px-2 rounded-lg inline-block">This action cannot be undone.</div></div>
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setDeleteModal({isOpen:false, id:null, name:''})} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
                      <button ref={deleteModalRef} onClick={() => deleteModal.id && deleteMutation.mutate(deleteModal.id)} className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"><Trash2 className="w-5 h-5"/> Delete Rack</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}