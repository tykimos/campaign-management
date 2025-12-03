import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Megaphone, 
  Users, 
  BarChart3, 
  FileText,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { to: '/', icon: Home, label: '대시보드' },
    { to: '/campaigns', icon: Megaphone, label: '캠페인 관리' },
    { to: '/channels', icon: Users, label: '채널 관리' },
    { to: '/posts', icon: FileText, label: '게재 현황' },
    { to: '/analytics', icon: BarChart3, label: '성과 분석' },
    { to: '/settings', icon: Settings, label: '설정' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-md shadow-lg"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-800">Campaign Manager</h1>
            {user && (
              <p className="text-sm text-gray-600 mt-2">{user.email}</p>
            )}
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {user && (
            <div className="p-4 border-t">
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 px-4 py-2 w-full rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut size={20} />
                <span>로그아웃</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};