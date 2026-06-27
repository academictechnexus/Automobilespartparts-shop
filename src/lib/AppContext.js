import { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_PARTS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_INVOICES, MOCK_PURCHASES, MOCK_JOB_CARDS, MOCK_EXPENSES } from '../lib/mockData';
import { useTranslation } from '../translations';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [demoMode, setDemoMode] = useState(true);
  const [shop, setShop] = useState(() => {
    const saved = localStorage.getItem('shop');
    return saved ? JSON.parse(saved) : {
      name: 'My Auto Spares', address: '123 Main Road, City - 600001',
      phone: '9876543210', email: '', gstin: '', pan: '',
      bank_name: '', bank_account: '', ifsc_code: '',
      invoice_prefix: 'INV', purchase_prefix: 'PUR', job_prefix: 'JOB',
      state: 'Tamil Nadu', state_code: '33', financial_year: '2024-25',
      invoice_counter: 6, purchase_counter: 3, job_counter: 3,
    };
  });

  // Data stores
  const [parts, setParts] = useState(MOCK_PARTS);
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [suppliers, setSuppliers] = useState(MOCK_SUPPLIERS);
  const [invoices, setInvoices] = useState(MOCK_INVOICES);
  const [purchases, setPurchases] = useState(MOCK_PURCHASES);
  const [jobCards, setJobCards] = useState(MOCK_JOB_CARDS);
  const [expenses, setExpenses] = useState(MOCK_EXPENSES);

  const t = useTranslation(lang);

  const saveLang = (l) => { setLang(l); localStorage.setItem('lang', l); };
  const saveShop = (s) => { setShop(s); localStorage.setItem('shop', JSON.stringify(s)); };

  // Invoice number generator
  const nextInvoiceNo = () => {
    const no = `${shop.invoice_prefix}-${new Date().getFullYear()}-${String(shop.invoice_counter).padStart(4, '0')}`;
    saveShop({ ...shop, invoice_counter: shop.invoice_counter + 1 });
    return no;
  };
  const nextPurchaseNo = () => {
    const no = `${shop.purchase_prefix}-${new Date().getFullYear()}-${String(shop.purchase_counter).padStart(4, '0')}`;
    saveShop({ ...shop, purchase_counter: shop.purchase_counter + 1 });
    return no;
  };
  const nextJobNo = () => {
    const no = `${shop.job_prefix}-${String(shop.job_counter).padStart(4, '0')}`;
    saveShop({ ...shop, job_counter: shop.job_counter + 1 });
    return no;
  };

  // CRUD helpers
  const addInvoice = (inv) => setInvoices(p => [inv, ...p]);
  const updateInvoice = (id, updates) => setInvoices(p => p.map(i => i.id === id ? { ...i, ...updates } : i));
  const deleteInvoice = (id) => setInvoices(p => p.filter(i => i.id !== id));

  const addPurchase = (pur) => {
    setPurchases(p => [pur, ...p]);
    // Update stock for each item
    pur.items?.forEach(item => {
      setParts(prev => prev.map(p => p.id === item.part_id ? { ...p, stock: p.stock + item.qty } : p));
    });
  };

  const upsertPart = (part) => {
    if (part.id && parts.find(p => p.id === part.id)) {
      setParts(prev => prev.map(p => p.id === part.id ? { ...p, ...part } : p));
    } else {
      setParts(prev => [{ ...part, id: `p_${Date.now()}` }, ...prev]);
    }
  };

  const upsertCustomer = (cust) => {
    if (cust.id && customers.find(c => c.id === cust.id)) {
      setCustomers(prev => prev.map(c => c.id === cust.id ? { ...c, ...cust } : c));
    } else {
      setCustomers(prev => [...prev, { ...cust, id: `c_${Date.now()}` }]);
    }
  };

  const upsertSupplier = (sup) => {
    if (sup.id && suppliers.find(s => s.id === sup.id)) {
      setSuppliers(prev => prev.map(s => s.id === sup.id ? { ...s, ...sup } : s));
    } else {
      setSuppliers(prev => [...prev, { ...sup, id: `s_${Date.now()}` }]);
    }
  };

  const upsertJobCard = (job) => {
    if (job.id && jobCards.find(j => j.id === job.id)) {
      setJobCards(prev => prev.map(j => j.id === job.id ? { ...j, ...job } : j));
    } else {
      setJobCards(prev => [{ ...job, id: `job_${Date.now()}` }, ...prev]);
    }
  };

  const addExpense = (exp) => setExpenses(prev => [{ ...exp, id: `exp_${Date.now()}` }, ...prev]);

  // Stats for dashboard
  const stats = {
    todaySales: invoices.filter(i => i.invoice_date === new Date().toISOString().split('T')[0]).reduce((s, i) => s + i.grand_total, 0),
    monthSales: invoices.reduce((s, i) => s + i.grand_total, 0),
    totalStock: parts.reduce((s, p) => s + p.stock, 0),
    lowStockCount: parts.filter(p => p.stock <= p.reorder_level).length,
    outOfStockCount: parts.filter(p => p.stock === 0).length,
    pendingAmount: invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.balance_due, 0),
    stockValue: parts.reduce((s, p) => s + p.purchase_price * p.stock, 0),
    totalCustomers: customers.length,
    totalSuppliers: suppliers.length,
  };

  return (
    <AppContext.Provider value={{
      lang, setLang: saveLang, t, demoMode, setDemoMode,
      shop, setShop: saveShop,
      parts, setParts, upsertPart, deletePart: (id) => setParts(p => p.filter(x => x.id !== id)),
      customers, setCustomers, upsertCustomer, deleteCustomer: (id) => setCustomers(p => p.filter(x => x.id !== id)),
      suppliers, setSuppliers, upsertSupplier, deleteSupplier: (id) => setSuppliers(p => p.filter(x => x.id !== id)),
      invoices, addInvoice, updateInvoice, deleteInvoice,
      purchases, addPurchase,
      jobCards, upsertJobCard,
      expenses, addExpense,
      nextInvoiceNo, nextPurchaseNo, nextJobNo,
      stats,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
