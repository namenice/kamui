// // src/pages/organization/locations/SiteManagement.tsx
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { siteApi, type Site } from '../../../api/organization/locations/site';
import { regionApi } from '../../../api/organization/locations/region';
import { zoneApi } from '../../../api/organization/locations/zone';
import { 
  Plus, Edit, Trash2, X, MapPin, Building2, Globe,
  Clock, AlertTriangle, ChevronLeft, ChevronRight, 
  Search, ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';
import SearchableSelect from '../../../components/common/SearchableSelect'; 

export default function SiteManagement() {
  const queryClient = useQueryClient();
  
  // --- States ---
  const [page, setPage] = useState(1);
  const limit = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string }>({ isOpen: false, id: null, name: '' });

  // Refs for auto-focus
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
    queryKey: ['sites', page, debouncedSearch, sortConfig], 
    queryFn: () => siteApi.getSites(page, limit, debouncedSearch, sortConfig.key, sortConfig.direction),
    placeholderData: keepPreviousData,
  });

  // 2. Load All Regions (For 1st Dropdown)
  const { data: regionsData } = useQuery({
    queryKey: ['regions', 'dropdown'],
    queryFn: () => regionApi.getRegions(1, 100, '', 'name', 'asc'),
    staleTime: 5 * 60 * 1000,
  });

  // --- Form Setup ---
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  
  // Watch ค่า Region เพื่อเอาไปโหลด Zone
  const selectedRegionId = watch('regionId');
  const selectedZoneId = watch('zoneId');

  // 3. Load Zones (Cascading: Load based on selectedRegionId)
  const { data: zonesData } = useQuery({
    queryKey: ['zones', 'dropdown', selectedRegionId], // key เปลี่ยนตาม region
    queryFn: () => zoneApi.getZones(1, 100, '', 'name', 'asc', selectedRegionId), // ส่ง regionId ไป filter
    enabled: !!selectedRegionId, // โหลดเมื่อเลือก Region แล้วเท่านั้น
  });

  // --- Handlers ---
  const handleSort = (key: string) => { setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' })); setPage(1); };
  const SortIcon = ({ columnKey }: { columnKey: string }) => { if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-400 opacity-50" />; return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />; };

  const openModal = (site?: Site) => {
    if (site) {
      setEditingSite(site);
      setValue('name', site.name);
      setValue('description', site.description || '');
      
      // 👇 Populate Cascading Dropdowns
      if (site.zone?.regionId) {
        setValue('regionId', site.zone.regionId); // Set Region ก่อน
        // (React Query จะ fetch zones อัตโนมัติเมื่อ regionId เปลี่ยน)
        setTimeout(() => setValue('zoneId', site.zoneId), 100); // Set Zone ตาม (delay นิดนึงรอ zones โหลด)
      }
    } else {
      setEditingSite(null);
      reset({ name: '', description: '', regionId: '', zoneId: '' });
    }
    setIsModalOpen(true);
  };

  const mutation = useMutation({
    mutationFn: (formData: any) => {
      // ตัด regionId ออกก่อนส่ง (Backend ไม่ต้องการ)
      const { regionId, ...payload } = formData;
      if (editingSite) return siteApi.updateSite(editingSite.id, payload);
      return siteApi.createSite(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sites'] }); setIsModalOpen(false); toast.success(editingSite ? 'Site updated' : 'Site created'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Operation failed')
  });

  const deleteMutation = useMutation({
    mutationFn: siteApi.deleteSite,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sites'] }); setDeleteModal({ isOpen: false, id: null, name: '' }); toast.success('Site deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Delete failed')
  });

  const sitesList = data?.results || [];

  if (isLoading) return <div className="flex justify-center h-64 items-center gap-2 text-slate-500"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>Loading...</div>;
  if (isError) return <div className="text-center text-red-500 mt-10">Error loading data</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" /> Site Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage data centers or buildings ({data?.totalResults || 0} sites)</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative group w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" /></div>
                <input type="text" placeholder="Search site..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm" />
            </div>
            <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap"><Plus className="w-4 h-4" /> Add Site</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('name')}>
                        <div className="flex items-center">Site Name <SortIcon columnKey="name" /></div>
                    </th>
                    
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Zone</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Region</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Rooms</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('createdAt')}>
                        <div className="flex items-center">Created At <SortIcon columnKey="createdAt" /></div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
                {sitesList.map((item: Site) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors duration-150 group/row">
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-3 border border-blue-100 shrink-0">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-slate-900">{item.name}</span>
                        </div>
                    </td>
                    
                    {/* 👇 ข้อมูล Zone */}
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                             <MapPin className="w-4 h-4 text-slate-400" />
                             <span className="text-sm font-medium text-slate-700">
                                 {item.zone?.name || <span className="text-red-400 text-xs">Unknown</span>}
                             </span>
                        </div>
                    </td>

                    {/* 👇 ข้อมูล Region */}
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                             <Globe className="w-4 h-4 text-slate-400" />
                             <span className="text-sm text-slate-600">
                                 {item.zone?.region?.name || <span className="text-slate-300">-</span>}
                             </span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-center"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${Number(item.roomCount) > 0 
                                ? 'bg-green-100 text-green-800' // มีคนอยู่ สีเขียว
                                : 'bg-slate-100 text-slate-500' // ว่างเปล่า สีเทา
                        }`}>{item.roomCount}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                        {item.description || <span className="text-slate-300 italic">No description</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" />{new Date(item.createdAt).toLocaleDateString()}</div>
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
                {/* 👇 แก้ colSpan เป็น 6 เพราะเราเพิ่มคอลัมน์มา 1 อัน */}
                {sitesList.length === 0 && (
                    <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-500">
                            <div className="flex flex-col items-center justify-center">
                                <Building2 className="w-10 h-10 text-gray-300 mb-3" />
                                <p>No sites found matching "{debouncedSearch}"</p>
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
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">{editingSite ? <Edit className="w-5 h-5"/> : <Plus className="w-5 h-5"/>} {editingSite ? 'Edit Site' : 'Create Site'}</h3>
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
                             setValue('zoneId', ''); // Reset Zone เมื่อเปลี่ยน Region
                           }}
                           placeholder="Select Region..."
                           error={!!errors.regionId}
                        />
                    </div>

                    {/* 👇 2. Zone Dropdown (Cascading) */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Zone <span className="text-red-500">*</span></label>
                        <input type="hidden" {...register('zoneId', { required: true })} />
                        <SearchableSelect 
                           options={zonesData?.results || []} // Options เปลี่ยนตาม Region ที่เลือก
                           value={selectedZoneId} 
                           onChange={(val) => setValue('zoneId', val, { shouldValidate: true })}
                           placeholder={selectedRegionId ? "Select Zone..." : "Please select region first"}
                           error={!!errors.zoneId}
                           disabled={!selectedRegionId} // Disable ถ้ายังไม่เลือก Region
                        />
                        {errors.zoneId && <span className="text-red-500 text-xs">Zone is required</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Site Name <span className="text-red-500">*</span></label>
                        <input {...register('name', {required:true})} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. DC-Bangkok-01" />
                        {errors.name && <span className="text-red-500 text-xs">Name is required</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                        <textarea {...register('description')} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" placeholder="Optional description..." />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md">{mutation.isPending ? 'Saving...' : 'Save Site'}</button>
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
              <div 
                className="bg-white rounded-2xl w-full max-w-md p-8 text-center shadow-2xl transform transition-all scale-100" 
                onClick={e => e.stopPropagation()}
              >
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-short ring-8 ring-red-50/50">
                      <AlertTriangle className="w-10 h-10 text-red-600"/>
                  </div>
                  
                  <h3 className="font-bold text-2xl text-slate-800 mb-3">Delete Site?</h3>
                  
                  <div className="text-slate-500 mb-8 text-base leading-relaxed">
                      Are you sure you want to delete site <br/>
                      <span className="font-bold text-slate-900 text-lg">"{deleteModal.name}"</span>?
                      <div className="mt-2 text-sm text-red-500 bg-red-50 py-1 px-2 rounded-lg inline-block">
                        This action cannot be undone.
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setDeleteModal({isOpen:false, id:null, name:''})} 
                        className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>

                      <button 
                        ref={deleteModalRef} 
                        onClick={() => deleteModal.id && deleteMutation.mutate(deleteModal.id)} 
                        className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Trash2 className="w-5 h-5"/> Delete Site
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}