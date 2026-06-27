import { useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './lib/AppContext';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Sidebar, TopBar } from './components/shared/Nav';
import { GlobalSearch, NotificationCenter, PWAInstallBanner, OfflineIndicator, useKeyboardShortcuts } from './components/shared/SmartFeatures';
import AIAssistant from './components/shared/AIAssistant';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Billing from './components/billing/Billing';
import Inventory from './components/inventory/Inventory';
import StockAdjustment from './components/inventory/StockAdjustment';
import Customers from './components/customers/Customers';
import Suppliers from './components/suppliers/Suppliers';
import Purchases from './components/purchases/Purchases';
import Returns from './components/returns/Returns';
import JobCards from './components/jobcards/JobCards';
import Expenses from './components/expenses/Expenses';
import Reports from './components/reports/Reports';
import Analytics from './components/analytics/Analytics';
import Settings from './components/settings/Settings';
import AdminPanel from './components/admin/AdminPanel';
import BarcodeManager from './components/shared/BarcodeManager';

const PAGES = {
  dashboard: Dashboard,
  billing: Billing,
  inventory: Inventory,
  stockadjust: StockAdjustment,
  customers: Customers,
  suppliers: Suppliers,
  purchases: Purchases,
  returns: Returns,
  jobcards: JobCards,
  expenses: Expenses,
  reports: Reports,
  analytics: Analytics,
  settings: Settings,
  admin: AdminPanel,
  barcodes: BarcodeManager,
};

function AppShell() {
  const { user, loading, subscriptionStatus } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  useKeyboardShortcuts(setPage, openSearch);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-500 text-sm">Loading AutoSpares Pro...</p>
      </div>
    </div>
  );

  if (!user) return <Login/>;

  const subStatus = subscriptionStatus();
  if (!subStatus.valid && user.role !== 'owner') return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">⏰</div>
        <h2 className="text-white font-bold text-xl mb-2">Subscription Expired</h2>
        <p className="text-gray-400 text-sm">Please contact the shop owner to renew.</p>
      </div>
    </div>
  );

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <OfflineIndicator/>
      <Sidebar page={page} setPage={setPage} open={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar page={page} onMenuClick={() => setSidebarOpen(true)} onSearchOpen={() => setSearchOpen(true)} onNotifOpen={() => setNotifOpen(true)} onAIOpen={() => setAiOpen(true)}/>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <PageComponent setPage={setPage}/>
        </main>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} setPage={setPage}/>
      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)}/>
      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)}/>
      <PWAInstallBanner/>
      <Toaster position="top-right" toastOptions={{
        style:{background:'#111827',color:'#fff',border:'1px solid #374151',fontSize:13},
        success:{iconTheme:{primary:'#22c55e',secondary:'#fff'}},
        error:{iconTheme:{primary:'#ef4444',secondary:'#fff'}},
      }}/>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppShell/>
      </AppProvider>
    </AuthProvider>
  );
}
