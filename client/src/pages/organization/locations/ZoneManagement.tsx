// src/pages/organization/locations/ZoneManagement.tsx

import { useState, useEffect, useRef } from 'react'; // 👈 1. เพิ่ม useRef
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { zoneApi, type Zone } from '../../../api/organization/locations/zone';
import { regionApi } from '../../../api/organization/locations/region';
import { 
  Plus, Edit, Trash2, X, MapPin, Globe,
  Clock, AlertTriangle, ChevronLeft, ChevronRight, 
  Search, ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';

import SearchableSelect from '../../../components/common/SearchableSelect'; 

export default function ZoneManagement() {
  const queryClient = useQueryClient();
  
  // --- States ---
  const [page, setPage] = useState(1);
  const limit = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string }>({ isOpen: false, id: null, name: '' });

  // 👇 2. สร้าง Ref สำหรับ Modal และ Delete Modal
  const modalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLButtonElement>(null); // ใช้ button cancel รับ focus สำหรับ delete

  // --- Effects ---
  useEffect(() => { 
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500); 
    return () => clearTimeout(timer); 
  }, [searchTerm]);

  // 👇 3. Effect สำหรับ Auto Focus เมื่อ Modal เปิด
  useEffect(() => {
    if (isModalOpen) {
      // รอให้ render เสร็จนิดนึงแล้วค่อย focus
      setTimeout(() => modalRef.current?.focus(), 50);
    }
  }, [isModalOpen]);

  // 👇 4. Effect สำหรับ Auto Focus เมื่อ Delete Modal เปิด
  useEffect(() => {
    if (deleteModal.isOpen) {
      setTimeout(() => deleteModalRef.current?.focus(), 50);
    }
  }, [deleteModal.isOpen]);

  // --- Queries ---
  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ['zones', page, debouncedSearch, sortConfig], 
    queryFn: () => zoneApi.getZones(page, limit, debouncedSearch, sortConfig.key, sortConfig.direction),
    placeholderData: keepPreviousData,
  });

  const { data: regionsData } = useQuery({
    queryKey: ['regions', 'dropdown'],
    queryFn: () => regionApi.getRegions(1, 100, '', 'name', 'asc'),
    staleTime: 5 * 60 * 1000,
  });

  // --- Handlers ---
  const handleSort = (key: string) => { setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' })); setPage(1); };
  const SortIcon = ({ columnKey }: { columnKey: string }) => { if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-400 opacity-50" />; return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />; };

  // --- Forms ---
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const currentRegionId = watch('regionId');

  const openModal = (zone?: Zone) => {
    if (zone) {
      setEditingZone(zone);
      setValue('name', zone.name);
      setValue('regionId', zone.regionId); 
      setValue('description', zone.description || '');
    } else {
      setEditingZone(null);
      reset({ name: '', regionId: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const mutation = useMutation({
    mutationFn: (formData: any) => {
      if (editingZone) return zoneApi.updateZone(editingZone.id, formData);
      return zoneApi.createZone(formData);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['zones'] }); setIsModalOpen(false); toast.success(editingZone ? 'Zone updated' : 'Zone created'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Operation failed')
  });

  const deleteMutation = useMutation({
    mutationFn: zoneApi.deleteZone,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['zones'] }); setDeleteModal({ isOpen: false, id: null, name: '' }); toast.success('Zone deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Delete failed')
  });

  const zonesList = data?.results || [];

  if (isLoading) return <div className="flex justify-center h-64 items-center gap-2 text-slate-500"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>Loading...</div>;
  if (isError) return <div className="text-center text-red-500 mt-10">Error loading data</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" /> Zone Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage provinces or zones ({data?.totalResults || 0} zones)</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative group w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" /></div>
                <input type="text" placeholder="Search zone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm" />
            </div>
            <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap"><Plus className="w-4 h-4" /> Add Zone</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('name')}><div className="flex items-center">Zone Name <SortIcon columnKey="name" /></div></th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase center-center">Region</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Sites</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('createdAt')}><div className="flex items-center">Created At <SortIcon columnKey="createdAt" /></div></th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
                {zonesList.map((item: Zone) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors duration-150 group/row">
                    <td className="px-6 py-4"><div className="flex items-center"><div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mr-3 border border-blue-100 shrink-0"><MapPin className="w-5 h-5" /></div><span className="font-semibold text-slate-900">{item.name}</span></div></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><Globe className="w-4 h-4 text-slate-400" /><span className="text-sm font-medium text-slate-700">{item.region?.name || <span className="text-red-400 text-xs">Unknown Region</span>}</span></div></td>
                    {/* Site Count */}
                    <td className="px-6 py-4 text-center"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${Number(item.siteCount) > 0 
                                ? 'bg-green-100 text-green-800' // มีคนอยู่ สีเขียว
                                : 'bg-slate-100 text-slate-500' // ว่างเปล่า สีเทา
                        }`}>{item.siteCount}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{item.description || <span className="text-slate-300 italic">No description</span>}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap"><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" />{new Date(item.createdAt).toLocaleDateString()}</div></td>
                    <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => openModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit className="w-4 h-4" /></button><button onClick={() => setDeleteModal({ isOpen: true, id: item.id, name: item.name })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
                ))}
                {zonesList.length === 0 && (<tr><td colSpan={5} className="text-center py-12 text-gray-500"><div className="flex flex-col items-center justify-center"><MapPin className="w-10 h-10 text-gray-300 mb-3" /><p>No zones found matching "{debouncedSearch}"</p></div></td></tr>)}
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
            ref={modalRef} // 👈 5. ผูก Ref เข้ากับ div
            tabIndex={-1} // 👈 6. สำคัญมาก! ทำให้ div นี้รับ focus ได้ (ถ้าไม่มีจะ focus ไม่ติด)
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 outline-none" // outline-none เพื่อไม่ให้มีกรอบสีฟ้า
            onClick={() => setIsModalOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setIsModalOpen(false); }}
         >
             <div 
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all scale-100" 
                onClick={e => e.stopPropagation()}
             >
                 <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">{editingZone ? <Edit className="w-5 h-5"/> : <Plus className="w-5 h-5"/>} {editingZone ? 'Edit Zone' : 'Create Zone'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                 </div>
                 
                 <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-5">
                    
                    {/* SearchableSelect */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Region <span className="text-red-500">*</span></label>
                        <input type="hidden" {...register('regionId', { required: true })} />
                        
                        <SearchableSelect 
                           options={regionsData?.results || []}
                           value={currentRegionId} 
                           onChange={(val) => setValue('regionId', val, { shouldValidate: true })}
                           placeholder="Search or select region..."
                           error={!!errors.regionId}
                        />
                        {errors.regionId && <span className="text-red-500 text-xs">Region is required</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Zone Name <span className="text-red-500">*</span></label>
                        <input {...register('name', {required:true})} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Bangkok" />
                        {errors.name && <span className="text-red-500 text-xs">Name is required</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                        <textarea {...register('description')} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" placeholder="Optional description..." />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md">{mutation.isPending ? 'Saving...' : 'Save Zone'}</button>
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
                  
                  <h3 className="font-bold text-2xl text-slate-800 mb-3">Delete Zone?</h3>
                  
                  <div className="text-slate-500 mb-8 text-base leading-relaxed">
                      Are you sure you want to delete zone <br/>
                      <span className="font-bold text-slate-900 text-lg">"{deleteModal.name}"</span>?
                      <div className="mt-2 text-sm text-red-500 bg-red-50 py-1 px-2 rounded-lg inline-block">
                        This action cannot be undone.
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      {/* ปุ่ม Cancel: เอา ref ออก */}
                      <button 
                        onClick={() => setDeleteModal({isOpen:false, id:null, name:''})} 
                        className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>

                      {/* ปุ่ม Delete: ใส่ ref={deleteModalRef} ที่นี่ เพื่อให้กด Enter ได้เลย */}
                      <button 
                        ref={deleteModalRef} 
                        onClick={() => deleteModal.id && deleteMutation.mutate(deleteModal.id)} 
                        className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Trash2 className="w-5 h-5"/> Delete Zone
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}