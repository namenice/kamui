import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { 
  Plus, Trash2, Edit, Save, X, Network, Link, ArrowRight, Plug 
} from 'lucide-react';

import { interfaceConnectionApi, type InterfaceConnection } from '../../../api/devices/interfaceConnection';
import { hardwareApi } from '../../../api/devices/hardware';
import SearchableSelect from '../../../components/common/SearchableSelect';

interface Props {
  hardwareId?: string; // Optional (สำหรับ Add New จะเป็น undefined)
  draftInterfaces?: InterfaceConnection[]; // รับค่า Draft จากหน้าแม่
  onDraftChange?: (interfaces: InterfaceConnection[]) => void; // ส่งค่า Draft กลับ
}

export default function HardwareConnectionTab({ hardwareId, draftInterfaces = [], onDraftChange }: Props) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // --- 1. Queries ---
  
  // 1.1 Real Data (ทำงานเฉพาะตอนมี hardwareId เท่านั้น) 👈 จุดที่แก้ไข
  const { data: realData, isLoading: isLoadingReal } = useQuery({
    queryKey: ['interfaceConnections', hardwareId],
    queryFn: () => interfaceConnectionApi.getInterfaceConnections(hardwareId!),
    enabled: !!hardwareId, // ✅ ถ้าไม่มี hardwareId (Add Mode) ห้าม Fetch!
  });

  // 1.2 Switch List
  const { data: hardwareList } = useQuery({
    queryKey: ['hardwares', 'list-for-uplink'],
    queryFn: () => hardwareApi.getHardwares(1, 1000),
    staleTime: 5 * 60 * 1000,
  });

  const switchOptions = useMemo(() => {
    if (!hardwareList?.results) return [];
    return hardwareList.results
      .filter((h: any) => h.id !== hardwareId) 
      .map((h: any) => ({
        id: h.id,
        name: `${h.name} (${h.oobIp || 'No IP'})`
      }));
  }, [hardwareList, hardwareId]);

  // --- 2. Determine Data Source (Real vs Draft) ---
  const displayList = useMemo(() => {
    // ถ้ามี hardwareId (Edit Mode) ใช้ข้อมูลจริงจาก API
    if (hardwareId) return realData?.results || [];
    // ถ้าไม่มี (Add Mode) ใช้ข้อมูล Draft ที่ส่งมาจากหน้าแม่
    return draftInterfaces;
  }, [hardwareId, realData, draftInterfaces]);

  const isLoading = hardwareId ? isLoadingReal : false;

  // --- 3. Form Setup ---
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Partial<InterfaceConnection>>();

  const startEdit = (item: InterfaceConnection) => {
    setEditingId(item.id);
    setIsAdding(false);
    reset({ ...item });
  };

  const startAdd = () => {
    setEditingId(null);
    setIsAdding(true);
    reset({
      name: '', macAddress: '', ipAddress: '', speed: '10G', type: 'SFP+',
      connectedSwitchId: '', connectedPort: '',
      hardwareId: hardwareId || '' 
    });
  };

  const cancelForm = () => {
    setEditingId(null);
    setIsAdding(false);
    reset();
  };

  // --- 4. Handlers (Mix of Real API & Draft Logic) ---

  const handleSave = async (formData: any) => {
    const payload = { ...formData, hardwareId: hardwareId || '' };
    if (!payload.connectedSwitchId) payload.connectedSwitchId = null;

    if (hardwareId) {
      // 🅰️ Real Mode: Call API ทันที
      try {
        if (isAdding) await interfaceConnectionApi.createInterfaceConnection(payload);
        else await interfaceConnectionApi.updateInterfaceConnection(editingId!, payload);
        
        queryClient.invalidateQueries({ queryKey: ['interfaceConnections', hardwareId] });
        toast.success(isAdding ? 'Interface Added' : 'Updated');
        cancelForm();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed');
      }
    } else {
      // 🅱️ Draft Mode: อัปเดต State array แทน (ยังไม่ยิง API)
      if (isAdding) {
        const newItem = { ...payload, id: `draft-${Date.now()}` }; // สร้าง ID ปลอม
        onDraftChange?.([...draftInterfaces, newItem]);
      } else {
        const updatedList = draftInterfaces.map(item => item.id === editingId ? { ...item, ...payload } : item);
        onDraftChange?.(updatedList);
      }
      cancelForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete interface?')) return;

    if (hardwareId) {
      // 🅰️ Real Mode
      try {
        await interfaceConnectionApi.deleteInterfaceConnection(id);
        queryClient.invalidateQueries({ queryKey: ['interfaceConnections', hardwareId] });
        toast.success('Deleted');
      } catch (err) { toast.error('Delete failed'); }
    } else {
      // 🅱️ Draft Mode
      const updatedList = draftInterfaces.filter(item => item.id !== id);
      onDraftChange?.(updatedList);
    }
  };

  // --- 5. Render Logic ---
  const renderRow = (item: InterfaceConnection) => (
    <tr key={item.id} className="hover:bg-slate-50 group border-b border-gray-100 last:border-0 transition-colors">
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${hardwareId ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                <Plug className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-800">{item.name}</span>
            {/* Show NEW badge for draft items */}
            {!hardwareId && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 rounded font-bold">New</span>}
        </div>
      </td>
      <td className="px-4 py-3 align-middle font-mono text-sm text-slate-600">{item.ipAddress || '-'}</td>
      <td className="px-4 py-3 align-middle font-mono text-xs text-slate-500">{item.macAddress || '-'}</td>
      <td className="px-4 py-3 align-middle text-sm text-slate-700">{(item.speed || item.type) ? `${item.speed || ''} ${item.type || ''}` : '-'}</td>
      <td className="px-4 py-3 align-middle text-sm">
        {item.connectedSwitchId ? (
            <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-md w-fit shadow-sm">
                <Link className="w-3 h-3"/> 
                <span className="font-bold text-xs">
                    {/* Find name from options if it's draft (because object relation is missing) */}
                    {item.connectedSwitch?.name || switchOptions.find(s => s.id === item.connectedSwitchId)?.name || 'Switch'}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400"/>
                <span className="font-mono text-xs font-bold">{item.connectedPort || '?'}</span>
            </div>
        ) : <span className="text-slate-400 text-xs italic">Not Connected</span>}
      </td>
      <td className="px-4 py-3 align-middle text-right">
        <div className="flex justify-end gap-1">
            <button onClick={() => startEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4"/></button>
            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
        </div>
      </td>
    </tr>
  );

  const renderFormRow = () => (
    <tr className="bg-blue-50/40 border-b border-blue-100 animate-fade-in">
      <td className="px-2 py-3 align-top">
         <input {...register('name', {required: true})} className="w-full border border-blue-200 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. eth0" autoFocus />
         {errors.name && <div className="text-red-500 text-[10px] mt-1">Required</div>}
      </td>
      <td className="px-2 py-3 align-top"><input {...register('ipAddress')} className="w-full border border-blue-200 rounded px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-blue-500" placeholder="192.168.x.x" /></td>
      <td className="px-2 py-3 align-top"><input {...register('macAddress')} className="w-full border border-blue-200 rounded px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-blue-500" placeholder="AA:BB:CC..." /></td>
      <td className="px-2 py-3 align-top">
         <div className="flex gap-1 flex-col xl:flex-row">
             <input {...register('speed')} className="w-full border border-blue-200 rounded px-2 py-1.5 text-sm" placeholder="10G" />
             <input {...register('type')} className="w-full border border-blue-200 rounded px-2 py-1.5 text-sm" placeholder="SFP+" />
         </div>
      </td>
      <td className="px-2 py-3 align-top min-w-[180px]">
         <div className="flex flex-col gap-2">
             <SearchableSelect options={switchOptions} value={watch('connectedSwitchId') || ''} onChange={(val) => setValue('connectedSwitchId', val)} placeholder="Switch..." isClearable={true} />
             <div className="relative"><Link className="absolute left-2 top-2 w-3 h-3 text-slate-400" /><input {...register('connectedPort')} className="w-full border border-slate-200 rounded pl-7 pr-2 py-1.5 text-xs" placeholder="Port" /></div>
         </div>
      </td>
      <td className="px-2 py-3 text-right align-top">
         <div className="flex gap-1 justify-end mt-1">
            <button onClick={handleSubmit(handleSave)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"><Save className="w-4 h-4"/></button>
            <button onClick={cancelForm} className="p-2 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50"><X className="w-4 h-4"/></button>
         </div>
      </td>
    </tr>
  );

  return (
    <div className="animate-fade-in space-y-4">
        <div className="flex justify-between items-center px-1">
            <div>
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Network className="w-5 h-5 text-blue-600" /> Network Interfaces
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{hardwareId ? 'Manage physical ports' : 'Draft interfaces (Will be saved with hardware)'}</p>
            </div>
            {!isAdding && !editingId && (
                <button onClick={startAdd} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-sm transition-all active:scale-95">
                    <Plus className="w-4 h-4" /> Add Interface
                </button>
            )}
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                        <th className="px-4 py-3 w-[15%]">Name</th>
                        <th className="px-4 py-3 w-[15%]">IP Address</th>
                        <th className="px-4 py-3 w-[15%]">MAC</th>
                        <th className="px-4 py-3 w-[15%]">Speed/Type</th>
                        <th className="px-4 py-3 w-[25%]">Uplink</th>
                        <th className="px-4 py-3 w-[10%] text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {isAdding && renderFormRow()}
                    
                    {isLoading ? (
                        <tr><td colSpan={6} className="text-center py-8 text-slate-400">Loading...</td></tr>
                    ) : displayList.length === 0 && !isAdding ? (
                        <tr><td colSpan={6} className="text-center py-12 text-slate-400"><div className="flex flex-col items-center gap-2"><Plug className="w-8 h-8 opacity-20" /><span>No interfaces.</span></div></td></tr>
                    ) : (
                        displayList.map((item) => editingId === item.id ? renderFormRow() : renderRow(item))
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
}