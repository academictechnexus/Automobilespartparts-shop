import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck,
  BarChart2, Settings, Car, Bell, Menu, X,
  Wrench, CreditCard, Receipt, Shield, QrCode,
  Sparkles, LogOut, ArrowLeftRight, RefreshCw, TrendingUp
} from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { getShopConfig } from '../../lib/shopConfig';
import { useAuth } from '../../lib/AuthContext';

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { key: 'dashboard',   icon: LayoutDashboard, label: 'dashboard' },
      { key: 'billing',     icon: ShoppingCart,    label: 'billing' },
      { key: 'purchases',   icon: Receipt,         label: 'purchases' },
      { key: 'returns',     icon: RefreshCw,       label: 'Returns', noTranslate: true },
    ]
  },
  {
    label: 'Inventory',
    items: [
      { key: 'inventory',   icon: Package,         label: 'inventory' },
      { key: 'stockadjust', icon: ArrowLeftRight,  label: 'Stock Adjust', noTranslate: true },
      { key: 'barcodes',    icon: QrCode,          label: 'Barcodes', noTranslate: true },
    ]
  },
  {
    label: 'Parties',
    items: [
      { key: 'customers',   icon: Users,           label: 'customers' },
      { key: 'suppliers',   icon: Truck,           label: 'suppliers' },
      ...(_shopCfg.showJobCards !== false ? [{ key: 'jobcards', icon: Wrench, label: 'jobCards' }] : []),
    ]
  },
  {
    label: 'Finance',
    items: [
      { key: 'expenses',    icon: CreditCard,      label: 'expenses' },
      { key: 'reports',     icon: BarChart2,       label: 'reports' },
      { key: 'analytics',   icon: TrendingUp,      label: 'Analytics', noTranslate: true },
    ]
  },
  {
    label: 'System',
    items: [
      { key: 'admin',       icon: Shield,          label: 'Admin', noTranslate: true, ownerOnly: true },
      { key: 'settings',    icon: Settings,        label: 'settings' },
    ]
  },
];

export const Sidebar = ({ page, setPage, open, onClose }) => {
  const { t, stats } = useApp();
  const { user, logout, subscriptionStatus, can } = useAuth();
  const _shopCfg = getShopConfig();
  const status = subscriptionStatus();

  const allItems = NAV_GROUPS.flatMap(g => g.items);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose}/>}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col w-56 bg-gray-900 border-r border-gray-800 transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${open ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-800">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Car size={16} className="text-white"/>
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm">AutoSpares Pro</div>
            <div className="text-gray-500 text-xs">GST Billing & ERP</div>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-gray-500 hover:text-white"><X size={16}/></button>
        </div>

        {/* Trial banner */}
        {status.isTrial && status.valid && (
          <div className={`mx-3 mt-2 px-2.5 py-1.5 rounded-lg border text-center ${status.daysLeft <= 7 ? 'bg-red-500/10 border-red-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
            <p className={`text-xs font-semibold ${status.daysLeft <= 7 ? 'text-red-400' : 'text-orange-400'}`}>
              {status.daysLeft} days trial left
            </p>
          </div>
        )}

        {/* Nav groups */}
        <nav className="flex-1 px-2 py-2 overflow-y-auto">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-2">
              <p className="text-gray-600 text-xs font-semibold px-3 py-1.5 uppercase tracking-wider">{group.label}</p>
              {group.items.filter(item => !item.ownerOnly || can('admin.view')).map(item => {
                const isActive = page === item.key;
                const badge = item.key === 'inventory' && stats.lowStockCount > 0 ? stats.lowStockCount : null;
                const label = item.noTranslate ? item.label : (t[item.label] || item.label);
                return (
                  <button key={item.key} onClick={() => { setPage(item.key); onClose(); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all group mb-0.5 ${isActive ? 'bg-orange-500/15 text-orange-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                    <item.icon size={15} className={isActive ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-300'}/>
                    <span className="flex-1 text-left text-sm">{label}</span>
                    {badge && <span className="w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{badge}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-gray-800">
          {user && (
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-orange-400 text-xs font-bold">{user.avatar || user.name?.charAt(0)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-white text-xs font-medium truncate">{user.name}</div>
                <div className="text-gray-500 text-xs capitalize">{user.role}</div>
              </div>
              <button onClick={logout} className="text-gray-600 hover:text-red-400 transition-colors" title="Logout">
                <LogOut size={14}/>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export const TopBar = ({ page, onMenuClick, onSearchOpen, onNotifOpen, onAIOpen }) => {
  const { t, stats } = useApp();
  const { user } = useAuth();
  const allItems = NAV_GROUPS.flatMap(g => g.items);
  const NAV_ITEM = allItems.find(n => n.key === page);
  const pageLabel = NAV_ITEM?.noTranslate ? NAV_ITEM.label : (t[NAV_ITEM?.label] || page);

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
      <button onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-white transition-colors p-1"><Menu size={20}/></button>
      <span className="text-white font-semibold text-sm lg:hidden">{pageLabel}</span>
      <div className="hidden lg:block text-gray-500 text-sm">
        {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Global Search */}
        <button onClick={onSearchOpen}
          className="hidden sm:flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-1.5 rounded-lg text-xs transition-colors">
          <span>Search</span>
          <kbd className="bg-gray-700 px-1 rounded text-gray-500" style={{fontSize:9}}>⌘K</kbd>
        </button>

        {/* AI */}
        <button onClick={onAIOpen}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition-colors text-xs font-semibold border border-orange-500/20">
          <Sparkles size={13}/><span className="hidden sm:block">AI</span>
        </button>

        {/* Notifications */}
        <button onClick={onNotifOpen} className="relative p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white transition-colors">
          <Bell size={17}/>
          {(stats.lowStockCount + stats.outOfStockCount) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white rounded-full flex items-center justify-center" style={{fontSize:8}}>
              {stats.lowStockCount + stats.outOfStockCount}
            </span>
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-2.5 py-1.5">
          <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
            <span className="text-orange-400 font-bold" style={{fontSize:9}}>{user?.avatar || user?.name?.charAt(0) || 'A'}</span>
          </div>
          <span className="text-gray-300 text-xs hidden sm:block">{user?.name || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
};

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────────────────────
export const MobileBottomNav = ({ page, setPage }) => {
  const { t, stats } = useApp();
  const quickLinks = [
    { key: 'dashboard',  icon: LayoutDashboard, label: 'Home' },
    { key: 'billing',    icon: ShoppingCart,    label: 'Bill' },
    { key: 'inventory',  icon: Package,         label: 'Stock' },
    { key: 'reports',    icon: BarChart2,       label: 'Reports' },
    { key: 'settings',   icon: Settings,        label: 'More' },
  ];
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-30 pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {quickLinks.map(item => {
          const isActive = page === item.key;
          const badge = item.key === 'inventory' && stats.lowStockCount > 0;
          return (
            <button key={item.key} onClick={() => setPage(item.key)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors relative ${isActive ? 'text-orange-400' : 'text-gray-500'}`}>
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8}/>
              <span className="text-xs font-medium">{item.label}</span>
              {badge && <span className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full"/>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
