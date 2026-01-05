// src/pages/devices/InterfaceList.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { 
  Network, Search, Plus, Edit, Trash2, X, 
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
  Server, Link, ArrowRight, AlertTriangle, Plug
} from 'lucide-react';

// API
import { interfaceConnectionApi, type InterfaceConnection } from '../../api/devices/interfaceConnection';
import { hardwareApi } from '../../api/devices/hardware'; 
import SearchableSelect from '../../components/common/SearchableSelect'; 

export default function InterfaceList() {
  const queryClient = useQueryClient();

  // --- States ---
  const [page, setPage] = useState(1);
  const limit = 20;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'parentDevice.name', direction: 'asc' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InterfaceConnection | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string }>({ isOpen: false, id: null, name: '' });

  // 👇 Refs for Focus Management (เหมือนหน้า HardwareInfo)
  const modalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLButtonElement>(null);

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Auto Focus Modal
  useEffect(() => {
    if (isModalOpen) setTimeout(() => modalRef.current?.focus(), 50);
  }, [isModalOpen]);

  // Auto Focus Delete Modal
  useEffect(() => {
    if (deleteModal.isOpen) setTimeout(() => deleteModalRef.current?.focus(), 50);
  }, [deleteModal.isOpen]);

  // --- Queries ---
  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ['interfaceConnections', 'global', page, debouncedSearch, sortConfig],
    queryFn: () => interfaceConnectionApi.getInterfaceConnections('', page, limit, sortConfig.key, sortConfig.direction, debouncedSearch),
    placeholderData: keepPreviousData,
  });

  const { data: hardwareList } = useQuery({
    queryKey: ['hardwares', 'list-all'],
    queryFn: () => hardwareApi.getHardwares(1, 1000),
    staleTime: 5 * 60 * 1000,
  });

  // Options
  const hardwareOptions = useMemo(() => hardwareList?.results?.map((h:any) => ({ id: h.id, name: h.name })) || [], [hardwareList]);
  
  // --- Form ---
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const watchHardwareId = watch('hardwareId');

  const switchOptions = useMemo(() => {
      if (!hardwareList?.results) return [];
      return hardwareList.results
        .filter((h: any) => h.id !== watchHardwareId) 
        .map((h: any) => ({ id: h.id, name: `${h.name} (${h.oobIp || '-'})` }));
  }, [hardwareList, watchHardwareId]);

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
      return sortConfig.direction === 'asc' 
        ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" /> 
        : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />; 
  };

  const openModal = (item?: InterfaceConnection) => {
    if (item) {
      setEditingItem(item);
      setValue('name', item.name);
      setValue('macAddress', item.macAddress || '');
      setValue('ipAddress', item.ipAddress || '');
      setValue('speed', item.speed || '');
      setValue('type', item.type || '');
      setValue('hardwareId', item.hardwareId);
      setValue('connectedSwitchId', item.connectedSwitchId || '');
      setValue('connectedPort', item.connectedPort || '');
    } else {
      setEditingItem(null);
      reset({ name: '', macAddress: '', ipAddress: '', speed: '10G', type: 'SFP+', hardwareId: '', connectedSwitchId: '', connectedPort: '' });
    }
    setIsModalOpen(true);
  };

  // --- Mutations ---
  const mutation = useMutation({
    mutationFn: (data: any) => {
       const payload = { ...data };
       if (!payload.connectedSwitchId) payload.connectedSwitchId = null;
       if (editingItem) return interfaceConnectionApi.updateInterfaceConnection(editingItem.id, payload);
       return interfaceConnectionApi.createInterfaceConnection(payload);
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['interfaceConnections'] });
       setIsModalOpen(false);
       toast.success(editingItem ? 'Updated' : 'Created');
    },
    onError: (err:any) => toast.error(err.response?.data?.message || 'Failed')
  });

  const deleteMutation = useMutation({
    mutationFn: interfaceConnectionApi.deleteInterfaceConnection,
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['interfaceConnections'] });
       setDeleteModal({ isOpen: false, id: null, name: '' });
       toast.success('Deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Delete failed')
  });

  const list = data?.results || [];

  if (isLoading) return <div className="flex justify-center h-64 items-center gap-2 text-slate-500"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>Loading...</div>;
  if (isError) return <div className="text-center text-red-500 mt-10">Error loading data</div>;

  return (
    <div className="p-6 max-w-[95rem] mx-auto animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Network className="w-6 h-6 text-blue-600" /> Global Interface List
            </h1>
            <p className="text-slate-500 text-sm mt-1">Overview of all network interfaces ({data?.totalResults || 0} ports)</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <div className="relative group w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" /></div>
                <input type="text" placeholder="Search port, IP, device..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm" />
            </div>
            <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap"><Plus className="w-4 h-4" /> Add Interface</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('parentDevice.name')}>
                        <div className="flex items-center">Owner Device <SortIcon columnKey="parentDevice.name"/></div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('name')}>
                        <div className="flex items-center">Interface <SortIcon columnKey="name"/></div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Speed / Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Uplink (Switch)</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
                {list.map((item: InterfaceConnection) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors duration-150 group/row">
                        {/* Owner Device */}
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-slate-100 rounded text-slate-600"><Server className="w-4 h-4"/></div>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{item.parentDevice?.name || 'Unknown'}</div>
                                    <div className="text-xs text-slate-400 font-mono">{item.parentDevice?.serialNumber}</div>
                                </div>
                            </div>
                        </td>
                        
                        {/* Interface Name */}
                        <td className="px-6 py-4">
                            <div className="font-semibold text-blue-600 text-sm">{item.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{item.macAddress}</div>
                        </td>

                        <td className="px-6 py-4 font-mono text-sm text-slate-700">{item.ipAddress || '-'}</td>
                        
                        <td className="px-6 py-4">
                             {(item.speed || item.type) ? (
                                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded border border-slate-200">
                                    {item.speed} {item.type}
                                </span>
                             ) : '-'}
                        </td>

                        {/* Uplink */}
                        <td className="px-6 py-4">
                            {item.connectedSwitch ? (
                                <div className="flex items-center gap-1.5 text-sm text-slate-700">
                                    <Link className="w-3 h-3 text-blue-500"/>
                                    <span className="font-bold">{item.connectedSwitch.name}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400"/>
                                    <span className="font-mono bg-blue-50 px-1 rounded text-blue-700 text-xs">{item.connectedPort}</span>
                                </div>
                            ) : <span className="text-slate-300 text-xs italic">Unplugged</span>}
                        </td>

                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => openModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => setDeleteModal({ isOpen: true, id: item.id, name: item.name })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </td>
                    </tr>
                ))}
                {list.length === 0 && (
                    <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-500">
                            <div className="flex flex-col items-center justify-center">
                                <Plug className="w-10 h-10 text-gray-300 mb-3" />
                                <p>No interfaces found matching "{debouncedSearch}"</p>
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">Page <span className="font-semibold text-gray-900">{data?.page || 1}</span> of <span className="font-semibold text-gray-900">{data?.totalPages || 1}</span></div>
            <div className="flex gap-2">
                 <button onClick={() => setPage(old => Math.max(old - 1, 1))} disabled={page === 1 || isPlaceholderData} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center transition-colors"><ChevronLeft className="w-4 h-4 mr-1" /> Previous</button>
                 <button onClick={() => { if (!isPlaceholderData && data && page < data.totalPages) setPage(old => old + 1) }} disabled={isPlaceholderData || (data && page === data.totalPages)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center transition-colors">Next <ChevronRight className="w-4 h-4 ml-1" /></button>
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
                    className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transform transition-all scale-100" 
                    onClick={e => e.stopPropagation()}
                >
                    <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2 text-lg">
                            {editingItem ? <Edit className="w-5 h-5"/> : <Plus className="w-5 h-5"/>} 
                            {editingItem ? 'Edit Interface' : 'Add Interface'}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                    </div>
                    
                    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-5">
                        
                        {/* Owner Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Owner Device <span className="text-red-500">*</span></label>
                            <input type="hidden" {...register('hardwareId', {required: true})} />
                            <SearchableSelect 
                                options={hardwareOptions} 
                                value={watchHardwareId} 
                                onChange={(val) => setValue('hardwareId', val, {shouldValidate:true})} 
                                placeholder="Select Owner Device..."
                                error={!!errors.hardwareId}
                                disabled={!!editingItem} 
                            />
                            {errors.hardwareId && <span className="text-red-500 text-xs">Required</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Interface Name <span className="text-red-500">*</span></label>
                                <input {...register('name', {required: true})} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="eth0" />
                                {errors.name && <span className="text-red-500 text-xs">Required</span>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">IP Address</label>
                                <input {...register('ipAddress')} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="192.168.1.10" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Speed</label>
                                <input {...register('speed')} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="10G" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                                <input {...register('type')} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="SFP+" />
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 mt-2">
                            <label className="block text-sm font-bold text-blue-600 mb-3 flex items-center gap-1"><Link className="w-4 h-4"/> Uplink Connection</label>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Connected Switch</label>
                                    <input type="hidden" {...register('connectedSwitchId')} />
                                    <SearchableSelect 
                                        options={switchOptions} 
                                        value={watch('connectedSwitchId')} 
                                        onChange={(val) => setValue('connectedSwitchId', val)} 
                                        placeholder="Select Switch..."
                                        isClearable={true}
                                        disabled={!watchHardwareId} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Port</label>
                                    <input {...register('connectedPort')} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 1/0/1" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                            <button type="submit" disabled={mutation.isPending} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md">
                                {mutation.isPending ? 'Saving...' : 'Save Interface'}
                            </button>
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
                    
                    <h3 className="font-bold text-2xl text-slate-800 mb-3">Delete Interface?</h3>
                    
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
    </div>
  );
}