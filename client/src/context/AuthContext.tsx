// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth/auth';
import { toast } from 'react-toastify';

interface AuthContextType {
  user: any;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. โหลดหน้าเว็บมา เช็คก่อนเลยว่ามี Token ค้างไหม
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await authApi.login({ email, password });
      
      const userData = data.user; // สมมติว่า backend ส่ง user object กลับมาด้วย
      const accessToken = data.tokens.access.token;

      // 🛑 Gatekeeper Check: ตรวจสอบสถานะตรงนี้
      if (userData.status !== 'active') {
        let errorMsg = 'Access Denied';
        if (userData.status === 'pending') errorMsg = 'Your account is pending approval.';
        if (userData.status === 'banned') errorMsg = 'Your account has been suspended.';
        
        // แจ้งเตือนและจบการทำงานทันที (ไม่ Save token)
        toast.error(errorMsg);
        return false; 
      }

      // ✅ ถ้าผ่าน (Active) ค่อย Save ลงเครื่อง
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', accessToken);

      setUser(userData);
      toast.success(`Welcome back, ${userData.firstName}!`);
      return true;
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const logout = () => {
    // authApi.logout(); // (Optional: ยิงบอก Backend ว่าออกแล้ว)
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};