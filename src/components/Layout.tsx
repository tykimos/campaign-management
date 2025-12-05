import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Megaphone, 
  Users, 
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  React.useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

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
    { to: '/channel-types', icon: Layers, label: '채널유형 관리' },
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
      <aside className={`fixed inset-y-0 left-0 z-40 bg-white shadow-lg transform transition-all duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b relative">
            <div className={`transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              <h1 className="text-2xl font-bold text-gray-800">Campaign Manager</h1>
              {user && !sidebarCollapsed && (
                <p className="text-sm text-gray-600 mt-2 truncate">{user.email}</p>
              )}
            </div>
            {sidebarCollapsed && (
              <div className="flex justify-center">
                <span className="text-2xl font-bold text-gray-800">CM</span>
              </div>
            )}
            
            {/* Desktop toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg transition-shadow"
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
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
                      className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                      title={sidebarCollapsed ? item.label : ''}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="transition-opacity duration-300">{item.label}</span>
                      )}
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
                title={sidebarCollapsed ? '로그아웃' : ''}
              >
                <LogOut size={20} className="flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="transition-opacity duration-300">로그아웃</span>
                )}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={`transition-all duration-300 min-h-screen ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};