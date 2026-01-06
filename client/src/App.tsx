import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import MainLayout from './layouts/MainLayout'; 


import Dashboard from './pages/dashboard/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import RegionManagement from './pages/organization/locations/RegionManagement';
import ZoneManagement from './pages/organization/locations/ZoneManagement';
import SiteManagement from './pages/organization/locations/SiteManagement';
import RoomManagement from './pages/organization/locations/RoomManagement';
import RackManagement from './pages/organization/locations/RackManagement';

import TenantGroupManagement from './pages/organization/tenancy/TenantGroupManagement';
import TenantManagement from './pages/organization/tenancy/TenantManagement';

import HardwareInfoManagement from './pages/devices/HardwareInfoManagement';
import HardwareTypeManagement from './pages/devices/HardwareTypeManagement';
import HardwareManagement from './pages/devices/HardwareManagement';
import InterfaceList from './pages/devices/InterfaceList';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Protected Area */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout /> {/* 👈 ใช้ MainLayout เป็นโครงหลัก */}
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
 
        {/* Placeholder Routes (กัน Error เวลากดเมนู) */}
        {/* <Route path="org/locations/*" element={<div>Locations Module</div>} />
        <Route path="org/tenancy" element={<div>Tenancy Module</div>} />
        <Route path="devices/hardwares" element={<div>Hardwares Inventory</div>} />
        <Route path="devices/types" element={<div>Hardware Types</div>} /> */}

        <Route path="/org/locations/regions" element={<RegionManagement />} />
        <Route path="/org/locations/zones" element={<ZoneManagement />} />
        <Route path="/org/locations/sites" element={<SiteManagement />} />
        <Route path="/org/locations/rooms" element={<RoomManagement />} />
        <Route path="/org/locations/racks" element={<RackManagement />} />

        <Route path="/org/tenancy/tenantgroup" element={<TenantGroupManagement />} />
        <Route path="/org/tenancy/tenant" element={<TenantManagement />} />

        <Route path="/devices/hardwareinfo" element={<HardwareInfoManagement />} />
        <Route path="/devices/hardwaretype" element={<HardwareTypeManagement />} />
        <Route path="/devices/hardwareinventory" element={<HardwareManagement />} />
        <Route path="/devices/interfaceconnections" element={<InterfaceList />} />
        
        <Route path="/users" element={<UserManagement />} />
      </Route>
    </Routes>
  );
}

export default App;
