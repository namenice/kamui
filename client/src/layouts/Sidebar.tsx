import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  Server, 
  ShieldCheck, 
  HardDrive,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ----------------------------------------------------------------------
// 1. Component: Main Dropdown (แบบ Simple - ไม่มี Animation)
// ----------------------------------------------------------------------
interface SidebarDropdownProps {
  title: string;
  icon: any;
  basePath: string;
  children: React.ReactNode;
}

const SidebarDropdown = ({ title, icon: Icon, basePath, children }: SidebarDropdownProps) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Auto Open
  useEffect(() => {
    if (location.pathname.startsWith(basePath)) {
      setIsOpen(true);
    }
  }, [location.pathname, basePath]);

  const toggle = () => setIsOpen(!isOpen);
  const isActiveParent = location.pathname.startsWith(basePath);

  return (
    <li className="mb-1">
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-6 py-3 transition-colors ${
          isActiveParent 
            ? 'text-white bg-slate-800/50' 
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <div className="flex items-center">
          <Icon className={`w-5 h-5 mr-3 ${isActiveParent ? 'text-blue-500' : 'text-slate-400'}`} />
          <span className="font-medium">{title}</span>
        </div>
        {/* Icon ลูกศร */}
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>

      {/* ✅ เอา Animation ออก: ใช้การ Render ตรงๆ แทน */}
      {isOpen && (
        <ul className="bg-slate-900/50 pb-2">
          {children}
        </ul>
      )}
    </li>
  );
};

// ----------------------------------------------------------------------
// 2. Component: Group Header
// ----------------------------------------------------------------------
const SidebarGroup = ({ label }: { label: string }) => (
  <li className="px-6 pt-4 pb-2">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
      {label}
    </span>
  </li>
);

// ----------------------------------------------------------------------
// 3. Component: Link Item
// ----------------------------------------------------------------------
const SidebarSubItem = ({ to, label }: { to: string; label: string }) => (
  <li>
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `block pl-14 pr-6 py-2 text-sm transition-colors border-l-2 ${
          isActive 
            ? 'border-blue-500 text-white font-medium bg-slate-800/30' 
            : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/20'
        }`
      }
    >
      {label}
    </NavLink>
  </li>
);

// ================= MAIN SIDEBAR =================
export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen transition-all duration-300 flex-shrink-0 border-r border-slate-800">
      
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-900/20">
            <Server className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-white text-lg tracking-wide">DCIM <span className="text-blue-500">Pro</span></span>
      </div>

      {/* Menu Area */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700">
        <ul className="space-y-1">
          
          {/* Dashboard */}
          <li>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => 
                `flex items-center px-6 py-3 transition-colors ${
                  isActive ? 'bg-slate-800 text-white border-r-4 border-blue-500' : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              <span className="font-medium">Dashboard</span>
            </NavLink>
          </li>

          {/* ================= ORGANIZATION ================= */}
          <SidebarDropdown title="Organization" icon={Map} basePath="/org">
             
             {/* 1. Location */}
             <SidebarGroup label="Location" />
             <SidebarSubItem to="/org/locations/regions" label="Regions" />
             <SidebarSubItem to="/org/locations/zones" label="Zones" />
             <SidebarSubItem to="/org/locations/sites" label="Sites" />
             <SidebarSubItem to="/org/locations/rooms" label="Rooms" />
             <SidebarSubItem to="/org/locations/racks" label="Racks" />

             {/* 2. Tenancy */}
             <SidebarGroup label="Tenancy" />
             <SidebarSubItem to="/org/tenancy/tenantgroup" label="Tenant Groups" />
             <SidebarSubItem to="/org/tenancy/tenant" label="Tenants" />
             
          
          </SidebarDropdown>

          {/* ================= DEVICES ================= */}
          <SidebarDropdown title="Devices" icon={HardDrive} basePath="/devices">
             
             {/* 1. Devices */}
             <SidebarGroup label="Devices" />
             <SidebarSubItem to="/devices/hardwaretype" label="Hardware Types" />
             <SidebarSubItem to="/devices/hardwareinfo" label="Hardware Info" />
             <SidebarSubItem to="/devices/hardwareinventory" label="Hardware Inventory" />
             <SidebarSubItem to="/devices/interfaceconnections" label="Hardware Connections" />

          </SidebarDropdown>

          {/* ================= ADMIN ================= */}
          {user?.role === 'admin' && (
            <SidebarDropdown title="Admin" icon={ShieldCheck} basePath="/users">
              
              {/* 1. User Management */}
              <SidebarGroup label="System" />
              <SidebarSubItem to="/users" label="User Management" />

            </SidebarDropdown>
          )}

        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-3">
            {/* <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                {user?.firstName?.charAt(0) || 'U'}
            </div> */}
            <div className="overflow-hidden">
                <p className="text-[11px] text-slate-500 truncate capitalize">v1.0.0</p>
            </div>
        </div>
      </div>
    </aside>
  );
}