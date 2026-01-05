// src/layouts/Header.tsx

import { useAuth } from '../context/AuthContext';
import { LogOut, Bell, Menu } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  // ฟังก์ชันสร้างตัวอักษรย่อจากชื่อ (เช่น "John Doe" -> "JD")
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm sticky top-0 z-10">
      
      {/* Left: Title or Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* ปุ่ม Menu สำหรับ Mobile (อนาคตถ้าทำ Responsive) */}
        <button className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Overview</h1>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center gap-4">
        
        {/* Notification Bell */}
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 relative transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-gray-200 mx-1"></div>

        {/* User Info Section */}
        <div className="flex items-center gap-3 pl-2">
          
          {/* Text Info (Name & Role) */}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700 leading-tight">
              {user?.email || 'Unknown User'}
            </p>
            <div className="flex justify-end mt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 uppercase tracking-wide">
                {user?.role || 'Unknow Role'}
              </span>
            </div>
          </div>

          {/* Avatar Circle */}
          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white ring-1 ring-gray-100">
            {getInitials(user?.email)}
          </div>

          {/* Logout Button */}
          <button 
            onClick={logout}
            className="ml-2 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}