import { useState } from 'react';
import { Download, FileText, BarChart2, Package, TrendingUp, Calendar, Users } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { Btn, PageHeader, Field, Input, Select } from '../shared/UI';
import { fmt, fmtDate, exportToExcel, exportGSTR1, exportTally } from '../../utils/helpers';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MONTHLY_CHART } from '../../lib/mockData';

const REPORTS = [
  { key: 'sales', label: 'Sales Report', icon: BarChart2, color: 'text-orange-400' },
  { key: 'purchase', label: 'Purchase Report', icon: FileText, color: 'text-blue-400' },
  { key: 'gst', label: 'GST Report (GSTR-1)', icon: FileText, color: 'text-green-400' },
  { key: 'gstr3b', label: 'GSTR-3B Summary', icon: FileText, color: 'text-green-400' },
  { key: 'stock', label: 'Stock Report', icon: Package, color: 'text-purple-400' },
  { key: 'pl', label: 'Profit & Loss', icon: TrendingUp, color: 'text-yellow-400' },
  { key: 'daybook', label: 'Day Book', icon: Calendar, color: 'text-blue-400' },
  { key: 'outstanding', label: 'Outstanding Report', icon: Users, color: 'text-red-400' },
  { key: 'expense', label: 'Expense Report', icon: FileText, color: 'text-red-400' },
];

