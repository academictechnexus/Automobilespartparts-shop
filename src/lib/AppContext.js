import { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_PARTS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_INVOICES, MOCK_PURCHASES, MOCK_JOB_CARDS, MOCK_EXPENSES } from './mockData';
import { useTranslation } from '../translations';
import { useAuth } from './AuthContext';
import { auditLog, softDelete } from './db';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user, tenant } = useAuth();
  const tenantId = tenant?.id || 't1';

  const [lang, setLang]   = useState(localStorage.getItem('lang') || 'en');
  const [demoMode, setDemoMode] = useState(true); // ← RESTORED

  const defaultShop = {
    name:'My Auto Spares', address:'123 Main Road', phone:'9876543210',
    email:'', gstin:'', pan:'', bank_name:'', bank_account:'', ifsc_code:'',
    upi_id:'', invoice_prefix:'INV', purchase_prefix:'PUR', job_prefix:'JOB',
    state:'Tamil Nadu', state_code:'33', invoice_counter:6,
    purchase_counter:3, job_counter:3,
  };

  const [shop, setShopState] = useState(() => {
    try {
      const s = localStorage.getItem(`shop_${tenantId}`);
      return s ? { ...defaultShop, ...JSON.parse(s) } : defaultShop;
    } catch { return defaultShop; }
  });

  const load = (key, fallback) => {
    try {
      const d = localStorage.getItem(`${key}_${tenantId}`);
      return d ? JSON.parse(d) : fallback;
    } catch { return fallback; }
  };
  const save = (key, data) => {
    try { localStorage.setItem(`${key}_${tenantId}`, JSON.stringify(data)); } catch {}
  };

  const [parts,     setParts]     = useState(() => load('parts', MOCK_PARTS));
  const [customers, setCustomers] = useState(() => load('customers', MOCK_CUSTOMERS));
  const [suppliers, setSuppliers] = useState(() => load('suppliers', MOCK_SUPPLIERS));
  const [invoices,  setInvoices]  = useState(() => load('invoices', MOCK_INVOICES));
  const [purchases, setPurchases] = useState(() => load('purchases', MOCK_PURCHASES));
  const [jobCards,  setJobCards]  = useState(() => load('jobcards', MOCK_JOB_CARDS));
  const [expenses,  setExpenses]  = useState(() => load('expenses', MOCK_EXPENSES));
  const [returns,   setReturns]   = useState(() => load('returns', []));
  const [payments,  setPayments]  = useState(() => load('payments', []));

  const t = useTranslation(lang);

  const saveLang = (l) => { setLang(l); localStorage.setItem('lang', l); };
  const saveShop = (s) => {
    const merged = { ...defaultShop, ...s };
    setShopState(merged);
    save(`shop`, merged);
  };

  // Persist on every change
  useEffect(() => { save('parts',     parts);     }, [parts,     tenantId]);
  useEffect(() => { save('customers', customers); }, [customers, tenantId]);
  useEffect(() => { save('suppliers', suppliers); }, [suppliers, tenantId]);
  useEffect(() => { save('invoices',  invoices);  }, [invoices,  tenantId]);
  useEffect(() => { save('purchases', purchases); }, [purchases, tenantId]);
  useEffect(() => { save('jobcards',  jobCards);  }, [jobCards,  tenantId]);
  useEffect(() => { save('expenses',  expenses);  }, [expenses,  tenantId]);
  useEffect(() => { save('returns',   returns);   }, [returns,   tenantId]);
  useEffect(() => { save('payments',  payments);  }, [payments,  tenantId]);

  // ── NUMBER GENERATORS ────────────────────────────────────────────────────
  const nextInvoiceNo = () => {
    const counter = shop.invoice_counter || 1;
    const no = `${shop.invoice_prefix || 'INV'}-${new Date().getFullYear()}-${String(counter).padStart(4,'0')}`;
    saveShop({ ...shop, invoice_counter: counter + 1 });
    return no;
  };
  const nextPurchaseNo = () => {
    const counter = shop.purchase_counter || 1;
    const no = `${shop.purchase_prefix || 'PUR'}-${new Date().getFullYear()}-${String(counter).padStart(4,'0')}`;
    saveShop({ ...shop, purchase_counter: counter + 1 });
    return no;
  };
  const nextJobNo = () => {
    const counter = shop.job_counter || 1;
    const no = `${shop.job_prefix || 'JOB'}-${String(counter).padStart(4,'0')}`;
    saveShop({ ...shop, job_counter: counter + 1 });
    return no;
  };
  const nextReturnNo = () => {
    const k = `return_counter_${tenantId}`;
    const c = parseInt(localStorage.getItem(k) || '1');
    localStorage.setItem(k, String(c + 1));
    return `RET-${new Date().getFullYear()}-${String(c).padStart(4,'0')}`;
  };

  // ── DUPLICATE DETECTION ──────────────────────────────────────────────────
  const detectDuplicates = () => {
    const dupes = { invoices:[], customers:[], suppliers:[], parts:[] };
    invoices.forEach((inv,i) => invoices.slice(i+1).forEach(inv2 => {
      if (inv.customer_name===inv2.customer_name && inv.grand_total===inv2.grand_total && inv.invoice_date===inv2.invoice_date)
        dupes.invoices.push({ a:inv.invoice_no, b:inv2.invoice_no, reason:'Same customer, amount & date' });
    }));
    customers.forEach((c,i) => customers.slice(i+1).forEach(c2 => {
      if (c.phone && c.phone===c2.phone) dupes.customers.push({ a:c.name, b:c2.name, reason:`Same phone: ${c.phone}` });
      if (c.gst_no && c.gst_no===c2.gst_no) dupes.customers.push({ a:c.name, b:c2.name, reason:`Same GST: ${c.gst_no}` });
    }));
    suppliers.forEach((s,i) => suppliers.slice(i+1).forEach(s2 => {
      if (s.phone && s.phone===s2.phone) dupes.suppliers.push({ a:s.name, b:s2.name, reason:`Same phone: ${s.phone}` });
    }));
    parts.forEach((p,i) => parts.slice(i+1).forEach(p2 => {
      if (p.code===p2.code) dupes.parts.push({ a:p.name, b:p2.name, reason:`Duplicate code: ${p.code}` });
    }));
    return dupes;
  };

  // ── REORDER SUGGESTIONS ──────────────────────────────────────────────────
  const getReorderSuggestions = () => {
    const days90 = new Date(Date.now()-90*24*60*60*1000).toISOString().split('T')[0];
    return parts.filter(p => p.stock <= p.reorder_level).map(part => {
      let qtySold = 0;
      invoices.filter(i => i.invoice_date >= days90).forEach(inv =>
        (inv.items||[]).filter(item => item.part_id===part.id).forEach(item => { qtySold += item.qty; })
      );
      const avgMonthly = qtySold / 3;
      const suggestedQty = Math.max(Math.ceil(avgMonthly * 2), part.reorder_level * 2);
      return { ...part, avg_monthly: Math.round(avgMonthly*10)/10, suggested_reorder: suggestedQty, urgency: part.stock===0?'critical':'high' };
    });
  };

  // ── STOCK AGEING ─────────────────────────────────────────────────────────
  const getStockAgeing = () => {
    const now = new Date();
    return parts.filter(p => p.stock > 0).map(part => {
      let lastSaleDate = null;
      invoices.forEach(inv => {
        if ((inv.items||[]).some(item => item.part_id===part.id))
          if (!lastSaleDate || inv.invoice_date > lastSaleDate) lastSaleDate = inv.invoice_date;
      });
      const daysSinceSale = lastSaleDate ? Math.floor((now - new Date(lastSaleDate))/(1000*60*60*24)) : 999;
      const bucket = daysSinceSale<30?'active':daysSinceSale<90?'30-90d':daysSinceSale<180?'90-180d':daysSinceSale<365?'180-365d':'dead';
      return { ...part, days_since_sale:daysSinceSale, last_sale:lastSaleDate, ageing_bucket:bucket, stock_value:part.purchase_price*part.stock };
    });
  };

  // ── ANALYTICS ────────────────────────────────────────────────────────────
  const getAnalytics = () => {
    const partMap={}, custMap={}, brandMap={}, makeMap={};
    invoices.forEach(inv => {
      if (!custMap[inv.customer_name]) custMap[inv.customer_name]={name:inv.customer_name,orders:0,revenue:0};
      custMap[inv.customer_name].orders++;
      custMap[inv.customer_name].revenue+=inv.grand_total;
      (inv.items||[]).forEach(item => {
        if (!partMap[item.part_name]) partMap[item.part_name]={name:item.part_name,qty:0,revenue:0};
        partMap[item.part_name].qty+=item.qty;
        partMap[item.part_name].revenue+=(item.total_amt||item.qty*item.rate);
        const part=parts.find(p=>p.id===item.part_id);
        const brand=part?.brand||'Unknown'; brandMap[brand]=(brandMap[brand]||0)+(item.total_amt||item.qty*item.rate);
        const make=part?.make||'Universal'; makeMap[make]=(makeMap[make]||0)+item.qty;
      });
    });
    const months=[];
    for (let i=5;i>=0;i--) {
      const d=new Date(); d.setMonth(d.getMonth()-i);
      const ym=d.toISOString().slice(0,7);
      const label=d.toLocaleDateString('en-IN',{month:'short'});
      const s=invoices.filter(x=>x.invoice_date?.startsWith(ym)).reduce((acc,x)=>acc+x.grand_total,0);
      const p=purchases.filter(x=>x.purchase_date?.startsWith(ym)).reduce((acc,x)=>acc+x.grand_total,0);
      const e=expenses.filter(x=>x.date?.startsWith(ym)).reduce((acc,x)=>acc+x.amount,0);
      months.push({month:label,sales:s,purchase:p,profit:s-p-e,expense:e});
    }
    const creditRisk=customers.map(c=>{
      const custInvs=invoices.filter(i=>i.customer_id===c.id);
      const totalDue=custInvs.filter(i=>i.status!=='paid').reduce((s,i)=>s+i.balance_due,0);
      const overdueCount=custInvs.filter(i=>i.status!=='paid'&&i.due_date&&new Date(i.due_date)<new Date()).length;
      const score=Math.max(0,100-overdueCount*20-(totalDue>c.credit_limit?30:0));
      return {...c,total_due:totalDue,overdue_count:overdueCount,risk_score:score,risk:score>=80?'low':score>=50?'medium':'high'};
    }).filter(c=>c.total_due>0);
    return {
      topParts:Object.values(partMap).sort((a,b)=>b.revenue-a.revenue).slice(0,10),
      topCustomers:Object.values(custMap).sort((a,b)=>b.revenue-a.revenue).slice(0,10),
      topBrands:Object.entries(brandMap).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,revenue])=>({name,revenue})),
      topVehicles:Object.entries(makeMap).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,count])=>({name,count})),
      monthlyTrends:months, creditRisk,
    };
  };

  // ── HEALTH SCORE ─────────────────────────────────────────────────────────
  const getHealthScore = () => {
    if (!invoices.length) return {score:50,grade:'C',details:[]};
    const collectionRate=invoices.filter(i=>i.status==='paid').length/invoices.length*100;
    const stockHealth=parts.length>0?(1-parts.filter(p=>p.stock<=p.reorder_level).length/parts.length)*100:100;
    const sales=invoices.reduce((s,i)=>s+i.grand_total,0);
    const cost=purchases.reduce((s,p)=>s+p.grand_total,0);
    const profitMargin=sales>0?((sales-cost)/sales)*100:0;
    const outstanding=sales>0?(invoices.filter(i=>i.status!=='paid').reduce((s,i)=>s+i.balance_due,0)/sales)*100:0;
    const score=Math.round(collectionRate*0.30+stockHealth*0.25+Math.min(profitMargin*2,100)*0.25+Math.max(0,100-outstanding*2)*0.20);
    const grade=score>=85?'A+':score>=75?'A':score>=65?'B':score>=50?'C':'D';
    return {score,grade,details:[
      {label:'Payment Collection',value:collectionRate.toFixed(1)+'%',color:collectionRate>80?'text-green-400':'text-yellow-400'},
      {label:'Stock Health',value:stockHealth.toFixed(1)+'%',color:stockHealth>70?'text-green-400':'text-red-400'},
      {label:'Profit Margin',value:profitMargin.toFixed(1)+'%',color:profitMargin>20?'text-green-400':'text-yellow-400'},
      {label:'Outstanding',value:outstanding.toFixed(1)+'%',color:outstanding<20?'text-green-400':'text-red-400'},
    ]};
  };

  // ── CRUD: PARTS ──────────────────────────────────────────────────────────
  const upsertPart = (part) => {
    const id = part.id || `p_${Date.now()}`;
    setParts(prev => {
      const ex = prev.find(p => p.id === part.id);
      if (ex) { auditLog('UPDATE','parts',id,ex,part); return prev.map(p => p.id===part.id ? {...p,...part} : p); }
      auditLog('CREATE','parts',id,null,part);
      return [{...part,id},...prev];
    });
  };
  const deletePart = (id) => {
    const item = parts.find(p=>p.id===id);
    if (item) softDelete('parts',item);
    setParts(prev=>prev.filter(p=>p.id!==id));
  };

  // ── CRUD: CUSTOMERS ──────────────────────────────────────────────────────
  const upsertCustomer = (cust) => {
    const id = cust.id || `c_${Date.now()}`;
    setCustomers(prev => {
      const ex = prev.find(c=>c.id===cust.id);
      if (ex) { auditLog('UPDATE','customers',id,ex,cust); return prev.map(c=>c.id===cust.id?{...c,...cust}:c); }
      auditLog('CREATE','customers',id,null,cust);
      return [...prev,{...cust,id}];
    });
  };
  const deleteCustomer = (id) => {
    const item = customers.find(c=>c.id===id);
    if (item) softDelete('customers',item);
    setCustomers(prev=>prev.filter(c=>c.id!==id));
  };

  // ── CRUD: SUPPLIERS ──────────────────────────────────────────────────────
  const upsertSupplier = (sup) => {
    const id = sup.id || `s_${Date.now()}`;
    setSuppliers(prev => {
      const ex = prev.find(s=>s.id===sup.id);
      if (ex) { auditLog('UPDATE','suppliers',id,ex,sup); return prev.map(s=>s.id===sup.id?{...s,...sup}:s); }
      auditLog('CREATE','suppliers',id,null,sup);
      return [...prev,{...sup,id}];
    });
  };
  const deleteSupplier = (id) => {
    const item = suppliers.find(s=>s.id===id);
    if (item) softDelete('suppliers',item);
    setSuppliers(prev=>prev.filter(s=>s.id!==id));
  };

  // ── CRUD: INVOICES ───────────────────────────────────────────────────────
  const addInvoice = (inv) => {
    auditLog('CREATE','invoices',inv.id,null,{invoice_no:inv.invoice_no,total:inv.grand_total});
    (inv.items||[]).forEach(item => {
      if (item.part_id) setParts(prev=>prev.map(p=>p.id===item.part_id?{...p,stock:Math.max(0,p.stock-item.qty)}:p));
    });
    setInvoices(prev=>[{...inv,tenant_id:tenantId},...prev]);
  };
  const updateInvoice = (id,updates) => {
    auditLog('UPDATE','invoices',id,null,updates);
    setInvoices(prev=>prev.map(i=>i.id===id?{...i,...updates}:i));
  };
  const cancelInvoice = (id,reason) => {
    auditLog('UPDATE','invoices',id,null,{action:'cancel',reason});
    const inv = invoices.find(i=>i.id===id);
    (inv?.items||[]).forEach(item => {
      if (item.part_id) setParts(prev=>prev.map(p=>p.id===item.part_id?{...p,stock:p.stock+item.qty}:p));
    });
    setInvoices(prev=>prev.map(i=>i.id===id?{...i,is_cancelled:true,cancel_reason:reason,status:'cancelled'}:i));
  };

  // ── CRUD: PURCHASES ──────────────────────────────────────────────────────
  const addPurchase = (pur) => {
    auditLog('CREATE','purchases',pur.id,null,{purchase_no:pur.purchase_no,total:pur.grand_total});
    (pur.items||[]).forEach(item => {
      if (item.part_id) setParts(prev=>prev.map(p=>p.id===item.part_id?{...p,stock:p.stock+item.qty}:p));
    });
    setPurchases(prev=>[{...pur,tenant_id:tenantId},...prev]);
  };

  // ── CRUD: RETURNS ────────────────────────────────────────────────────────
  const addReturn = (ret) => {
    const id = `ret_${Date.now()}`;
    const returnNo = nextReturnNo();
    auditLog('CREATE','returns',id,null,ret);
    (ret.items||[]).forEach(item => {
      if (item.part_id) setParts(prev=>prev.map(p=>p.id===item.part_id?{
        ...p,stock:ret.return_type==='sales_return'?p.stock+item.qty:Math.max(0,p.stock-item.qty)
      }:p));
    });
    setReturns(prev=>[{...ret,id,tenant_id:tenantId,return_no:returnNo},...prev]);
  };

  // ── CRUD: JOB CARDS ──────────────────────────────────────────────────────
  const upsertJobCard = (job) => {
    const id = job.id || `job_${Date.now()}`;
    setJobCards(prev => {
      const ex = prev.find(j=>j.id===job.id);
      if (ex) return prev.map(j=>j.id===job.id?{...j,...job}:j);
      return [{...job,id,tenant_id:tenantId},...prev];
    });
  };

  // ── CRUD: EXPENSES ───────────────────────────────────────────────────────
  const addExpense = (exp) => {
    const id = `exp_${Date.now()}`;
    auditLog('CREATE','expenses',id,null,exp);
    setExpenses(prev=>[{...exp,id,tenant_id:tenantId},...prev]);
  };

  // ── CLEAR DEMO DATA ──────────────────────────────────────────────────────
  const clearDemoData = () => {
    setParts([]);
    setCustomers([]);
    setSuppliers([]);
    setInvoices([]);
    setPurchases([]);
    setJobCards([]);
    setExpenses([]);
    setReturns([]);
    setPayments([]);
    saveShop({ ...defaultShop });
  };

  // ── STATS ────────────────────────────────────────────────────────────────
  const stats = {
    todaySales: invoices.filter(i=>i.invoice_date===new Date().toISOString().split('T')[0]).reduce((s,i)=>s+i.grand_total,0),
    monthSales: invoices.reduce((s,i)=>s+i.grand_total,0),
    totalStock: parts.reduce((s,p)=>s+p.stock,0),
    lowStockCount: parts.filter(p=>p.stock<=p.reorder_level).length,
    outOfStockCount: parts.filter(p=>p.stock===0).length,
    pendingAmount: invoices.filter(i=>i.status!=='paid'&&!i.is_cancelled).reduce((s,i)=>s+i.balance_due,0),
    stockValue: parts.reduce((s,p)=>s+p.purchase_price*p.stock,0),
    totalCustomers: customers.length,
    totalSuppliers: suppliers.length,
    totalReturns: returns.length,
  };

  return (
    <AppContext.Provider value={{
      lang, setLang:saveLang, t,
      shop, setShop:saveShop,
      demoMode, setDemoMode,       // ← RESTORED
      tenantId,
      parts,     upsertPart,    deletePart,
      customers, upsertCustomer,deleteCustomer,
      suppliers, upsertSupplier,deleteSupplier,
      invoices,  addInvoice,    updateInvoice, cancelInvoice,
      purchases, addPurchase,
      returns,   addReturn,
      jobCards,  upsertJobCard,
      expenses,  addExpense,
      payments,  setPayments,
      nextInvoiceNo, nextPurchaseNo, nextJobNo, nextReturnNo,
      stats, clearDemoData,
      detectDuplicates, getReorderSuggestions, getStockAgeing,
      getAnalytics, getHealthScore,
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
