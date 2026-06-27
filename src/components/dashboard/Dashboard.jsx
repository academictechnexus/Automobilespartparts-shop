import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { IndianRupee, Package, AlertTriangle, Clock, Users, TrendingUp, ShoppingCart, Wrench, Plus } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { StatCard, Badge } from '../shared/UI';
import { fmt, fmtDate } from '../../utils/helpers';
import { MONTHLY_CHART, CATEGORY_CHART } from '../../lib/mockData';

export default function Dashboard({ setPage }) {
  const { t, stats, parts, invoices, expenses } = useApp();
  const lowStockParts = parts.filter(p => p.stock <= p.reorder_level);
  const recentInvoices = invoices.slice(0, 6);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-xl">{t.dashboard}</h2>
          <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => setPage('billing')}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Plus size={16} /> {t.newSale}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t.todaySales} value={fmt(stats.todaySales || 98000)} icon={IndianRupee} color="orange" trend="up" trendVal="+12%" sub="5 invoices today" />
        <StatCard label={t.totalStock} value={stats.totalStock.toLocaleString('en-IN')} icon={Package} color="blue" sub={`${parts.length} SKUs total`} />
        <StatCard label={t.lowStockItems} value={stats.lowStockCount} icon={AlertTriangle} color="red" sub={`${stats.outOfStockCount} out of stock`} />
        <StatCard label={t.pendingPayments} value={fmt(stats.pendingAmount)} icon={Clock} color="purple" sub={`${invoices.filter(i => i.status !== 'paid').length} invoices`} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t.monthSales} value={fmt(stats.monthSales)} icon={TrendingUp} color="green" />
        <StatCard label={t.totalCustomers} value={stats.totalCustomers} icon={Users} color="blue" />
        <StatCard label="Stock Value" value={fmt(stats.stockValue)} icon={Package} color="yellow" />
        <StatCard label={t.expenseReport} value={fmt(totalExpenses)} icon={ShoppingCart} color="red" sub="This month" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Sales vs Purchase — Last 6 Months</h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={MONTHLY_CHART} barSize={18} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `₹${v / 1000}k`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v, n) => [fmt(v), n === 'sales' ? 'Sales' : n === 'purchase' ? 'Purchase' : 'Profit']}
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#fff' }} />
              <Bar dataKey="sales" fill="#f97316" radius={[4, 4, 0, 0]} name="Sales" />
              <Bar dataKey="purchase" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Purchase" />
              <Bar dataKey="profit" fill="#22c55e" radius={[4, 4, 0, 0]} name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={CATEGORY_CHART} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
                {CATEGORY_CHART.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, 'Share']}
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-1">
            {CATEGORY_CHART.map(c => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <span className="truncate">{c.name}</span>
                <span className="ml-auto text-gray-600">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-400" />
              <h3 className="text-red-400 font-semibold text-sm">{t.stockAlert} ({lowStockParts.length} items)</h3>
            </div>
            <button onClick={() => setPage('inventory')} className="text-red-400 text-xs hover:text-red-300">View all →</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStockParts.slice(0, 6).map(p => (
              <div key={p.id} className="bg-gray-900 rounded-lg px-3 py-2.5 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium truncate">{p.name}</div>
                  <div className="text-gray-500 text-xs">{p.code} · {p.brand}</div>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <div className={`text-sm font-bold ${p.stock === 0 ? 'text-red-400' : 'text-yellow-400'}`}>{p.stock}</div>
                  <div className="text-gray-600 text-xs">min:{p.reorder_level}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Recent Invoices</h3>
          <button onClick={() => setPage('billing')} className="text-orange-400 text-xs hover:text-orange-300">View all →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500">
                <th className="text-left px-4 py-2.5">INVOICE</th>
                <th className="text-left px-4 py-2.5">CUSTOMER</th>
                <th className="text-left px-4 py-2.5 hidden md:table-cell">DATE</th>
                <th className="text-left px-4 py-2.5 hidden lg:table-cell">MODE</th>
                <th className="text-right px-4 py-2.5">AMOUNT</th>
                <th className="text-center px-4 py-2.5">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map(inv => (
                <tr key={inv.id} className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors">
                  <td className="px-4 py-2.5 text-orange-400 font-mono text-xs">{inv.invoice_no}</td>
                  <td className="px-4 py-2.5 text-white text-sm">{inv.customer_name}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs hidden md:table-cell">{fmtDate(inv.invoice_date)}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs hidden lg:table-cell">{inv.payment_mode}</td>
                  <td className="px-4 py-2.5 text-white font-semibold text-right">{fmt(inv.grand_total)}</td>
                  <td className="px-4 py-2.5 text-center"><Badge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