export default function Reports() {
  const { invoices, purchases, parts, customers, suppliers, expenses } = useApp();
  const [activeReport, setActiveReport] = useState('sales');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0]); // Apr 1
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [quickRange, setQuickRange] = useState('month');

  const applyRange = (range) => {
    setQuickRange(range);
    const now = new Date();
    let from, to = now.toISOString().split('T')[0];
    if (range === 'today') { from = to; }
    else if (range === 'week') { const d = new Date(); d.setDate(d.getDate()-7); from = d.toISOString().split('T')[0]; }
    else if (range === 'month') { from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; }
    else if (range === 'lastmonth') { const d = new Date(now.getFullYear(), now.getMonth()-1, 1); from = d.toISOString().split('T')[0]; to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]; }
    else if (range === 'fy') { const yr = now.getMonth()>=3?now.getFullYear():now.getFullYear()-1; from = `${yr}-04-01`; to = `${yr+1}-03-31`; }
    setDateFrom(from); setDateTo(to);
  };

  const filteredInvoices = invoices.filter(i => i.invoice_date >= dateFrom && i.invoice_date <= dateTo);
  const filteredPurchases = purchases.filter(p => p.purchase_date >= dateFrom && p.purchase_date <= dateTo);
  const filteredExpenses = expenses.filter(e => e.date >= dateFrom && e.date <= dateTo);

  // Sales stats
  const totalSales = filteredInvoices.reduce((s, i) => s + i.grand_total, 0);
  const totalTax = filteredInvoices.reduce((s, i) => s + i.total_gst, 0);
  const totalTaxable = filteredInvoices.reduce((s, i) => s + i.taxable_amt, 0);
  const collected = filteredInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.grand_total, 0);
  const pending = filteredInvoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.balance_due, 0);

  // Purchase stats
  const totalPurchases = filteredPurchases.reduce((s, p) => s + p.grand_total, 0);
  const purchaseTax = filteredPurchases.reduce((s, p) => s + (p.total_gst || 0), 0);

  // P&L
  const totalExpensesAmt = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const grossProfit = totalSales - totalPurchases;
  const netProfit = grossProfit - totalExpensesAmt;

  // GST
  const cgstCollected = filteredInvoices.reduce((s, i) => s + i.cgst_amt, 0);
  const sgstCollected = filteredInvoices.reduce((s, i) => s + i.sgst_amt, 0);
  const igstCollected = filteredInvoices.reduce((s, i) => s + i.igst_amt, 0);
  const cgstPaid = filteredPurchases.reduce((s, p) => s + (p.cgst_amt||0), 0);
  const sgstPaid = filteredPurchases.reduce((s, p) => s + (p.sgst_amt||0), 0);
  const taxPayable = (cgstCollected - cgstPaid) + (sgstCollected - sgstPaid);

  return (
    <div className="space-y-4">
      <PageHeader title="Reports & Analytics">
        <Btn variant="secondary" onClick={() => exportGSTR1(filteredInvoices)}><Download size={14}/>GSTR-1 Excel</Btn>
        <Btn variant="secondary" onClick={() => exportTally(filteredInvoices)}><Download size={14}/>Tally XML</Btn>
      </PageHeader>

      {/* Date Range */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {[['today','Today'],['week','This Week'],['month','This Month'],['lastmonth','Last Month'],['fy','Financial Year']].map(([v,l])=>(
              <button key={v} onClick={()=>applyRange(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${quickRange===v?'bg-orange-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{l}</button>
            ))}
          </div>
          <div className="flex items-end gap-2 ml-auto">
            <Field label="From"><Input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setQuickRange('custom');}}/></Field>
            <Field label="To"><Input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setQuickRange('custom');}}/></Field>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Report Nav */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-2 space-y-0.5 h-fit">
          {REPORTS.map(r => (
            <button key={r.key} onClick={() => setActiveReport(r.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${activeReport === r.key ? 'bg-orange-500/15 text-orange-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <r.icon size={14} className={activeReport === r.key ? 'text-orange-400' : r.color}/>
              {r.label}
            </button>
          ))}
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3 space-y-4">

          {/* ── SALES REPORT ── */}
          {activeReport === 'sales' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Sales Report</h3>
                <Btn variant="secondary" size="sm" onClick={() => exportToExcel(filteredInvoices.map(i=>({'Invoice No':i.invoice_no,'Date':fmtDate(i.invoice_date),'Customer':i.customer_name,'Taxable':i.taxable_amt,'GST':i.total_gst,'Total':i.grand_total,'Status':i.status})), 'Sales_Report')}><Download size={13}/>Excel</Btn>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[{l:'Total Sales',v:fmt(totalSales),c:'text-white'},{l:'Taxable Amt',v:fmt(totalTaxable),c:'text-blue-400'},{l:'Tax Collected',v:fmt(totalTax),c:'text-yellow-400'},{l:'Collected',v:fmt(collected),c:'text-green-400'},{l:'Pending',v:fmt(pending),c:'text-red-400'},{l:'Invoices',v:filteredInvoices.length,c:'text-white'}].map(s=>(
                  <div key={s.l} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center"><div className={`font-bold text-xl ${s.c}`}>{s.v}</div><div className="text-gray-500 text-xs mt-0.5">{s.l}</div></div>
                ))}
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h4 className="text-white text-sm font-semibold mb-3">Monthly Trend</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={MONTHLY_CHART}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                    <XAxis dataKey="month" tick={{fill:'#6b7280',fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#6b7280',fontSize:10}} tickFormatter={v=>`₹${v/1000}k`} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={v=>[fmt(v),'Sales']} contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8,fontSize:12}}/>
                    <Line type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2} dot={{fill:'#f97316',r:3}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800"><h4 className="text-white text-sm font-semibold">Invoice Wise</h4></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-800 text-xs text-gray-500"><th className="text-left px-4 py-2">INVOICE</th><th className="text-left px-4 py-2">CUSTOMER</th><th className="text-left px-4 py-2">DATE</th><th className="text-right px-4 py-2">TAXABLE</th><th className="text-right px-4 py-2">GST</th><th className="text-right px-4 py-2">TOTAL</th><th className="text-center px-4 py-2">STATUS</th></tr></thead>
                    <tbody>
                      {filteredInvoices.map(i=>(
                        <tr key={i.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                          <td className="px-4 py-2 text-orange-400 font-mono text-xs">{i.invoice_no}</td>
                          <td className="px-4 py-2 text-white text-sm">{i.customer_name}</td>
                          <td className="px-4 py-2 text-gray-400 text-xs">{fmtDate(i.invoice_date)}</td>
                          <td className="px-4 py-2 text-right text-gray-300">{fmt(i.taxable_amt)}</td>
                          <td className="px-4 py-2 text-right text-yellow-400 text-xs">{fmt(i.total_gst)}</td>
                          <td className="px-4 py-2 text-right text-white font-semibold">{fmt(i.grand_total)}</td>
                          <td className="px-4 py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${i.status==='paid'?'bg-green-500/20 text-green-400':i.status==='unpaid'?'bg-red-500/20 text-red-400':'bg-yellow-500/20 text-yellow-400'}`}>{i.status}</span></td>
                        </tr>
                      ))}
                      <tr className="bg-gray-800/50"><td colSpan={3} className="px-4 py-2 text-gray-400 font-semibold text-sm">TOTAL</td><td className="px-4 py-2 text-right text-white font-bold">{fmt(totalTaxable)}</td><td className="px-4 py-2 text-right text-yellow-400 font-bold">{fmt(totalTax)}</td><td className="px-4 py-2 text-right text-orange-400 font-bold text-base">{fmt(totalSales)}</td><td></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── GST REPORT ── */}
          {(activeReport === 'gst' || activeReport === 'gstr3b') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">{activeReport === 'gst' ? 'GSTR-1 Report' : 'GSTR-3B Summary'}</h3>
                <Btn variant="secondary" size="sm" onClick={() => exportGSTR1(filteredInvoices)}><Download size={13}/>Export GSTR-1</Btn>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  {l:'Taxable Value',v:fmt(totalTaxable),c:'text-white'},{l:'CGST Collected',v:fmt(cgstCollected),c:'text-yellow-400'},
                  {l:'SGST Collected',v:fmt(sgstCollected),c:'text-yellow-400'},{l:'IGST Collected',v:fmt(igstCollected),c:'text-orange-400'},
                  {l:'CGST Paid (Purchase)',v:fmt(cgstPaid),c:'text-blue-400'},{l:'SGST Paid (Purchase)',v:fmt(sgstPaid),c:'text-blue-400'},
                ].map(s=>(
                  <div key={s.l} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center"><div className={`font-bold text-xl ${s.c}`}>{s.v}</div><div className="text-gray-500 text-xs mt-0.5">{s.l}</div></div>
                ))}
              </div>
              <div className={`rounded-xl p-4 border ${taxPayable>=0?'bg-red-500/8 border-red-500/20':'bg-green-500/8 border-green-500/20'}`}>
                <div className="flex justify-between items-center">
                  <div><p className="text-gray-400 text-sm">Net GST Payable to Govt</p><p className="text-gray-500 text-xs mt-0.5">(Tax Collected - Input Tax Credit)</p></div>
                  <div className={`text-2xl font-bold ${taxPayable>=0?'text-red-400':'text-green-400'}`}>{fmt(Math.abs(taxPayable))}</div>
                </div>
              </div>
              {/* GST Rate Wise */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800"><h4 className="text-white text-sm font-semibold">Rate Wise GST Summary</h4></div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 text-xs text-gray-500"><th className="text-left px-4 py-2">GST RATE</th><th className="text-right px-4 py-2">TAXABLE AMT</th><th className="text-right px-4 py-2">CGST</th><th className="text-right px-4 py-2">SGST</th><th className="text-right px-4 py-2">TOTAL GST</th></tr></thead>
                  <tbody>
                    {[5,12,18,28].map(rate=>{
                      const invs = filteredInvoices.filter(i=>(i.items||[]).some(x=>x.gst_rate===rate));
                      const tax = invs.reduce((s,i)=>s+i.taxable_amt,0);
                      if (tax===0) return null;
                      return <tr key={rate} className="border-b border-gray-800/40"><td className="px-4 py-2 text-gray-300">{rate}%</td><td className="px-4 py-2 text-right text-white">{fmt(tax)}</td><td className="px-4 py-2 text-right text-yellow-400">{fmt(tax*rate/200)}</td><td className="px-4 py-2 text-right text-yellow-400">{fmt(tax*rate/200)}</td><td className="px-4 py-2 text-right text-orange-400 font-semibold">{fmt(tax*rate/100)}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── STOCK REPORT ── */}
          {activeReport === 'stock' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Stock Report</h3>
                <Btn variant="secondary" size="sm" onClick={()=>exportToExcel(parts.map(p=>({'Code':p.code,'Name':p.name,'Brand':p.brand,'Category':p.category,'Stock':p.stock,'Reorder':p.reorder_level,'Purchase Price':p.purchase_price,'Selling Price':p.selling_price,'Stock Value':p.purchase_price*p.stock})),'Stock_Report')}><Download size={13}/>Excel</Btn>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[{l:'Total SKUs',v:parts.length,c:'text-white'},{l:'Stock Value',v:fmt(parts.reduce((s,p)=>s+p.purchase_price*p.stock,0)),c:'text-blue-400'},{l:'Low Stock',v:parts.filter(p=>p.stock<=p.reorder_level&&p.stock>0).length,c:'text-yellow-400'},{l:'Out of Stock',v:parts.filter(p=>p.stock===0).length,c:'text-red-400'}].map(s=>(
                  <div key={s.l} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center"><div className={`font-bold text-xl ${s.c}`}>{s.v}</div><div className="text-gray-500 text-xs mt-0.5">{s.l}</div></div>
                ))}
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-800 text-xs text-gray-500"><th className="text-left px-4 py-2">CODE</th><th className="text-left px-4 py-2">PART NAME</th><th className="text-left px-4 py-2 hidden md:table-cell">BRAND</th><th className="text-center px-4 py-2">STOCK</th><th className="text-center px-4 py-2 hidden lg:table-cell">REORDER</th><th className="text-right px-4 py-2">COST</th><th className="text-right px-4 py-2">VALUE</th></tr></thead>
                    <tbody>
                      {parts.sort((a,b)=>a.stock-b.stock).map(p=>(
                        <tr key={p.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                          <td className="px-4 py-2 text-gray-400 font-mono text-xs">{p.code}</td>
                          <td className="px-4 py-2 text-white text-sm">{p.name}</td>
                          <td className="px-4 py-2 text-gray-400 text-xs hidden md:table-cell">{p.brand}</td>
                          <td className={`px-4 py-2 text-center font-bold ${p.stock===0?'text-red-400':p.stock<=p.reorder_level?'text-yellow-400':'text-green-400'}`}>{p.stock}</td>
                          <td className="px-4 py-2 text-center text-gray-500 text-xs hidden lg:table-cell">{p.reorder_level}</td>
                          <td className="px-4 py-2 text-right text-gray-300">{fmt(p.purchase_price)}</td>
                          <td className="px-4 py-2 text-right text-white font-semibold">{fmt(p.purchase_price*p.stock)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── P&L ── */}
          {activeReport === 'pl' && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Profit & Loss Statement</h3>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
                <div className="flex justify-between border-b border-gray-800 pb-3">
                  <span className="text-gray-400">Total Sales Revenue</span>
                  <span className="text-white font-semibold">{fmt(totalSales)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-3">
                  <span className="text-gray-400">Less: GST Collected</span>
                  <span className="text-yellow-400">({fmt(totalTax)})</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-3">
                  <span className="text-white font-semibold">Net Sales (Taxable)</span>
                  <span className="text-white font-semibold">{fmt(totalTaxable)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-3">
                  <span className="text-gray-400">Less: Cost of Goods (Purchase)</span>
                  <span className="text-red-400">({fmt(totalPurchases)})</span>
                </div>
                <div className={`flex justify-between border-b border-gray-800 pb-3 font-semibold`}>
                  <span className="text-white">Gross Profit</span>
                  <span className={grossProfit >= 0 ? 'text-green-400' : 'text-red-400'}>{fmt(grossProfit)}</span>
                </div>
                <div className="pl-4 space-y-1.5">
                  {Object.entries(expenses.reduce((acc,e)=>{acc[e.category]=(acc[e.category]||0)+e.amount;return acc;},{})).map(([cat,amt])=>(
                    <div key={cat} className="flex justify-between text-sm">
                      <span className="text-gray-500">— {cat}</span>
                      <span className="text-red-400 text-xs">({fmt(amt)})</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm border-t border-gray-800 pt-1.5">
                    <span className="text-gray-400">Total Expenses</span>
                    <span className="text-red-400">({fmt(totalExpensesAmt)})</span>
                  </div>
                </div>
                <div className={`flex justify-between pt-2 text-xl font-bold rounded-xl p-3 ${netProfit>=0?'bg-green-500/10':'bg-red-500/10'}`}>
                  <span className="text-white">Net Profit</span>
                  <span className={netProfit>=0?'text-green-400':'text-red-400'}>{fmt(netProfit)}</span>
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h4 className="text-white text-sm font-semibold mb-3">Monthly Profit Trend</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={MONTHLY_CHART} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                    <XAxis dataKey="month" tick={{fill:'#6b7280',fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#6b7280',fontSize:10}} tickFormatter={v=>`₹${v/1000}k`} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={(v,n)=>[fmt(v),n==='profit'?'Profit':n]} contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8,fontSize:12}}/>
                    <Bar dataKey="sales" fill="#f97316" radius={[4,4,0,0]} name="Sales"/>
                    <Bar dataKey="profit" fill="#22c55e" radius={[4,4,0,0]} name="Profit"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── OUTSTANDING ── */}
          {activeReport === 'outstanding' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Outstanding Report</h3>
                <Btn variant="secondary" size="sm" onClick={()=>exportToExcel(invoices.filter(i=>i.status!=='paid').map(i=>({'Invoice':i.invoice_no,'Customer':i.customer_name,'Date':fmtDate(i.invoice_date),'Total':i.grand_total,'Paid':i.paid_amount,'Balance':i.balance_due,'Status':i.status})),'Outstanding')}><Download size={13}/>Excel</Btn>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center"><div className="text-red-400 font-bold text-xl">{fmt(invoices.filter(i=>i.status!=='paid').reduce((s,i)=>s+i.balance_due,0))}</div><div className="text-gray-500 text-xs">Customer Outstanding</div></div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center"><div className="text-red-400 font-bold text-xl">{fmt(purchases.filter(p=>p.balance_due>0).reduce((s,p)=>s+p.balance_due,0))}</div><div className="text-gray-500 text-xs">Supplier Payable</div></div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800 flex justify-between"><h4 className="text-white text-sm font-semibold">Customer Dues</h4><span className="text-gray-500 text-xs">{invoices.filter(i=>i.status!=='paid').length} invoices</span></div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 text-xs text-gray-500"><th className="text-left px-4 py-2">CUSTOMER</th><th className="text-left px-4 py-2 hidden md:table-cell">INVOICE</th><th className="text-left px-4 py-2 hidden md:table-cell">DATE</th><th className="text-right px-4 py-2">TOTAL</th><th className="text-right px-4 py-2">BALANCE</th><th className="text-center px-4 py-2">STATUS</th></tr></thead>
                  <tbody>
                    {invoices.filter(i=>i.status!=='paid').map(i=>(
                      <tr key={i.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                        <td className="px-4 py-2 text-white text-sm">{i.customer_name}</td>
                        <td className="px-4 py-2 text-orange-400 font-mono text-xs hidden md:table-cell">{i.invoice_no}</td>
                        <td className="px-4 py-2 text-gray-400 text-xs hidden md:table-cell">{fmtDate(i.invoice_date)}</td>
                        <td className="px-4 py-2 text-right text-gray-300">{fmt(i.grand_total)}</td>
                        <td className="px-4 py-2 text-right text-red-400 font-semibold">{fmt(i.balance_due)}</td>
                        <td className="px-4 py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${i.status==='partial'?'bg-yellow-500/20 text-yellow-400':'bg-red-500/20 text-red-400'}`}>{i.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DAYBOOK ── */}
          {activeReport === 'daybook' && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Day Book</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center"><div className="text-green-400 font-bold text-xl">{fmt(filteredInvoices.filter(i=>i.payment_mode!=='Credit').reduce((s,i)=>s+i.paid_amount,0))}</div><div className="text-gray-500 text-xs">Cash In (Sales)</div></div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center"><div className="text-red-400 font-bold text-xl">{fmt(filteredExpenses.reduce((s,e)=>s+e.amount,0))}</div><div className="text-gray-500 text-xs">Cash Out (Expenses)</div></div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center"><div className="text-orange-400 font-bold text-xl">{fmt(filteredInvoices.filter(i=>i.payment_mode!=='Credit').reduce((s,i)=>s+i.paid_amount,0) - filteredExpenses.reduce((s,e)=>s+e.amount,0))}</div><div className="text-gray-500 text-xs">Net Cash</div></div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 text-xs text-gray-500"><th className="text-left px-4 py-2">DATE</th><th className="text-left px-4 py-2">TYPE</th><th className="text-left px-4 py-2">PARTICULARS</th><th className="text-right px-4 py-2">DR</th><th className="text-right px-4 py-2">CR</th></tr></thead>
                  <tbody>
                    {[
                      ...filteredInvoices.filter(i=>i.payment_mode!=='Credit').map(i=>({date:i.invoice_date,type:'Sale',part:i.customer_name+' - '+i.invoice_no,dr:0,cr:i.paid_amount})),
                      ...filteredExpenses.map(e=>({date:e.date,type:'Expense',part:e.category+' - '+e.description,dr:e.amount,cr:0})),
                    ].sort((a,b)=>b.date.localeCompare(a.date)).map((r,i)=>(
                      <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                        <td className="px-4 py-2 text-gray-400 text-xs">{fmtDate(r.date)}</td>
                        <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${r.type==='Sale'?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>{r.type}</span></td>
                        <td className="px-4 py-2 text-white text-sm">{r.part}</td>
                        <td className="px-4 py-2 text-right text-red-400">{r.dr>0?fmt(r.dr):''}</td>
                        <td className="px-4 py-2 text-right text-green-400">{r.cr>0?fmt(r.cr):''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── EXPENSE REPORT ── */}
          {activeReport === 'expense' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Expense Report</h3>
                <Btn variant="secondary" size="sm" onClick={()=>exportToExcel(filteredExpenses,'Expense_Report')}><Download size={13}/>Excel</Btn>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 text-xs text-gray-500"><th className="text-left px-4 py-2">DATE</th><th className="text-left px-4 py-2">CATEGORY</th><th className="text-left px-4 py-2">DESCRIPTION</th><th className="text-right px-4 py-2">AMOUNT</th></tr></thead>
                  <tbody>
                    {filteredExpenses.map(e=>(
                      <tr key={e.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                        <td className="px-4 py-2 text-gray-400 text-xs">{fmtDate(e.date)}</td>
                        <td className="px-4 py-2"><span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">{e.category}</span></td>
                        <td className="px-4 py-2 text-white text-sm">{e.description}</td>
                        <td className="px-4 py-2 text-right text-red-400 font-semibold">{fmt(e.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-800/40"><td colSpan={3} className="px-4 py-2 text-white font-bold">Total</td><td className="px-4 py-2 text-right text-red-400 font-bold">{fmt(filteredExpenses.reduce((s,e)=>s+e.amount,0))}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Purchase report */}
          {activeReport === 'purchase' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Purchase Report</h3>
                <Btn variant="secondary" size="sm" onClick={()=>exportToExcel(filteredPurchases.map(p=>({'Purchase No':p.purchase_no,'Supplier':p.supplier_name,'Date':fmtDate(p.purchase_date),'Supplier Inv':p.supplier_invoice,'Total GST':p.total_gst,'Grand Total':p.grand_total,'Status':p.status})),'Purchase_Report')}><Download size={13}/>Excel</Btn>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[{l:'Total Purchase',v:fmt(totalPurchases),c:'text-white'},{l:'Tax Paid (ITC)',v:fmt(purchaseTax),c:'text-blue-400'},{l:'Orders',v:filteredPurchases.length,c:'text-white'}].map(s=>(
                  <div key={s.l} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center"><div className={`font-bold text-xl ${s.c}`}>{s.v}</div><div className="text-gray-500 text-xs mt-0.5">{s.l}</div></div>
                ))}
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 text-xs text-gray-500"><th className="text-left px-4 py-2">PURCHASE NO</th><th className="text-left px-4 py-2">SUPPLIER</th><th className="text-left px-4 py-2">DATE</th><th className="text-right px-4 py-2">GST PAID</th><th className="text-right px-4 py-2">TOTAL</th></tr></thead>
                  <tbody>
                    {filteredPurchases.map(p=>(
                      <tr key={p.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                        <td className="px-4 py-2 text-orange-400 font-mono text-xs">{p.purchase_no}</td>
                        <td className="px-4 py-2 text-white text-sm">{p.supplier_name}</td>
                        <td className="px-4 py-2 text-gray-400 text-xs">{fmtDate(p.purchase_date)}</td>
                        <td className="px-4 py-2 text-right text-blue-400">{fmt(p.total_gst||0)}</td>
                        <td className="px-4 py-2 text-right text-white font-semibold">{fmt(p.grand_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
