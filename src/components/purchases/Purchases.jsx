import { useState } from 'react';
import { Plus, ChevronLeft, X, Search } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { Modal, Badge, Btn, SearchBar, PageHeader, Table, THead, TRow, TD, Field, Input, Select, Textarea } from '../shared/UI';
import { fmt, fmtDate, calcInvoiceTotals, today } from '../../utils/helpers';

export default function Purchases() {
  const { t, purchases, addPurchase, suppliers, parts, nextPurchaseNo } = useApp();
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [selSupplier, setSelSupplier] = useState(null);
  const [supSearch, setSupSearch] = useState('');
  const [items, setItems] = useState([]);
  const [partSearch, setPartSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [purDate, setPurDate] = useState(today());
  const [supInvoice, setSupInvoice] = useState('');
  const [payMode, setPayMode] = useState('Credit');
  const [notes, setNotes] = useState('');

  const filteredParts = parts.filter(p => !partSearch || p.name?.toLowerCase().includes(partSearch.toLowerCase()) || p.code?.toLowerCase().includes(partSearch.toLowerCase()));
  const filteredSup = suppliers.filter(s => s.name?.toLowerCase().includes(supSearch.toLowerCase()) || s.phone?.includes(supSearch));

  const addPart = (part) => {
    const ex = items.find(i=>i.part_id===part.id);
    if (ex) { setItems(items.map(i=>i.part_id===part.id?{...i,qty:i.qty+1}:i)); }
    else { setItems([...items, {part_id:part.id, part_code:part.code, part_name:part.name, hsn_code:part.hsn_code, qty:1, unit:part.unit||'PCS', rate:part.purchase_price, gst_rate:part.gst_rate, discount_pct:0}]); }
    setShowPicker(false); setPartSearch('');
  };
  const updateItem = (id, k, v) => setItems(items.map(i=>i.part_id===id?{...i,[k]:parseFloat(v)||0}:i));
  const removeItem = (id) => setItems(items.filter(i=>i.part_id!==id));
  const totals = calcInvoiceTotals(items, 0, 'intrastate');

  const handleSave = () => {
    if (!selSupplier || items.length===0) return;
    addPurchase({
      id:`pur_${Date.now()}`, purchase_no:nextPurchaseNo(), purchase_date:purDate,
      supplier_id:selSupplier.id, supplier_name:selSupplier.name, supplier_invoice:supInvoice,
      ...totals, paid_amount:payMode!=='Credit'?totals.grand_total:0,
      balance_due:payMode==='Credit'?totals.grand_total:0, payment_mode:payMode,
      status:'received', notes, items,
    });
    setItems([]); setSelSupplier(null); setSupInvoice(''); setNotes('');
    setView('list');
  };

  if (view==='new') return (
    <div className="space-y-4">
      <div className="flex items-center gap-3"><button onClick={()=>setView('list')} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"><ChevronLeft size={20}/></button><h2 className="text-white font-bold text-xl">New Purchase</h2></div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 grid grid-cols-2 gap-3">
            <Field label="Purchase Date"><Input type="date" value={purDate} onChange={e=>setPurDate(e.target.value)}/></Field>
            <Field label="Supplier Invoice No"><Input value={supInvoice} onChange={e=>setSupInvoice(e.target.value)} placeholder="TVS/JAN/001"/></Field>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-2 uppercase">Supplier</p>
            {selSupplier ? (
              <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <div><div className="text-white font-semibold">{selSupplier.name}</div><div className="text-gray-400 text-xs">{selSupplier.phone}</div></div>
                <button onClick={()=>setSelSupplier(null)} className="text-gray-500 hover:text-red-400"><X size={16}/></button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-500"/>
                <input value={supSearch} onChange={e=>setSupSearch(e.target.value)} placeholder="Search supplier..." className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"/>
                {supSearch&&<div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl mt-1 z-20 overflow-hidden">
                  {filteredSup.slice(0,5).map(s=><button key={s.id} onClick={()=>{setSelSupplier(s);setSupSearch('');}} className="w-full text-left px-4 py-2.5 hover:bg-gray-700 text-white text-sm">{s.name}<div className="text-gray-400 text-xs">{s.phone}</div></button>)}
                </div>}
              </div>
            )}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="text-gray-400 text-xs uppercase">Items ({items.length})</span>
              <button onClick={()=>setShowPicker(!showPicker)} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"><Plus size={13}/>Add Part</button>
            </div>
            {showPicker&&<div className="p-3 border-b border-gray-800 bg-gray-950">
              <SearchBar value={partSearch} onChange={setPartSearch} placeholder="Search part..." className="mb-2"/>
              <div className="max-h-44 overflow-y-auto space-y-1">
                {filteredParts.slice(0,8).map(p=><button key={p.id} onClick={()=>addPart(p)} className="w-full text-left bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 flex items-center justify-between text-sm transition-colors"><div><span className="text-white">{p.name}</span><span className="text-gray-500 text-xs ml-2">{p.code}</span></div><span className="text-orange-400 font-semibold">{fmt(p.purchase_price)}</span></button>)}
              </div>
            </div>}
            {items.length===0?<div className="text-center py-10 text-gray-600 text-sm">Add parts above</div>:(
              <table className="w-full text-sm"><thead><tr className="border-b border-gray-800 text-xs text-gray-500"><th className="text-left px-4 py-2">PART</th><th className="text-center px-2 py-2 w-16">QTY</th><th className="text-right px-2 py-2 w-24">RATE ₹</th><th className="text-right px-4 py-2 w-28">TOTAL</th><th className="w-8"></th></tr></thead>
              <tbody>{items.map(item=>{const t2=item.qty*item.rate; return(
                <tr key={item.part_id} className="border-b border-gray-800/40">
                  <td className="px-4 py-2"><div className="text-white text-sm">{item.part_name}</div><div className="text-gray-500 text-xs">{item.part_code} · GST:{item.gst_rate}%</div></td>
                  <td className="px-2 py-2"><input type="number" value={item.qty} onChange={e=>updateItem(item.part_id,'qty',e.target.value)} className="w-16 text-center bg-gray-800 border border-gray-700 text-white rounded px-1 py-1 text-sm focus:outline-none focus:border-orange-500"/></td>
                  <td className="px-2 py-2"><input type="number" value={item.rate} onChange={e=>updateItem(item.part_id,'rate',e.target.value)} className="w-24 text-right bg-gray-800 border border-gray-700 text-white rounded px-1 py-1 text-sm focus:outline-none focus:border-orange-500"/></td>
                  <td className="px-4 py-2 text-right text-white font-semibold">{fmt(t2*(1+item.gst_rate/100))}</td>
                  <td className="pr-2"><button onClick={()=>removeItem(item.part_id)} className="text-gray-600 hover:text-red-400 p-1"><X size={13}/></button></td>
                </tr>);})}</tbody></table>
            )}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4 h-fit">
          <h3 className="text-gray-400 text-xs uppercase">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span className="text-white">{fmt(totals.subtotal)}</span></div>
            <div className="flex justify-between text-gray-400"><span>CGST</span><span className="text-white">{fmt(totals.cgst_amt)}</span></div>
            <div className="flex justify-between text-gray-400"><span>SGST</span><span className="text-white">{fmt(totals.sgst_amt)}</span></div>
            <div className="flex justify-between text-white font-bold text-base border-t border-gray-700 pt-2"><span>Total</span><span className="text-orange-400">{fmt(totals.grand_total)}</span></div>
          </div>
          <div><p className="text-gray-500 text-xs mb-2 uppercase">Payment Mode</p>
            <div className="grid grid-cols-2 gap-1.5">{['Cash','Credit','Cheque','NEFT'].map(m=><button key={m} onClick={()=>setPayMode(m)} className={`py-2 rounded-lg text-xs font-semibold transition-colors ${payMode===m?'bg-orange-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{m}</button>)}</div>
          </div>
          <Field label="Notes"><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-none"/></Field>
          <button onClick={handleSave} disabled={!selSupplier||items.length===0} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors text-sm">Save Purchase</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader title={t.purchases} subtitle={`${purchases.length} purchases`}>
        <Btn variant="primary" onClick={()=>setView('new')}><Plus size={15}/>New Purchase</Btn>
      </PageHeader>
      <SearchBar value={search} onChange={setSearch} placeholder="Search purchase no, supplier..."/>
      <Table>
        <THead cols={[{label:'PURCHASE NO'},{label:'SUPPLIER'},{label:'DATE',hidden:'hidden md:table-cell'},{label:'SUPPLIER INV',hidden:'hidden lg:table-cell'},{label:'TOTAL',align:'right'},{label:'MODE',hidden:'hidden md:table-cell'},{label:'STATUS',align:'center'}]}/>
        <tbody>
          {purchases.filter(p=>!search||p.purchase_no?.toLowerCase().includes(search.toLowerCase())||p.supplier_name?.toLowerCase().includes(search.toLowerCase())).map(p=>(
            <TRow key={p.id}>
              <TD><span className="text-orange-400 font-mono text-xs">{p.purchase_no}</span></TD>
              <TD><span className="text-white">{p.supplier_name}</span></TD>
              <TD className="hidden md:table-cell"><span className="text-gray-400 text-xs">{fmtDate(p.purchase_date)}</span></TD>
              <TD className="hidden lg:table-cell"><span className="text-gray-400 text-xs">{p.supplier_invoice||'—'}</span></TD>
              <TD align="right"><span className="text-white font-semibold">{fmt(p.grand_total)}</span>{p.balance_due>0&&<div className="text-red-400 text-xs">Due:{fmt(p.balance_due)}</div>}</TD>
              <TD className="hidden md:table-cell"><span className="text-gray-400 text-xs">{p.payment_mode}</span></TD>
              <TD align="center"><Badge status={p.status}/></TD>
            </TRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
