import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TowerControl as Tower, History, User, Layers, LogOut } from 'lucide-react';
import { clearAuth, getUsername, hasRole, ROLES } from '../../services/auth.service';
import { usePageActivity } from '../../store/pageStore';

interface SidebarProps { isOpen: boolean }

const NAV_ITEMS = [
  { path: '/', icon: <History size={16} />, label: 'Dashboard', exact: true },
  {
    path: '/user-support',
    icon: <User size={16} />,
    label: 'User Support',
    children: [
      { path: '/user-support/charging-profile', label: 'Charging Profile', activityKey: 'chargingProfileLoading' as const, dataKey: 'chargingHasData' as const },
      { path: '/user-support/balance-cdr',      label: 'Balance & CDR',    activityKey: 'balanceLoading' as const,          dataKey: 'balanceHasData' as const },
      { path: '/user-support/data-bundle',      label: 'Bundle Fulfilment', activityKey: 'bundleStreaming' as const,         dataKey: 'bundleHasData' as const },
    ],
  },
  {
    path: '/in-support',
    icon: <Layers size={16} />,
    label: 'IN Support',
    requiredRole: ROLES.IN_SUPPORT,
    children: [
      { path: '/in-support/dsa',          label: 'IN-DSA' },
      { path: '/in-support/service-desk', label: 'IN-Service Desk' },
      { path: '/in-support/ops',          label: 'IN-Ops' },
    ],
  },
];

type ActivityKey = 'chargingProfileLoading' | 'balanceLoading' | 'bundleStreaming';
type DataKey     = 'chargingHasData' | 'balanceHasData' | 'bundleHasData';

export default function Sidebar({ isOpen }: SidebarProps) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const activity  = usePageActivity();

  const isActive = (path: string, exact = false) =>
    exact ? location.pathname === path : location.pathname === path || location.pathname.startsWith(path);

  const handleLogout = () => { clearAuth(); navigate('/login'); };

  if (!isOpen) return null;

  const username = getUsername() || 'Operator';
  const visibleNavItems = NAV_ITEMS.filter(
    item => !item.requiredRole || hasRole(item.requiredRole)
  );

  return (
    <aside className="bg-black flex flex-col h-screen sticky top-0 z-50 transition-all duration-500 ease-in-out w-72">
      <div className="p-10 text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="bg-[#FFCC00] p-1.5 rounded-lg shrink-0">
            <Tower className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-black text-[#FFCC00] tracking-tighter uppercase italic">MTN IN</span>
        </div>
        <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Command Hub</p>
      </div>

      <nav className="flex-1 px-6 space-y-2 mt-4 overflow-y-auto">
        {visibleNavItems.map(item => (
          <div key={item.path}>
            <button
              onClick={() => navigate(item.children ? item.children[0].path : item.path)}
              className={`w-full flex items-center px-5 py-4 text-[10px] font-black rounded-xl transition-all group ${
                isActive(item.path, (item as any).exact)
                  ? 'bg-[#FFCC00] text-black shadow-lg shadow-[#FFCC00]/10'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`${isActive(item.path) ? 'text-black' : 'text-gray-500 group-hover:text-[#FFCC00]'} mr-3.5 transition-transform group-hover:scale-110 shrink-0`}>
                {item.icon}
              </span>
              <span className="tracking-widest uppercase leading-none">{item.label}</span>
              {isActive(item.path) && (
                <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
              )}
            </button>

            {item.children && isActive(item.path) && (
              <div className="ml-8 mt-1 space-y-1">
                {item.children.map(child => {
                  const isChildActive = location.pathname === child.path;
                  const isLoading = 'activityKey' in child && activity[child.activityKey as ActivityKey];
                  const hasData   = 'dataKey' in child && activity[child.dataKey as DataKey];

                  return (
                    <button
                      key={child.path}
                      onClick={() => navigate(child.path)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-[9px] font-bold rounded-lg transition-all ${
                        isChildActive
                          ? 'bg-white/10 text-[#FFCC00]'
                          : 'text-gray-500 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>{child.label}</span>

                      {/* Background activity indicators */}
                      <span className="flex items-center gap-1.5 ml-2">
                        {isLoading && !isChildActive && (
                          // Spinning dots = actively loading in background
                          <span
                            title="Loading in background"
                            className="flex gap-0.5"
                          >
                            {[0, 1, 2].map(i => (
                              <span
                                key={i}
                                className="w-1 h-1 bg-[#FFCC00] rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 100}ms` }}
                              />
                            ))}
                          </span>
                        )}
                        {!isLoading && hasData && !isChildActive && (
                          // Solid dot = data loaded, page has content
                          <span
                            title="Data loaded"
                            className="w-1.5 h-1.5 bg-green-500 rounded-full"
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

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