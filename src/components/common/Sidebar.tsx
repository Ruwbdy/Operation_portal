import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TowerControl as Tower,
  History,
  User,
  Layers,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  children?: { path: string; label: string }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/',
    icon: <History size={16} />,
    label: 'Dashboard'
  },
  {
    path: '/user-support',
    icon: <User size={16} />,
    label: 'User Support',
    children: [
      { path: '/user-support/charging-profile', label: 'Charging Profile' },
      { path: '/user-support/balance-cdr', label: 'Balance & CDR' },
      { path: '/user-support/data-bundle', label: 'Bundle Fulfilment' }
    ]
  },
  {
    path: '/in-support',
    icon: <Layers size={16} />,
    label: 'IN Support',
    children: [
      { path: '/in-support/dsa', label: 'IN-DSA' },
      { path: '/in-support/service-desk', label: 'IN-Service Desk' },
      { path: '/in-support/ops', label: 'IN-Ops' }
    ]
  }
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('mtn_in_auth');
    localStorage.removeItem('mtn_in_user');
    navigate('/login');
  };

  if (!isOpen) return null;

  const username = localStorage.getItem('mtn_in_user') || 'Osazuwa';

  return (
    <aside className="bg-black flex flex-col h-screen sticky top-0 z-50 transition-all duration-500 ease-in-out w-72">
      <div className="p-10 text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="bg-[#FFCC00] p-1.5 rounded-lg shrink-0">
            <Tower className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-black text-[#FFCC00] tracking-tighter uppercase italic">
            MTN IN
          </span>
        </div>
        <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">
          Command Hub
        </p>
      </div>

      <nav className="flex-1 px-6 space-y-2 mt-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <div key={item.path}>
            <button
              onClick={() => navigate(item.children ? item.children[0].path : item.path)}
              className={`w-full flex items-center px-5 py-4 text-[10px] font-black rounded-xl transition-all group ${
                isActive(item.path)
                  ? 'bg-[#FFCC00] text-black shadow-lg shadow-[#FFCC00]/10'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <span
                className={`${
                  isActive(item.path)
                    ? 'text-black'
                    : 'text-gray-500 group-hover:text-[#FFCC00]'
                } mr-3.5 transition-transform group-hover:scale-110 shrink-0`}
              >
                {item.icon}
              </span>
              <span className="tracking-widest uppercase leading-none">{item.label}</span>
              {isActive(item.path) && (
                <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
              )}
            </button>

            {item.children && isActive(item.path) && (
              <div className="ml-8 mt-2 space-y-1">
                {item.children.map((child) => (
                  <button
                    key={child.path}
                    onClick={() => navigate(child.path)}
                    className={`w-full text-left px-4 py-2 text-[9px] font-bold rounded-lg transition-all ${
                      location.pathname === child.path
                        ? 'bg-white/10 text-[#FFCC00]'
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-5 py-4 text-[10px] font-black rounded-xl transition-all bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white group"
        >
          <LogOut size={16} className="group-hover:scale-110 transition-transform" />
          <span className="tracking-widest uppercase leading-none">Logout</span>
        </button>
      </div>

      <div className="p-8 border-t border-white/5 text-center">
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">
          Node Op: {username}
        </span>
      </div>
    </aside>
  );
}