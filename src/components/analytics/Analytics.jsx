import { useState } from 'react';
import { TrendingUp, Package, Users, Car, AlertTriangle, Star, BarChart2, RefreshCw, Download } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { PageHeader, Btn } from '../shared/UI';
import { fmt, exportToExcel } from '../../utils/helpers';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7','#eab308','#ec4899','#06b6d4','#84cc16'];

// ─── HEALTH SCORE WIDGET ─────────────────────────────────────────────────────
function HealthScoreCard({ score }) {
  const { score: s, grade, details } = score;
  const color = s >= 85 ? 'text-green-400' : s >= 65 ? 'text-yellow-400' : 'text-red-400';
  const ring = s >= 85 ? 'stroke-green-400' : s >= 65 ? 'stroke-yellow-400' : 'stroke-red-400';
  const r = 40, circ = 2 * Math.PI * r;
  const dash = (s / 100) * circ;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-sm mb-4">Business Health Score</h3>
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#1f2937" strokeWidth="10"/>
            <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10"
              className={ring} strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 1s ease' }}/>
            <text x="50" y="45" textAnchor="middle" className={color} style={{ fill: 'currentColor', fontSize: 22, fontWeight: 700 }}>{s}</text>
            <text x="50" y="62" textAnchor="middle" style={{ fill: '#6b7280', fontSize: 12 }}>{grade}</text>
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          {details.map(d => (
            <div key={d.label} className="flex items-center justify-between">
              <span className="text-gray-500 text-xs">{d.label}</span>
              <span className={`text-xs font-semibold ${d.color}`}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DUPLICATE DETECTOR ──────────────────────────────────────────────────────
function DuplicateDetector() {
  const { detectDuplicates } = useApp();
  const [dupes, setDupes] = useState(null);

  const run = () => setDupes(detectDuplicates());
  const total = dupes ? Object.values(dupes).flat().length : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">Duplicate Detector</h3>
        <Btn variant="secondary" size="sm" onClick={run}><RefreshCw size={12}/>Scan Now</Btn>
      </div>
      {dupes === null ? (
        <p className="text-gray-600 text-sm text-center py-4">Click "Scan Now" to detect duplicates</p>
      ) : total === 0 ? (
        <div className="text-center py-4">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-green-400 text-sm font-semibold">No duplicates found!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(dupes).filter(([,arr]) => arr.length > 0).map(([type, arr]) => (
            <div key={type}>
              <p className="text-yellow-400 text-xs font-semibold mb-1 capitalize">{type.replace('_',' ')} ({arr.length})</p>
              {arr.slice(0,3).map((d, i) => (
                <div key={i} className="bg-yellow-500/8 border border-yellow-500/20 rounded-lg px-3 py-2 mb-1">
                  <p className="text-white text-xs">{d.a} ↔ {d.b}</p>
                  <p className="text-gray-500 text-xs">{d.reason}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── REORDER SUGGESTIONS ─────────────────────────────────────────────────────
function ReorderSuggestions() {
  const { getReorderSuggestions } = useApp();
  const suggestions = getReorderSuggestions();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">AI Reorder Suggestions</h3>
        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">{suggestions.length} items</span>
      </div>
      {suggestions.length === 0 ? (
        <div className="text-center py-8 text-gray-600 text-sm">✅ All parts are adequately stocked</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800 text-xs text-gray-500">
              <th className="text-left px-4 py-2">PART</th>
              <th className="text-center px-3 py-2">STOCK</th>
              <th className="text-center px-3 py-2 hidden md:table-cell">AVG/MONTH</th>
              <th className="text-center px-3 py-2">SUGGEST</th>
              <th className="text-center px-3 py-2">URGENCY</th>
            </tr></thead>
            <tbody>
              {suggestions.slice(0,8).map(p => (
                <tr key={p.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                  <td className="px-4 py-2.5">
                    <div className="text-white text-sm">{p.name}</div>
                    <div className="text-gray-500 text-xs">{p.code} · {p.brand}</div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-bold text-sm ${p.stock === 0 ? 'text-red-400' : 'text-yellow-400'}`}>{p.stock}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-400 text-sm hidden md:table-cell">{p.avg_monthly}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-orange-400 font-bold">{p.suggested_reorder}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.urgency === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {p.urgency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── STOCK AGEING ─────────────────────────────────────────────────────────────
function StockAgeing() {
  const { getStockAgeing } = useApp();
  const aged = getStockAgeing();

  const buckets = {
    active: { label: 'Active (<30d)', color: 'bg-green-500/20 text-green-400', items: aged.filter(p=>p.ageing_bucket==='active') },
    '30-90d': { label: '30-90 days', color: 'bg-yellow-500/20 text-yellow-400', items: aged.filter(p=>p.ageing_bucket==='30-90d') },
    '90-180d': { label: '90-180 days', color: 'bg-orange-500/20 text-orange-400', items: aged.filter(p=>p.ageing_bucket==='90-180d') },
    '180-365d': { label: '180-365 days', color: 'bg-red-500/20 text-red-400', items: aged.filter(p=>p.ageing_bucket==='180-365d') },
    dead: { label: 'Dead (>365d)', color: 'bg-gray-500/20 text-gray-400', items: aged.filter(p=>p.ageing_bucket==='dead') },
  };

  const [selectedBucket, setSelectedBucket] = useState('dead');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {Object.entries(buckets).map(([key, b]) => (
          <button key={key} onClick={() => setSelectedBucket(key)}
            className={`p-3 rounded-xl border-2 transition-colors text-center ${selectedBucket === key ? 'border-orange-500' : 'border-gray-800 hover:border-gray-700'}`}>
            <div className={`font-bold text-xl ${b.color.split(' ')[1]}`}>{b.items.length}</div>
            <div className="text-gray-500 text-xs mt-0.5">{b.label}</div>
            <div className="text-gray-600 text-xs">{fmt(b.items.reduce((s,p)=>s+p.stock_value,0))}</div>
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h4 className="text-white text-sm font-semibold">{buckets[selectedBucket]?.label} — {buckets[selectedBucket]?.items.length} items</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800 text-xs text-gray-500">
              <th className="text-left px-4 py-2">PART</th>
              <th className="text-center px-3 py-2">STOCK</th>
              <th className="text-center px-3 py-2">LAST SALE</th>
              <th className="text-center px-3 py-2">DAYS IDLE</th>
              <th className="text-right px-4 py-2">STOCK VALUE</th>
            </tr></thead>
            <tbody>
              {buckets[selectedBucket]?.items.slice(0,10).map(p => (
                <tr key={p.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                  <td className="px-4 py-2.5"><div className="text-white text-sm">{p.name}</div><div className="text-gray-500 text-xs">{p.code} · {p.brand}</div></td>
                  <td className="px-3 py-2.5 text-center text-gray-300">{p.stock} {p.unit}</td>
                  <td className="px-3 py-2.5 text-center text-gray-400 text-xs">{p.last_sale || 'Never'}</td>
                  <td className="px-3 py-2.5 text-center"><span className={`font-bold text-sm ${p.days_since_sale>365?'text-red-400':p.days_since_sale>90?'text-orange-400':'text-yellow-400'}`}>{p.days_since_sale > 900 ? '∞' : p.days_since_sale}</span></td>
                  <td className="px-4 py-2.5 text-right text-white font-semibold">{fmt(p.stock_value)}</td>
                </tr>
              ))}
              {buckets[selectedBucket]?.items.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-600 text-sm">No items in this category</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CREDIT RISK TABLE ───────────────────────────────────────────────────────
function CreditRisk({ creditRisk }) {
  if (creditRisk.length === 0) return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
      <div className="text-2xl mb-2">✅</div>
      <p className="text-green-400 text-sm">No credit risk detected! All customer payments are clear.</p>
    </div>
  );
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800"><h4 className="text-white text-sm font-semibold">Customer Credit Risk ({creditRisk.length})</h4></div>
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-800 text-xs text-gray-500">
          <th className="text-left px-4 py-2">CUSTOMER</th>
          <th className="text-right px-3 py-2">DUE AMT</th>
          <th className="text-center px-3 py-2 hidden md:table-cell">OVERDUE</th>
          <th className="text-center px-3 py-2">SCORE</th>
          <th className="text-center px-3 py-2">RISK</th>
        </tr></thead>
        <tbody>
          {creditRisk.map(c => (
            <tr key={c.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
              <td className="px-4 py-2.5"><div className="text-white text-sm">{c.name}</div><div className="text-gray-500 text-xs">{c.phone}</div></td>
              <td className="px-3 py-2.5 text-right text-red-400 font-semibold">{fmt(c.total_due)}</td>
              <td className="px-3 py-2.5 text-center text-gray-400 hidden md:table-cell">{c.overdue_count} invoices</td>
              <td className="px-3 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-12 bg-gray-700 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${c.risk_score>=80?'bg-green-400':c.risk_score>=50?'bg-yellow-400':'bg-red-400'}`} style={{width:`${c.risk_score}%`}}/>
                  </div>
                  <span className="text-xs text-gray-400">{c.risk_score}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-center">
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.risk==='low'?'bg-green-500/20 text-green-400':c.risk==='medium'?'bg-yellow-500/20 text-yellow-400':'bg-red-500/20 text-red-400'}`}>{c.risk}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── MAIN ANALYTICS PAGE ─────────────────────────────────────────────────────
export default function Analytics() {
  const { getAnalytics, getHealthScore, getReorderSuggestions } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  const analytics = getAnalytics();
  const healthScore = getHealthScore();

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'products', label: 'Top Products' },
    { key: 'customers', label: 'Customers' },
    { key: 'stock', label: 'Stock Ageing' },
    { key: 'duplicates', label: 'Duplicates' },
    { key: 'reorder', label: 'AI Reorder' },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Analytics & Insights" subtitle="AI-powered business intelligence">
        <Btn variant="secondary" size="sm" onClick={() => exportToExcel(analytics.topParts, 'Top_Products')}><Download size={13}/>Export</Btn>
      </PageHeader>

      {/* Tab nav */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <HealthScoreCard score={healthScore}/>
            <DuplicateDetector/>
          </div>

          {/* Monthly trend */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold text-sm mb-4">6-Month Trend — Sales vs Purchase vs Profit</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.monthlyTrends} barSize={16} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                <XAxis dataKey="month" tick={{fill:'#6b7280',fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'#6b7280',fontSize:10}} tickFormatter={v=>`₹${v/1000}k`} axisLine={false} tickLine={false}/>
                <Tooltip formatter={(v,n)=>[fmt(v),n]} contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8,fontSize:12}}/>
                <Legend wrapperStyle={{fontSize:11,color:'#9ca3af'}}/>
                <Bar dataKey="sales" fill="#f97316" radius={[4,4,0,0]} name="Sales"/>
                <Bar dataKey="purchase" fill="#3b82f6" radius={[4,4,0,0]} name="Purchase"/>
                <Bar dataKey="profit" fill="#22c55e" radius={[4,4,0,0]} name="Profit"/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top brands + Vehicles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-white font-semibold text-sm mb-3">Top Brands by Revenue</h3>
              {analytics.topBrands.length === 0 ? <p className="text-gray-600 text-sm text-center py-4">No data yet</p> : (
                <div className="space-y-2">
                  {analytics.topBrands.map((b, i) => (
                    <div key={b.name} className="flex items-center gap-2">
                      <span className="text-gray-600 text-xs w-4">{i+1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-0.5"><span className="text-gray-300">{b.name}</span><span className="text-white font-semibold">{fmt(b.revenue)}</span></div>
                        <div className="bg-gray-800 rounded-full h-1"><div className="h-1 rounded-full" style={{width:`${(b.revenue/analytics.topBrands[0]?.revenue*100)||0}%`,background:COLORS[i%COLORS.length]}}/></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-white font-semibold text-sm mb-3">Parts by Vehicle Make</h3>
              {analytics.topVehicles.length === 0 ? <p className="text-gray-600 text-sm text-center py-4">No data yet</p> : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={analytics.topVehicles} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="count" nameKey="name" paddingAngle={2}>
                      {analytics.topVehicles.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v + ' parts', n]} contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8,fontSize:11}}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOP PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800"><h3 className="text-white font-semibold text-sm">Top Selling Parts</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800 text-xs text-gray-500">
              <th className="text-left px-4 py-2 w-8">#</th>
              <th className="text-left px-4 py-2">PART NAME</th>
              <th className="text-center px-3 py-2">QTY SOLD</th>
              <th className="text-right px-4 py-2">REVENUE</th>
            </tr></thead>
            <tbody>
              {analytics.topParts.map((p, i) => (
                <tr key={p.name} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                  <td className="px-4 py-3">
                    <span className={`font-bold ${i===0?'text-yellow-400':i===1?'text-gray-300':i===2?'text-orange-700':'text-gray-600'}`}>{i+1}</span>
                  </td>
                  <td className="px-4 py-3 text-white text-sm font-medium">{p.name}</td>
                  <td className="px-3 py-3 text-center text-gray-300">{p.qty}</td>
                  <td className="px-4 py-3 text-right text-white font-semibold">{fmt(p.revenue)}</td>
                </tr>
              ))}
              {analytics.topParts.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-gray-600">Add invoices with items to see top products</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800"><h3 className="text-white font-semibold text-sm">Top Customers by Revenue</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-800 text-xs text-gray-500">
                <th className="text-left px-4 py-2 w-8">#</th><th className="text-left px-4 py-2">CUSTOMER</th>
                <th className="text-center px-3 py-2">ORDERS</th><th className="text-right px-4 py-2">REVENUE</th>
              </tr></thead>
              <tbody>
                {analytics.topCustomers.map((c, i) => (
                  <tr key={c.name} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                    <td className="px-4 py-3"><span className={`font-bold ${i===0?'text-yellow-400':i===1?'text-gray-300':i===2?'text-orange-700':'text-gray-600'}`}>{i+1}</span></td>
                    <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                    <td className="px-3 py-3 text-center text-gray-300">{c.orders}</td>
                    <td className="px-4 py-3 text-right text-white font-semibold">{fmt(c.revenue)}</td>
                  </tr>
                ))}
                {analytics.topCustomers.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-gray-600">No invoice data yet</td></tr>}
              </tbody>
            </table>
          </div>
          <CreditRisk creditRisk={analytics.creditRisk}/>
        </div>
      )}

      {/* STOCK AGEING */}
      {activeTab === 'stock' && <StockAgeing/>}

      {/* DUPLICATES */}
      {activeTab === 'duplicates' && (
        <div className="max-w-lg"><DuplicateDetector/></div>
      )}

      {/* AI REORDER */}
      {activeTab === 'reorder' && <ReorderSuggestions/>}
    </div>
  );
}
