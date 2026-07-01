import { useState } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Package, History, AlertTriangle, Search, Download } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { Modal, Btn, SearchBar, PageHeader, Table, THead, TRow, TD, Field, Input, Select, Textarea } from '../shared/UI';
import { fmt, fmtDate, today, exportToExcel } from '../../utils/helpers';

const ADJ_TYPES = [
  { value: 'add',       label: 'Stock In (Add)',         icon: ArrowUpCircle,   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  { value: 'remove',    label: 'Stock Out (Remove)',      icon: ArrowDownCircle, color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
  { value: 'set',       label: 'Set Exact Quantity',      icon: Package,         color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  { value: 'transfer',  label: 'Transfer Between Parts',  icon: ArrowLeftRight,  color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { value: 'opening',   label: 'Opening Stock Entry',     icon: Package,         color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { value: 'damage',    label: 'Damaged / Expired',       icon: AlertTriangle,   color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { value: 'return',    label: 'Customer Return',         icon: ArrowUpCircle,   color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { value: 'audit',     label: 'Stock Audit Correction',  icon: History,         color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/20' },
];

const REASONS = {
  add:      ['Purchase received','Found extra stock','System correction','Opening stock','Customer return'],
  remove:   ['Damaged/broken','Expired','Lost/theft','Given as sample','System correction'],
  set:      ['Physical audit','System correction','Opening balance'],
  transfer: ['Part code change','Duplicate entry merge'],
  opening:  ['New financial year','Migration from old system','Initial setup'],
  damage:   ['Physically damaged','Expired / old stock','Water damage','Fire damage'],
  return:   ['Customer returned','Wrong part sent','Defective part'],
  audit:    ['Physical count mismatch','Cycle count correction','Annual audit'],
};

const blank = { part_id: '', qty: '', adj_type: 'add', reason: '', notes: '', date: today(), to_part_id: '' };

export default function StockAdjustment() {
  const { parts, upsertPart } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('stock_adjustments') || '[]'); } catch { return []; }
  });
  const [tab, setTab] = useState('adjust');
  const [auditMode, setAuditMode] = useState(false);
  const [auditCounts, setAuditCounts] = useState({});

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const selectedPart = parts.find(p => p.id === form.part_id);
  const toPart = parts.find(p => p.id === form.to_part_id);
  const adjType = ADJ_TYPES.find(t => t.value === form.adj_type);

  const filteredParts = parts.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.code?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const getNewStock = () => {
    if (!selectedPart || !form.qty) return null;
    const qty = parseFloat(form.qty) || 0;
    if (form.adj_type === 'add' || form.adj_type === 'opening' || form.adj_type === 'return') return selectedPart.stock + qty;
    if (form.adj_type === 'remove' || form.adj_type === 'damage') return Math.max(0, selectedPart.stock - qty);
    if (form.adj_type === 'set' || form.adj_type === 'audit') return qty;
    return null;
  };

  const saveAdjustment = () => {
    if (!form.part_id || !form.qty || !form.reason) return;
    const qty = parseFloat(form.qty) || 0;
    const newStock = getNewStock();

    // Update part stock
    upsertPart({ ...selectedPart, stock: newStock });

    // If transfer, also update target part
    if (form.adj_type === 'transfer' && toPart) {
      upsertPart({ ...toPart, stock: toPart.stock + qty });
    }

    // Save to history
    const entry = {
      id: `adj_${Date.now()}`,
      date: form.date,
      part_id: form.part_id,
      part_name: selectedPart.name,
      part_code: selectedPart.code,
      adj_type: form.adj_type,
      qty_before: selectedPart.stock,
      qty_change: form.adj_type === 'add' || form.adj_type === 'opening' || form.adj_type === 'return' ? +qty :
                  form.adj_type === 'remove' || form.adj_type === 'damage' ? -qty :
                  form.adj_type === 'set' || form.adj_type === 'audit' ? qty - selectedPart.stock : qty,
      qty_after: newStock,
      reason: form.reason,
      notes: form.notes,
      to_part: toPart?.name || null,
      user: 'admin',
    };

    const updated = [entry, ...history];
    setHistory(updated);
    localStorage.setItem('stock_adjustments', JSON.stringify(updated.slice(0, 500)));

    setShowForm(false);
    setForm(blank);
  };

  // Stock audit functions
  const startAudit = () => {
    const counts = {};
    parts.forEach(p => { counts[p.id] = p.stock; });
    setAuditCounts(counts);
    setAuditMode(true);
    setTab('audit');
  };

  const saveAudit = () => {
    let changed = 0;
    parts.forEach(p => {
      const counted = parseFloat(auditCounts[p.id]);
      if (!isNaN(counted) && counted !== p.stock) {
        upsertPart({ ...p, stock: counted });
        const entry = {
          id: `adj_${Date.now()}_${p.id}`,
          date: today(),
          part_id: p.id, part_name: p.name, part_code: p.code,
          adj_type: 'audit', qty_before: p.stock, qty_change: counted - p.stock,
          qty_after: counted, reason: 'Physical audit correction', notes: 'Bulk audit',
          user: 'admin',
        };
        setHistory(prev => [entry, ...prev]);
        changed++;
      }
    });
    const all = history;
    localStorage.setItem('stock_adjustments', JSON.stringify(all.slice(0, 500)));
    setAuditMode(false);
    setTab('history');
    alert(`Audit complete. ${changed} items updated.`);
  };

  const quickAdjust = (part, type) => {
    setForm({ ...blank, part_id: part.id, adj_type: type, reason: type === 'add' ? 'Purchase received' : 'Damaged/broken' });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Stock Adjustment" subtitle="Manage stock levels, transfers, and audits">
        <Btn variant="secondary" onClick={startAudit}><History size={14}/>Start Stock Audit</Btn>
        <Btn variant="primary" onClick={() => { setForm(blank); setShowForm(true); }}><Plus size={15}/>New Adjustment</Btn>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Adjustments', val: history.length, c: 'text-white' },
          { label: 'Stock Added', val: history.filter(h=>['add','opening','return'].includes(h.adj_type)).reduce((s,h)=>s+Math.abs(h.qty_change||0),0), c: 'text-green-400', fmt: true },
          { label: 'Stock Removed', val: history.filter(h=>['remove','damage'].includes(h.adj_type)).reduce((s,h)=>s+Math.abs(h.qty_change||0),0), c: 'text-red-400', fmt: true },
          { label: 'Audit Corrections', val: history.filter(h=>h.adj_type==='audit').length, c: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`font-bold text-xl ${s.c}`}>{s.fmt ? s.val.toLocaleString('en-IN') : s.val}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {[['adjust','Adjust Stock'],['history','Adjustment History'],['audit','Stock Audit']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===k?'bg-orange-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{l}</button>
        ))}
      </div>

      {/* ADJUST TAB — Quick adjustment from parts list */}
      {tab === 'adjust' && (
        <div className="space-y-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search part to adjust..."/>
          <Table>
            <THead cols={[
              { label: 'PART' }, { label: 'CURRENT STOCK', align: 'center' },
              { label: 'REORDER', align: 'center' }, { label: 'STATUS', align: 'center' },
              { label: 'QUICK ADJUST', align: 'center' },
            ]}/>
            <tbody>
              {filteredParts.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-600">No parts found</td></tr>}
              {filteredParts.map(p => (
                <TRow key={p.id}>
                  <TD>
                    <div className="text-white text-sm font-medium">{p.name}</div>
                    <div className="text-gray-500 text-xs">{p.code} · {p.brand}</div>
                    <div className="text-gray-600 text-xs">{p.location || 'No location'}</div>
                  </TD>
                  <TD align="center">
                    <span className={`font-bold text-lg ${p.stock === 0 ? 'text-red-400' : p.stock <= p.reorder_level ? 'text-yellow-400' : 'text-green-400'}`}>
                      {p.stock}
                    </span>
                    <div className="text-gray-600 text-xs">{p.unit}</div>
                  </TD>
                  <TD align="center"><span className="text-gray-400 text-sm">{p.reorder_level}</span></TD>
                  <TD align="center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.stock === 0 ? 'bg-red-500/20 text-red-400' : p.stock <= p.reorder_level ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                      {p.stock === 0 ? 'Out' : p.stock <= p.reorder_level ? 'Low' : 'OK'}
                    </span>
                  </TD>
                  <TD align="center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => quickAdjust(p, 'add')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-400 rounded-lg text-xs font-medium transition-colors">
                        <ArrowUpCircle size={11}/> Add
                      </button>
                      <button onClick={() => quickAdjust(p, 'remove')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg text-xs font-medium transition-colors">
                        <ArrowDownCircle size={11}/> Remove
                      </button>
                      <button onClick={() => { setForm({ ...blank, part_id: p.id, adj_type: 'set' }); setShowForm(true); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-lg text-xs font-medium transition-colors">
                        Set
                      </button>
                    </div>
                  </TD>
                </TRow>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">{history.length} total adjustments</p>
            <Btn variant="secondary" size="sm" onClick={() => exportToExcel(history, 'Stock_Adjustments')}>
              <Download size={13}/>Export
            </Btn>
          </div>

          {/* Latest 3 adjustments quick view */}
          {history.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {history.slice(0, 3).map((h, i) => (
                <div key={h.id} className={`rounded-xl p-3 border ${h.qty_change>0?'bg-green-500/8 border-green-500/20':'bg-red-500/8 border-red-500/20'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold uppercase ${h.qty_change>0?'text-green-400':'text-red-400'}`}>{h.adj_type}</span>
                    <span className="text-gray-600 text-xs">{fmtDate(h.date)}</span>
                  </div>
                  <div className="text-white text-sm font-medium truncate">{h.part_name}</div>
                  <div className="text-gray-500 text-xs">{h.part_code}</div>
                  <div className={`font-bold text-lg mt-1 ${h.qty_change>0?'text-green-400':'text-red-400'}`}>
                    {h.qty_change>0?'+':''}{h.qty_change} units
                  </div>
                  <div className="text-gray-600 text-xs">{h.qty_before} → {h.qty_after} · {h.reason}</div>
                </div>
              ))}
            </div>
          )}

          <Table>
            <THead cols={[
              { label: 'DATE' }, { label: 'PART' }, { label: 'TYPE' },
              { label: 'BEFORE', align: 'center' }, { label: 'CHANGE', align: 'center' },
              { label: 'AFTER', align: 'center' }, { label: 'REASON' },
            ]}/>
            <tbody>
              {history.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-600 text-sm">No adjustments yet. Use "New Adjustment" to start.</td></tr>}
              {history.map(h => (
                <TRow key={h.id}>
                  <TD><span className="text-gray-400 text-xs">{fmtDate(h.date)}</span></TD>
                  <TD>
                    <div className="text-white text-sm">{h.part_name}</div>
                    <div className="text-gray-500 text-xs">{h.part_code}</div>
                  </TD>
                  <TD>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      h.adj_type==='add'||h.adj_type==='opening'||h.adj_type==='return' ? 'bg-green-500/20 text-green-400' :
                      h.adj_type==='remove'||h.adj_type==='damage' ? 'bg-red-500/20 text-red-400' :
                      h.adj_type==='transfer' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>{h.adj_type}</span>
                  </TD>
                  <TD align="center"><span className="text-gray-400">{h.qty_before}</span></TD>
                  <TD align="center">
                    <span className={`font-bold ${h.qty_change > 0 ? 'text-green-400' : h.qty_change < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {h.qty_change > 0 ? `+${h.qty_change}` : h.qty_change}
                    </span>
                  </TD>
                  <TD align="center"><span className="text-white font-semibold">{h.qty_after}</span></TD>
                  <TD>
                    <div className="text-gray-300 text-xs">{h.reason}</div>
                    {h.notes && <div className="text-gray-600 text-xs">{h.notes}</div>}
                  </TD>
                </TRow>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* AUDIT TAB */}
      {tab === 'audit' && (
        <div className="space-y-4">
          {!auditMode ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <History size={40} className="text-gray-700 mx-auto mb-4"/>
              <h3 className="text-white font-semibold text-lg mb-2">Physical Stock Audit</h3>
              <p className="text-gray-500 text-sm mb-6">Count your actual physical stock and enter the numbers here. System will auto-calculate differences and update stock levels.</p>
              <Btn variant="primary" onClick={startAudit}><History size={14}/>Start Audit</Btn>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 font-semibold text-sm">🔍 Audit in Progress</p>
                  <p className="text-gray-400 text-xs">Enter actual physical count for each part. Leave unchanged if stock matches.</p>
                </div>
                <div className="flex gap-2">
                  <Btn variant="secondary" size="sm" onClick={() => setAuditMode(false)}>Cancel</Btn>
                  <Btn variant="primary" size="sm" onClick={saveAudit}>Save Audit</Btn>
                </div>
              </div>
              <SearchBar value={search} onChange={setSearch} placeholder="Search part..."/>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs text-gray-500">
                      <th className="text-left px-4 py-3">PART</th>
                      <th className="text-center px-4 py-3">SYSTEM STOCK</th>
                      <th className="text-center px-4 py-3">PHYSICAL COUNT</th>
                      <th className="text-center px-4 py-3">DIFFERENCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParts.map(p => {
                      const counted = parseFloat(auditCounts[p.id]) || p.stock;
                      const diff = counted - p.stock;
                      return (
                        <tr key={p.id} className={`border-b border-gray-800/40 ${diff !== 0 ? 'bg-yellow-500/5' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="text-white text-sm">{p.name}</div>
                            <div className="text-gray-500 text-xs">{p.code} · {p.location || '—'}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-gray-300 font-semibold">{p.stock}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number" min="0"
                              value={auditCounts[p.id] ?? p.stock}
                              onChange={e => setAuditCounts(prev => ({ ...prev, [p.id]: e.target.value }))}
                              className="w-20 text-center bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-orange-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                              {diff > 0 ? `+${diff}` : diff === 0 ? '—' : diff}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                <Btn variant="secondary" onClick={() => setAuditMode(false)}>Cancel</Btn>
                <Btn variant="primary" onClick={saveAudit}>Save Audit Results</Btn>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adjustment Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Stock Adjustment" size="md">
        <div className="p-5 space-y-4">

          {/* Adjustment Type */}
          <div>
            <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Adjustment Type</p>
            <div className="grid grid-cols-2 gap-2">
              {ADJ_TYPES.map(type => (
                <button key={type.value} onClick={() => f('adj_type', type.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${form.adj_type === type.value ? type.bg + ' border-2' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}>
                  <type.icon size={14} className={form.adj_type === type.value ? type.color : 'text-gray-500'}/>
                  <span className={`text-xs font-medium ${form.adj_type === type.value ? type.color : 'text-gray-400'}`}>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Part Selection */}
          <Field label="Select Part" required>
            <Select value={form.part_id} onChange={e => f('part_id', e.target.value)}>
              <option value="">— Choose part —</option>
              {parts.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code}) — Stock: {p.stock}</option>
              ))}
            </Select>
          </Field>

          {/* Current stock preview */}
          {selectedPart && (
            <div className="bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{selectedPart.name}</p>
                <p className="text-gray-500 text-xs">{selectedPart.code} · {selectedPart.brand}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs">Current Stock</p>
                <p className="text-white font-bold text-lg">{selectedPart.stock} <span className="text-gray-500 text-sm">{selectedPart.unit}</span></p>
              </div>
            </div>
          )}

          {/* Transfer to part */}
          {form.adj_type === 'transfer' && (
            <Field label="Transfer To Part" required>
              <Select value={form.to_part_id} onChange={e => f('to_part_id', e.target.value)}>
                <option value="">— Choose target part —</option>
                {parts.filter(p => p.id !== form.part_id).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code}) — Stock: {p.stock}</option>
                ))}
              </Select>
            </Field>
          )}

          {/* Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={form.adj_type === 'set' || form.adj_type === 'audit' ? 'Set Stock To' : 'Quantity'} required>
              <Input type="number" min="0" step="1" value={form.qty}
                onChange={e => f('qty', e.target.value)}
                placeholder={form.adj_type === 'set' ? 'Enter exact quantity' : 'Enter quantity'}/>
            </Field>
            <Field label="Date">
              <Input type="date" value={form.date} onChange={e => f('date', e.target.value)}/>
            </Field>
          </div>

          {/* New stock preview */}
          {selectedPart && form.qty && (
            <div className={`rounded-xl px-4 py-3 border flex items-center justify-between ${adjType?.bg}`}>
              <span className="text-gray-400 text-sm">New Stock Will Be</span>
              <span className={`font-bold text-xl ${adjType?.color}`}>{getNewStock()} {selectedPart.unit}</span>
            </div>
          )}

          {/* Reason */}
          <Field label="Reason" required>
            <Select value={form.reason} onChange={e => f('reason', e.target.value)}>
              <option value="">— Select reason —</option>
              {(REASONS[form.adj_type] || []).map(r => <option key={r}>{r}</option>)}
              <option value="Other">Other</option>
            </Select>
          </Field>

          <Field label="Notes (optional)">
            <Textarea value={form.notes} onChange={e => f('notes', e.target.value)}
              rows={2} placeholder="Any additional details..."/>
          </Field>

          <div className="flex gap-3">
            <Btn variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Btn>
            <Btn variant="primary" className="flex-1"
              onClick={saveAdjustment}
              disabled={!form.part_id || !form.qty || !form.reason}>
              Save Adjustment
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
