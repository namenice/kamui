// sec/pages/admin/UserManagement.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { userApi, type User } from '../../api/users/user';
import { 
  Plus, Edit, Trash2, X, Shield, ShieldAlert, 
  CheckCircle, Clock, Ban, AlertCircle, AlertTriangle, 
  ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, ArrowUpDown 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  // --- States ---
  const [page, setPage] = useState(1);
  const limit = 10;
  
  // Search & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt', direction: 'desc'
  });

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; userId: string | null; userName: string }>({
    isOpen: false, userId: null, userName: ''
  });

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteModal.isOpen) { setDeleteModal(p => ({ ...p, isOpen: false })); return; }
        if (isModalOpen) setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, deleteModal.isOpen]);

  // --- Query ---
  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ['users', page, debouncedSearch, sortConfig], 
    queryFn: () => userApi.getUsers(page, limit, debouncedSearch, sortConfig.key, sortConfig.direction),
    placeholderData: keepPreviousData,
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
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
      : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
  };

  // --- Mutations ---
  const { register, handleSubmit, reset, setValue } = useForm();
  
  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setValue('firstName', user.firstName);
      setValue('lastName', user.lastName || '');
      setValue('email', user.email);
      setValue('role', user.role);
      setValue('status', user.status);
    } else {
      setEditingUser(null);
      reset({ firstName: '', lastName: '', email: '', password: '', role: 'user', status: 'active' });
    }
    setIsModalOpen(true);
  };

  const mutation = useMutation({
    mutationFn: (formData: any) => {
      const payload = { ...formData, lastName: formData.lastName || null };
      if (editingUser) {
        const { password, ...rest } = payload;
        return userApi.updateUser(editingUser.id, password ? payload : rest);
      }
      return userApi.createUser(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      toast.success(editingUser ? 'User updated' : 'User created');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error')
  });

  const deleteMutation = useMutation({
    mutationFn: userApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteModal({ isOpen: false, userId: null, userName: '' });
      toast.success('User deleted');
    }
  });

  const usersList = data?.results || [];

  if (isLoading) return <div className="flex justify-center h-64 items-center gap-2 text-slate-500"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>Loading...</div>;
  if (isError) return <div className="text-center text-red-500 mt-10">Error loading data</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
            <p className="text-slate-500 text-sm">Total users: {data?.totalResults || 0}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative group w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Search name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm"
                />
            </div>
            <button 
                onClick={() => openModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap"
            >
                <Plus className="w-4 h-4" /> Add User
            </button>
        </div>
      </div>

      {/* Table (แยก Role/Status) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('firstName')}>
                        <div className="flex items-center">User Info <SortIcon columnKey="firstName" /></div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('role')}>
                        <div className="flex items-center">Role <SortIcon columnKey="role" /></div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('status')}>
                        <div className="flex items-center">Status <SortIcon columnKey="status" /></div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('createdAt')}>
                        <div className="flex items-center">Created At <SortIcon columnKey="createdAt" /></div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
                {usersList.map((u: User) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold mr-3 shadow-sm border border-white shrink-0">
                                {u.firstName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="font-medium text-slate-900 truncate">{u.firstName} {u.lastName || ''}</div>
                                <div className="text-sm text-slate-500 truncate">{u.email}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {u.role === 'admin' ? <ShieldAlert className="w-3 h-3 mr-1"/> : <Shield className="w-3 h-3 mr-1"/>}
                            {u.role.toUpperCase()}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            u.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                            u.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            {u.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {u.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {u.status === 'banned' && <Ban className="w-3 h-3 mr-1" />}
                            {u.status.toUpperCase()}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" />{new Date(u.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => openModal(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                            {currentUser?.id !== u.id && (
                                <button onClick={() => setDeleteModal({ isOpen: true, userId: u.id, userName: `${u.firstName} ${u.lastName || ''}` })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                            )}
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-900">{data?.page || 1}</span> of <span className="font-semibold text-gray-900">{data?.totalPages || 1}</span>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => setPage(old => Math.max(old - 1, 1))}
                    disabled={page === 1 || isPlaceholderData}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center transition-colors outline-none focus:ring-2 focus:ring-blue-100"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </button>
                <button
                    onClick={() => { if (!isPlaceholderData && data && page < data.totalPages) setPage(old => old + 1) }}
                    disabled={isPlaceholderData || (data && page === data.totalPages)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center transition-colors outline-none focus:ring-2 focus:ring-blue-100"
                >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                </button>
            </div>
        </div>
      </div>

      {/* 👇 MODAL: ADD/EDIT USER (Modern Design) */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200" onClick={() => setIsModalOpen(false)}>
             <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                 
                 {/* Header */}
                 <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        {editingUser ? <Edit className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                        {editingUser ? 'Edit User' : 'Create New User'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5"/>
                    </button>
                 </div>

                 {/* Form */}
                 <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-5">
                    
                    {/* Name Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">First Name <span className="text-red-500">*</span></label>
                            <input {...register('firstName', {required:true})} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" autoFocus placeholder="John" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                            <input {...register('lastName')} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Doe" />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                        <input {...register('email', {required:true})} className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-slate-100 disabled:text-slate-500" disabled={!!editingUser} placeholder="email@example.com" />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Password {editingUser && <span className="text-xs text-slate-400 font-normal">(Leave blank to keep)</span>}</label>
                        <input type="password" {...register('password')} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="••••••••" />
                    </div>

                    {/* Role & Status Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                            <div className="relative">
                                <select {...register('role')} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none transition-all">
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <ArrowDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                            <div className="relative">
                                <select {...register('status')} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none transition-all">
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="banned">Banned</option>
                                </select>
                                <ArrowDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition-all transform active:scale-95">Save User</button>
                    </div>
                 </form>
             </div>
         </div>
      )}

      {/* 👇 MODAL: DELETE (Modern Design) */}
      {deleteModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity" onClick={() => setDeleteModal({isOpen:false, userId:null, userName:''})}>
              <div className="bg-white p-6 rounded-2xl max-w-sm text-center shadow-2xl transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-short"><AlertTriangle className="w-8 h-8 text-red-600"/></div>
                  <h3 className="font-bold text-xl text-slate-800">Delete User?</h3>
                  <p className="text-slate-500 mt-2 mb-6 text-sm">Are you sure you want to delete <br/><span className="font-bold text-slate-900 text-base">"{deleteModal.userName}"</span>?<br/>This action cannot be undone.</p>
                  <div className="flex justify-center gap-3">
                      <button onClick={() => setDeleteModal({isOpen:false, userId:null, userName:''})} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">Cancel</button>
                      <button onClick={() => deleteModal.userId && deleteMutation.mutate(deleteModal.userId)} className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center gap-2 shadow-md transition-all"><Trash2 className="w-4 h-4"/> Delete</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}