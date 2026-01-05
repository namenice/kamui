// src/pages/devices/HardwareInfoManagement.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { hardwareInfoApi, type HardwareInfo } from '../../api/devices/hardwareInfo';
import { hardwareTypeApi } from '../../api/devices/HardwareTypes';

import { 
  Plus, Edit, Trash2, X, Search, 
  ChevronLeft, ChevronRight, Server, Box, Settings, 
  ArrowUp, ArrowDown, ArrowUpDown, AlertTriangle, Clock, Hash
} from 'lucide-react';

import SearchableSelect from '../../components/common/SearchableSelect'; 

export default function HardwareInfoManagement() {
  const queryClient = useQueryClient();
  
  // --- States ---
  const [page, setPage] = useState(1);
  const limit = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HardwareInfo | null>(null);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null, name: string}>({ isOpen: false, id: null, name: '' });

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
    queryKey: ['hardwareInfos', page, debouncedSearch, sortConfig],
    queryFn: () => hardwareInfoApi.getHardwareInfos(page, limit, debouncedSearch, sortConfig.key, sortConfig.direction),
    placeholderData: keepPreviousData,
  });

  const { data: typesData } = useQuery({
    queryKey: ['hardwareTypes', 'dropdown'],
    queryFn: () => hardwareTypeApi.getHardwareTypes(1, 100, '', 'name', 'asc'),
    staleTime: 5 * 60 * 1000,
  });

  // --- Handlers ---
  const handleSort = (key: string) => { 
      setSortConfig(current => ({ 
          key, 
          direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' 
      })); 
      setPage(1); 
  };
  
  const SortIcon = ({ columnKey }: { columnKey: string }) => { 
      if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-400 opacity-50" />; 
      return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />; 
  };

  // --- Forms ---
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const currentTypeId = watch('hardwareTypeId');

  const openModal = (item?: HardwareInfo) => {
    if (item) {
      setEditingItem(item);
      setValue('manufacturer', item.manufacturer);
      setValue('model', item.model);
      setValue('height', item.height);
      setValue('hardwareTypeId', item.hardwareTypeId);
    } else {
      setEditingItem(null);
      reset({ manufacturer: '', model: '', height: 1, hardwareTypeId: '' });
    }
    setIsModalOpen(true);
  };

  const mutation = useMutation({
    mutationFn: (formData: any) => {
      const payload = { ...formData, height: Number(formData.height) };
      if (editingItem) return hardwareInfoApi.updateHardwareInfo(editingItem.id, payload);
      return hardwareInfoApi.createHardwareInfo(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardwareInfos'] });
      setIsModalOpen(false);
      toast.success(editingItem ? 'Model updated' : 'Model created');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Operation failed')
  });

  const deleteMutation = useMutation({
    mutationFn: hardwareInfoApi.deleteHardwareInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardwareInfos'] });
      setDeleteModal({ isOpen: false, id: null, name: '' });
      toast.success('Model deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Cannot delete (Model in use)')
  });

  const list = data?.results || [];

  if (isLoading) return <div className="flex justify-center h-64 items-center gap-2 text-slate-500"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>Loading...</div>;
  if (isError) return <div className="text-center text-red-500 mt-10">Error loading data</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" /> Hardware Models
            </h1>
            <p className="text-slate-500 text-sm mt-1">Master data for standard hardware specifications ({data?.totalResults || 0} models)</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative group w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" /></div>
                <input type="text" placeholder="Search model..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm" />
            </div>
            <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap"><Plus className="w-4 h-4" /> Add Model</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('manufacturer')}><div className="flex items-center">Manufacturer <SortIcon columnKey="manufacturer" /></div></th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('model')}><div className="flex items-center">Model Name <SortIcon columnKey="model" /></div></th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Size (U)</th>
                    
                    {/* 👇 1. เพิ่ม Column Count ตรงนี้ */}
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Active Units</th>
                    
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('createdAt')}><div className="flex items-center">Created At <SortIcon columnKey="createdAt" /></div></th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
                {list.map((item: HardwareInfo) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors duration-150 group/row">
                    <td className="px-6 py-4">
                        <span className="inline-block px-2 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded-md uppercase tracking-wide">
                            {item.manufacturer}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">{item.model}</span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Server className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">{item.hardwareType?.name || '-'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Box className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900">{item.height}U</span>
                        </div>
                    </td>

                    {/* 👇 2. แสดงค่า Count */}
                    <td className="px-6 py-4 text-center">
                        {item.hardwareCount && item.hardwareCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                <Hash className="w-3 h-3" /> {item.hardwareCount}
                            </span>
                        ) : (
                            <span className="text-slate-400 text-xs italic">0</span>
                        )}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" />{new Date(item.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => openModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteModal({ isOpen: true, id: item.id, name: `${item.manufacturer} ${item.model}` })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </td>
                </tr>
                ))}
                {list.length === 0 && (<tr><td colSpan={7} className="text-center py-12 text-gray-500"><div className="flex flex-col items-center justify-center"><Box className="w-10 h-10 text-gray-300 mb-3" /><p>No models found matching "{debouncedSearch}"</p></div></td></tr>)}
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
             <div 
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all scale-100" 
                onClick={e => e.stopPropagation()}
             >
                 <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">{editingItem ? <Edit className="w-5 h-5"/> : <Plus className="w-5 h-5"/>} {editingItem ? 'Edit Model' : 'New Model'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                 </div>
                 
                 <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-5">
                    
                    {/* Manufacturer */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Manufacturer <span className="text-red-500">*</span></label>
                        <input {...register('manufacturer', {required:true})} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Dell" />
                        {errors.manufacturer && <span className="text-red-500 text-xs">Required</span>}
                    </div>

                    {/* Model Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Model Name <span className="text-red-500">*</span></label>
                        <input {...register('model', {required:true})} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. PowerEdge R740" />
                        {errors.model && <span className="text-red-500 text-xs">Required</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Type SearchableSelect */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Type <span className="text-red-500">*</span></label>
                            <input type="hidden" {...register('hardwareTypeId', { required: true })} />
                            <SearchableSelect 
                                options={typesData?.results || []}
                                value={currentTypeId} 
                                onChange={(val) => setValue('hardwareTypeId', val, { shouldValidate: true })}
                                placeholder="Select Type..."
                                error={!!errors.hardwareTypeId}
                            />
                            {errors.hardwareTypeId && <span className="text-red-500 text-xs">Required</span>}
                        </div>

                        {/* Height */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Size (U) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input type="number" {...register('height', {required:true, min:1})} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" defaultValue={1} />
                                <span className="absolute right-3 top-2 text-slate-400 text-sm font-medium pointer-events-none">U</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                        <button type="submit" disabled={mutation.isPending} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md">{mutation.isPending ? 'Saving...' : 'Save Model'}</button>
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
                  
                  <h3 className="font-bold text-2xl text-slate-800 mb-3">Delete Model?</h3>
                  
                  <div className="text-slate-500 mb-8 text-base leading-relaxed">
                      Are you sure you want to delete <br/>
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
                        <Trash2 className="w-5 h-5"/> Delete
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}