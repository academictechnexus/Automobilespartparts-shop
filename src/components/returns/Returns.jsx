import { useState } from 'react';
import { Plus, ChevronLeft, X, Search, RefreshCw } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { Modal, Badge, Btn, SearchBar, PageHeader, Table, THead, TRow, TD, Field, Input, Select, Textarea } from '../shared/UI';
import { fmt, fmtDate, today } from '../../utils/helpers';

const RETURN_REASONS = {
  sales_return: ['Wrong part supplied', 'Defective/damaged part', 'Customer changed mind', 'Part not needed', 'Duplicate order'],
  purchase_return: ['Damaged in transit', 'Wrong item received', 'Quality issue', 'Excess quantity', 'Price dispute'],
};

export default function Returns() {
  const { returns, addReturn, invoices, purchases, parts, customers, suppliers, nextReturnNo } = useApp();
  const [tab, setTab] = useState('list');
  const [returnType, setReturnType] = useState('sales_return');
  const [search, setSearch] = useState('');
  const [refSearch, setRefSearch] = useState('');
  const [selRef, setSelRef] = useState(null);
  const [selItems, setSelItems] = useState([]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(today());

  // Filter source invoices/purchases
  const refList = returnType === 'sales_return'
    ? invoices.filter(i => !i.is_cancelled && (i.customer_name?.toLowerCase().includes(refSearch.toLowerCase()) || i.invoice_no?.toLowerCase().includes(refSearch.toLowerCase())))
    : purchases.filter(p => p.supplier_name?.toLowerCase().includes(refSearch.toLowerCase()) || p.purchase_no?.toLowerCase().includes(refSearch.toLowerCase()));

  const selectRef = (ref) => {
    setSelRef(ref);
    setSelItems((ref.items || []).map(item => ({ ...item, return_qty: item.qty, selected: true })));
    setRefSearch('');
  };

  const toggleItem = (idx) => setSelItems(prev => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));
  const setReturnQty = (idx, qty) => setSelItems(prev => prev.map((item, i) => i === idx ? { ...item, return_qty: Math.min(parseFloat(qty)||0, item.qty) } : item));

  const selectedItems = selItems.filter(i => i.selected && i.return_qty > 0);
  const grandTotal = selectedItems.reduce((s, item) => s + (item.return_qty * item.rate), 0);

  const handleSave = () => {
    if (!selRef || selectedItems.length === 0 || !reason) return;
    const ret = {
      return_type: returnType,
      return_date: date,
      ref_invoice_id: selRef.id,
      ref_invoice_no: selRef.invoice_no || selRef.purchase_no,
      party_id: returnType === 'sales_return' ? selRef.customer_id : selRef.supplier_id,
      party_name: returnType === 'sales_return' ? selRef.customer_name : selRef.supplier_name,
      items: selectedItems.map(item => ({
        part_id: item.part_id,
        part_name: item.part_name,
        qty: item.return_qty,
        rate: item.rate,
        gst_rate: item.gst_rate || 18,
        total_amt: item.return_qty * item.rate,
      })),
      taxable_amt: grandTotal,
      grand_total: grandTotal * 1.18,
      reason, notes,
    };
    addReturn(ret);
    setSelRef(null); setSelItems([]); setReason(''); setNotes('');
    setTab('list');
  };

  const filtered = returns.filter(r => {
    const ms = !search || r.return_no?.toLowerCase().includes(search.toLowerCase()) || r.party_name?.toLowerCase().includes(search.toLowerCase());
    const mt = tab === 'list' || r.return_type === returnType;
    return ms;
  });

  if (tab === 'new') return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setTab('list')} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"><ChevronLeft size={20}/></button>
        <h2 className="text-white font-bold text-xl">New Return</h2>
      </div>

      {/* Return type selector */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'sales_return', label: 'Sales Return', sub: 'Customer returning goods', color: 'border-orange-500 bg-orange-500/10' },
          { key: 'purchase_return', label: 'Purchase Return', sub: 'Returning goods to supplier', color: 'border-blue-500 bg-blue-500/10' },
        ].map(rt => (
          <button key={rt.key} onClick={() => { setReturnType(rt.key); setSelRef(null); setSelItems([]); }}
            className={`p-4 rounded-xl border-2 text-left transition-colors ${returnType === rt.key ? rt.color : 'border-gray-800 bg-gray-900 hover:border-gray-700'}`}>
            <p className={`font-semibold text-sm ${returnType === rt.key ? 'text-white' : 'text-gray-300'}`}>{rt.label}</p>
            <p className="text-gray-500 text-xs mt-0.5">{rt.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {/* Reference Invoice/Purchase */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">
              {returnType === 'sales_return' ? 'Select Original Invoice' : 'Select Original Purchase'}
            </p>
            {selRef ? (
              <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <div>
                  <div className="text-white font-semibold">{selRef.invoice_no || selRef.purchase_no}</div>
                  <div className="text-gray-400 text-xs">{selRef.customer_name || selRef.supplier_name} · {fmt(selRef.grand_total)}</div>
                </div>
                <button onClick={() => { setSelRef(null); setSelItems([]); }} className="text-gray-500 hover:text-red-400"><X size={16}/></button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-500"/>
                <input value={refSearch} onChange={e => setRefSearch(e.target.value)}
                  placeholder={`Search ${returnType === 'sales_return' ? 'invoice no or customer' : 'purchase no or supplier'}...`}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"/>
                {refSearch && (
                  <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl mt-1 z-20 max-h-48 overflow-y-auto shadow-xl">
                    {refList.slice(0, 6).map(ref => (
                      <button key={ref.id} onClick={() => selectRef(ref)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-0">
                        <div className="text-white text-sm font-medium">{ref.invoice_no || ref.purchase_no}</div>
                        <div className="text-gray-400 text-xs">{ref.customer_name || ref.supplier_name} · {fmtDate(ref.invoice_date || ref.purchase_date)} · {fmt(ref.grand_total)}</div>
                      </button>
                    ))}
                    {refList.length === 0 && <div className="px-4 py-3 text-gray-500 text-sm">No records found</div>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items to return */}
          {selRef && selItems.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800">
                <p className="text-gray-400 text-xs uppercase tracking-wide">Select Items to Return</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500">
                    <th className="w-8 px-4 py-2"></th>
                    <th className="text-left px-4 py-2">PART</th>
                    <th className="text-center px-2 py-2">ORIG QTY</th>
                    <th className="text-center px-2 py-2">RETURN QTY</th>
                    <th className="text-right px-4 py-2">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {selItems.map((item, idx) => (
                    <tr key={idx} className={`border-b border-gray-800/40 ${!item.selected ? 'opacity-40' : ''}`}>
                      <td className="px-4 py-2.5">
                        <input type="checkbox" checked={item.selected} onChange={() => toggleItem(idx)}
                          className="rounded accent-orange-500 cursor-pointer"/>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-white text-sm">{item.part_name}</div>
                        <div className="text-gray-500 text-xs">{item.part_code}</div>
                      </td>
                      <td className="px-2 py-2.5 text-center text-gray-400">{item.qty}</td>
                      <td className="px-2 py-2.5 text-center">
                        <input type="number" min="0" max={item.qty} step="1"
                          value={item.return_qty} onChange={e => setReturnQty(idx, e.target.value)}
                          className="w-16 text-center bg-gray-800 border border-gray-700 text-white rounded-lg px-1 py-1 text-sm focus:outline-none focus:border-orange-500"/>
                      </td>
                      <td className="px-4 py-2.5 text-right text-white font-medium">{fmt(item.return_qty * item.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
            <h3 className="text-gray-400 text-xs uppercase tracking-wide">Return Summary</h3>

            <Field label="Return Date"><Input type="date" value={date} onChange={e => setDate(e.target.value)}/></Field>

            <Field label="Reason" required>
              <Select value={reason} onChange={e => setReason(e.target.value)}>
                <option value="">— Select reason —</option>
                {(RETURN_REASONS[returnType] || []).map(r => <option key={r}>{r}</option>)}
                <option>Other</option>
              </Select>
            </Field>

            <Field label="Notes">
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional details..."/>
            </Field>

            {selectedItems.length > 0 && (
              <div className="space-y-2 text-sm border-t border-gray-800 pt-3">
                <div className="flex justify-between text-gray-400"><span>Items</span><span>{selectedItems.length}</span></div>
                <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>{fmt(grandTotal)}</span></div>
                <div className="flex justify-between text-white font-bold text-base">
                  <span>Total Credit</span>
                  <span className="text-orange-400">{fmt(grandTotal)}</span>
                </div>
              </div>
            )}

            <button onClick={handleSave}
              disabled={!selRef || selectedItems.length === 0 || !reason}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors text-sm">
              Process Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Returns" subtitle={`${returns.length} returns processed`}>
        <Btn variant="primary" onClick={() => setTab('new')}><Plus size={15}/>New Return</Btn>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Returns', val: returns.length, c: 'text-white' },
          { label: 'Sales Returns', val: returns.filter(r => r.return_type === 'sales_return').length, c: 'text-orange-400' },
          { label: 'Purchase Returns', val: returns.filter(r => r.return_type === 'purchase_return').length, c: 'text-blue-400' },
          { label: 'Total Value', val: fmt(returns.reduce((s, r) => s + (r.grand_total || 0), 0)), c: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`font-bold text-xl ${s.c}`}>{s.val}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <SearchBar value={search} onChange={setSearch} placeholder="Search return no, customer, supplier..." className="flex-1 min-w-52"/>
      </div>

      <Table>
        <THead cols={[
          { label: 'RETURN NO' }, { label: 'TYPE' }, { label: 'PARTY' },
          { label: 'REF INVOICE', hidden: 'hidden md:table-cell' },
          { label: 'DATE', hidden: 'hidden md:table-cell' },
          { label: 'REASON', hidden: 'hidden lg:table-cell' },
          { label: 'AMOUNT', align: 'right' },
        ]}/>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={7} className="text-center py-12 text-gray-600 text-sm">
              No returns yet. Click "New Return" to process a return.
            </td></tr>
          )}
          {filtered.map(r => (
            <TRow key={r.id}>
              <TD><span className="text-orange-400 font-mono text-xs">{r.return_no}</span></TD>
              <TD>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.return_type === 'sales_return' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {r.return_type === 'sales_return' ? 'Sales' : 'Purchase'}
                </span>
              </TD>
              <TD><span className="text-white text-sm">{r.party_name}</span></TD>
              <TD className="hidden md:table-cell"><span className="text-gray-400 text-xs">{r.ref_invoice_no || '—'}</span></TD>
              <TD className="hidden md:table-cell"><span className="text-gray-400 text-xs">{fmtDate(r.return_date)}</span></TD>
              <TD className="hidden lg:table-cell"><span className="text-gray-500 text-xs">{r.reason}</span></TD>
              <TD align="right"><span className="text-red-400 font-semibold">{fmt(r.grand_total)}</span></TD>
            </TRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
