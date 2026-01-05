// src/layouts/MainLayout.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 1. Sidebar (Fixed Left) */}
      <Sidebar />

      {/* 2. Main Content Wrapper */}
      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* Header (Fixed Top) */}
        <Header />

        {/* Content Area (Scrollable) */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
}