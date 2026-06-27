import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck,
  BarChart2, Settings, Car, Bell, Menu, X,
  FileText, Wrench, CreditCard, Receipt, ChevronDown
} from 'lucide-react';
import { useApp } from '../../lib/AppContext';

const NAV_ITEMS = [
  { key: 'dashboard',  icon: LayoutDashboard, label: 'dashboard' },
  { key: 'billing',    icon: ShoppingCart,    label: 'billing' },
  { key: 'purchases',  icon: Receipt,         label: 'purchases' },
  { key: 'inventory',  icon: Package,         label: 'inventory' },
  { key: 'customers',  icon: Users,           label: 'customers' },
  { key: 'suppliers',  icon: Truck,           label: 'suppliers' },
  { key: 'jobcards',   icon: Wrench,          label: 'jobCards' },
  { key: 'expenses',   icon: CreditCard,      label: 'expenses' },
  { key: 'reports',    icon: BarChart2,       label: 'reports' },
  { key: 'settings',   icon: Settings,        label: 'settings' },
];

export const Sidebar = ({ page, setPage, open, onClose }) => {
  const { t, stats, shop, demoMode } = useApp();

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed inset-y-0 left-0 z-40 flex flex-col
        w-56 bg-gray-900 border-r border-gray-800
        transition-transform duration-200
        lg:translate-x-0 lg:static lg:z-auto
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-800">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Car size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm truncate">{t.appName}</div>
            <div className="text-gray-500 text-xs">{t.tagline}</div>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-gray-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Demo banner */}
        {demoMode && (
          <div className="mx-3 mt-2 px-2.5 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-orange-400 text-xs">Demo Mode — Connect Supabase in Settings</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = page === item.key;
            const badge = item.key === 'inventory' && stats.lowStockCount > 0 ? stats.lowStockCount : null;
            return (
              <button key={item.key}
                onClick={() => { setPage(item.key); onClose(); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive ? 'bg-orange-500/15 text-orange-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                <item.icon size={16} className={isActive ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-300'} />
                <span className="flex-1 text-left">{t[item.label]}</span>
                {badge && (
                  <span className="w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
                {isActive && <div className="w-1 h-1 rounded-full bg-orange-400" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-orange-400 text-xs font-bold">
                {shop.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white text-xs font-medium truncate">{shop.name || 'Shop'}</div>
              <div className="text-gray-500 text-xs">Admin</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export const TopBar = ({ page, onMenuClick }) => {
  const { t, stats, demoMode } = useApp();
  const pageLabel = t[NAV_ITEMS.find(n => n.key === page)?.label] || page;

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
      <button onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-white transition-colors p-1">
        <Menu size={20} />
      </button>
      <span className="text-white font-semibold text-sm lg:hidden">{pageLabel}</span>

      <div className="hidden lg:block text-gray-400 text-sm">
        {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Low stock alert bell */}
        {stats.lowStockCount > 0 && (
          <div className="relative">
            <Bell size={17} className="text-gray-400 hover:text-white cursor-pointer" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white rounded-full flex items-center justify-center" style={{ fontSize: 8 }}>
              {stats.lowStockCount}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-2.5 py-1.5">
          <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
            <span className="text-orange-400 font-bold" style={{ fontSize: 9 }}>A</span>
          </div>
          <span className="text-gray-300 text-xs hidden sm:block">Admin</span>
        </div>
      </div>
    </header>
  );
};
