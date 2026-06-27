import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './lib/AppContext';
import { Sidebar, TopBar } from './components/shared/Nav';
import Dashboard from './components/dashboard/Dashboard';
import Billing from './components/billing/Billing';
import Inventory from './components/inventory/Inventory';
import Customers from './components/customers/Customers';
import Suppliers from './components/suppliers/Suppliers';
import Purchases from './components/purchases/Purchases';
import JobCards from './components/jobcards/JobCards';
import Expenses from './components/expenses/Expenses';
import Reports from './components/reports/Reports';
import Settings from './components/settings/Settings';

const PAGES = {
  dashboard: Dashboard,
  billing: Billing,
  inventory: Inventory,
  customers: Customers,
  suppliers: Suppliers,
  purchases: Purchases,
  jobcards: JobCards,
  expenses: Expenses,
  reports: Reports,
  settings: Settings,
};

function AppShell() {
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const PageComponent = PAGES[page] || Dashboard;

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar page={page} setPage={setPage} open={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar page={page} onMenuClick={() => setSidebarOpen(true)}/>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <PageComponent setPage={setPage}/>
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#111827', color: '#fff', border: '1px solid #374151', fontSize: 13 },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
