import { useState } from 'react';
import { Plus, ChevronLeft, X, Search, Eye, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { Modal, Badge, Btn, SearchBar, PageHeader, Table, THead, TRow, TD, Field, Input, Select, Textarea, Confirm } from '../shared/UI';
import { fmt, fmtDate, calcInvoiceTotals, today } from '../../utils/helpers';
import { CustomFieldsSection } from '../../hooks/useCustomFields';

const PAYMENT_MODES = ['Credit','Cash','Cheque','NEFT','UPI'];
const FREIGHT_MODES = ['Road','Rail','Air','Sea','Courier','Hand Delivery'];

export default function Purchases() {
  const { t, purchases, addPurchase, updatePurchase, deletePurchase, suppliers, parts, nextPurchaseNo } = useApp();
  const [view, setView]             = useState('list');
  const [search, setSearch]         = useState('');
  const [viewPur, setViewPur]       = useState(null);
  const [editId, setEditId]         = useState(null);
  const [confirmId, setConfirmId]   = useState(null);

  // Form state
  const [selSupplier, setSelSupplier] = useState(null);
  const [supSearch, setSupSearch]     = useState('');
  const [items, setItems]             = useState([]);
  const [partSearch, setPartSearch]   = useState('');
  const [showPicker, setShowPicker]   = useState(false);
  const [purDate, setPurDate]         = useState(today());
  const [supInvoice, setSupInvoice]   = useState('');
  const [payMode, setPayMode]         = useState('Credit');
  const [notes, setNotes]             = useState('');
  // Extra fields
  const [transport, setTransport]     = useState('');
  const [loading, setLoading]         = useState('');
  const [freightMode, setFreightMode] = useState('Road');
  const [lrNumber, setLrNumber]       = useState('');
  const [vehicleNo, setVehicleNo]     = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [qualityChecked, setQualityChecked] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');
  // Custom fields
  const [customFields, setCustomFields] = useState({});
  const setCustomField = (name, val) => setCustomFields(p => ({ ...p, [name]: val }));

  const filteredSup  = suppliers.filter(s => s.name?.toLowerCase().includes(supSearch.toLowerCase()) || s.phone?.includes(supSearch));
  const filteredParts = parts.filter(p => !partSearch || p.name?.toLowerCase().includes(partSearch.toLowerCase()) || p.code?.toLowerCase().includes(partSearch.toLowerCase()));


  const openEdit = (p) => {
    setSelSupplier(suppliers.find(s=>s.id===p.supplier_id)||{id:p.supplier_id,name:p.supplier_name,phone:''});
    setItems(p.items||[]);
    setPurDate(p.purchase_date||today());
    setSupInvoice(p.supplier_invoice||'');
    setPayMode(p.payment_mode||'Credit');
    setNotes(p.notes||'');
    setTransport(p.transport_charges||'');
    setLoading(p.loading_charges||'');
    setFreightMode(p.freight_mode||'Road');
    setLrNumber(p.lr_number||'');
    setVehicleNo(p.vehicle_no||'');
    setExpectedDate(p.expected_date||'');
    setQualityChecked(p.quality_checked||false);
    setInspectionNotes(p.inspection_notes||'');
    setCustomFields(p.custom_fields||{});
    setEditId(p.id);
    setView('new');
  };

  const addPart = (part) => {
    const ex = items.find(i => i.part_id === part.id);
    if (ex) { setItems(items.map(i => i.part_id===part.id ? {...i, qty:i.qty+1} : i)); }
    else { setItems([...items, { part_id:part.id, part_code:part.code, part_name:part.name, hsn_code:part.hsn_code, qty:1, unit:part.unit||'PCS', rate:part.purchase_price, gst_rate:part.gst_rate }]); }
    setShowPicker(false); setPartSearch('');
  };

  const updateItem = (id, k, v) => setItems(items.map(i => i.part_id===id ? {...i,[k]:parseFloat(v)||0} : i));
  const removeItem = (id)        => setItems(items.filter(i => i.part_id!==id));

  const totals = calcInvoiceTotals(items, 0, 'intrastate');
  const transportAmt = (+transport||0) + (+loading||0);
  const grandTotalWithExtra = totals.grand_total + transportAmt;

  const resetForm = () => {
    setEditId(null);
    setSelSupplier(null); setItems([]); setSupInvoice(''); setNotes('');
    setTransport(''); setLoading(''); setFreightMode('Road'); setLrNumber('');
    setVehicleNo(''); setExpectedDate(''); setQualityChecked(false);
    setInspectionNotes(''); setCustomFields({});
  };

  const handleSave = () => {
    if (!selSupplier || items.length===0) return;
    const purData = {
      id:`pur_${Date.now()}`, purchase_no:nextPurchaseNo(), purchase_date:purDate,
      supplier_id:selSupplier.id, supplier_name:selSupplier.name, supplier_invoice:supInvoice,
      ...totals,
      grand_total: grandTotalWithExtra,
      transport_charges:+transport||0,
      loading_charges:+loading||0,
      freight_mode:freightMode, lr_number:lrNumber,
      vehicle_no:vehicleNo, expected_date:expectedDate,
      quality_checked:qualityChecked, inspection_notes:inspectionNotes,
      paid_amount: payMode!=='Credit' ? grandTotalWithExtra : 0,
      balance_due: payMode==='Credit' ? grandTotalWithExtra : 0,
      payment_mode:payMode, status:'received', notes,
      custom_fields: customFields,
      items,
    };
    if (editId) {
      updatePurchase(editId, purData);
    } else {
      addPurchase(purData);
    }
    resetForm();
    setEditId(null);
    setView('list');
  };

  if (view === 'new') return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={()=>{setView('list');resetForm();}} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"><ChevronLeft size={20}/></button>
        <h2 className="text-white font-bold text-xl">{editId ? 'Edit Purchase' : 'New Purchase Order'}</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">

          {/* Purchase meta */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Purchase Date"><Input type="date" value={purDate} onChange={e=>setPurDate(e.target.value)}/></Field>
            <Field label="Supplier Invoice No"><Input value={supInvoice} onChange={e=>setSupInvoice(e.target.value)} placeholder="SUP/JAN/001"/></Field>
            <Field label="Expected Delivery"><Input type="date" value={expectedDate} onChange={e=>setExpectedDate(e.target.value)}/></Field>
          </div>

          {/* Supplier */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-2 uppercase">Supplier *</p>
            {selSupplier ? (
              <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <div><div className="text-white font-semibold">{selSupplier.name}</div><div className="text-gray-400 text-xs">{selSupplier.phone} {selSupplier.gst_no?`· GST: ${selSupplier.gst_no}`:''}</div></div>
                <button onClick={()=>setSelSupplier(null)} className="text-gray-500 hover:text-red-400"><X size={16}/></button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-500"/>
                <input value={supSearch} onChange={e=>setSupSearch(e.target.value)} placeholder="Search supplier name or phone..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"/>
                {supSearch&&(
                  <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl mt-1 z-20 overflow-hidden shadow-xl">
                    {filteredSup.slice(0,5).map(s=>(
                      <button key={s.id} onClick={()=>{setSelSupplier(s);setSupSearch('');}}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-700 border-b border-gray-700 last:border-0 transition-colors">
                        <div className="text-white text-sm font-medium">{s.name}</div>
                        <div className="text-gray-400 text-xs">{s.phone} {s.city?`· ${s.city}`:''}</div>
                      </button>
                    ))}
                    {filteredSup.length===0&&<div className="px-4 py-3 text-gray-500 text-sm">No supplier found</div>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="text-gray-400 text-xs uppercase">Items ({items.length}) *</span>
              <button onClick={()=>setShowPicker(!showPicker)}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                <Plus size={13}/> Add Part
              </button>
            </div>
            {showPicker&&(
              <div className="p-3 border-b border-gray-800 bg-gray-950">
                <input value={partSearch} onChange={e=>setPartSearch(e.target.value)} placeholder="Search part..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 mb-2"/>
                <div className="max-h-44 overflow-y-auto space-y-1">
                  {filteredParts.slice(0,8).map(p=>(
                    <button key={p.id} onClick={()=>addPart(p)}
                      className="w-full text-left bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 flex items-center justify-between text-sm transition-colors">
                      <div>
                        <span className="text-white font-medium">{p.name}</span>
                        <span className="text-gray-500 text-xs ml-2">{p.code}</span>
                        <div className="text-gray-600 text-xs">{p.make} {p.model}</div>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="text-orange-400 font-semibold">{fmt(p.purchase_price)}</div>
                        <div className="text-gray-600 text-xs">Stock: {p.stock}</div>
                      </div>
                    </button>
                  ))}
                  {filteredParts.length===0&&<p className="text-gray-600 text-sm text-center py-4">No parts found</p>}
                </div>
              </div>
            )}
            {items.length===0 ? (
              <div className="text-center py-10 text-gray-600 text-sm">Add parts to purchase above</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 text-xs text-gray-500">
                    <th className="text-left px-4 py-2">PART</th>
                    <th className="text-center px-2 py-2 w-16">QTY</th>
                    <th className="text-right px-2 py-2 w-24">RATE ₹</th>
                    <th className="text-right px-4 py-2 w-28">TOTAL</th>
                    <th className="w-8"></th>
                  </tr></thead>
                  <tbody>
                    {items.map(item=>{
                      const lineTotal = item.qty * item.rate * (1 + item.gst_rate/100);
                      return (
                        <tr key={item.part_id} className="border-b border-gray-800/40">
                          <td className="px-4 py-2">
                            <div className="text-white text-sm">{item.part_name}</div>
                            <div className="text-gray-500 text-xs">{item.part_code} · GST:{item.gst_rate}%</div>
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" value={item.qty} onChange={e=>updateItem(item.part_id,'qty',e.target.value)}
                              className="w-16 text-center bg-gray-800 border border-gray-700 text-white rounded px-1 py-1 text-sm focus:outline-none focus:border-orange-500"/>
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" value={item.rate} onChange={e=>updateItem(item.part_id,'rate',e.target.value)}
                              className="w-24 text-right bg-gray-800 border border-gray-700 text-white rounded px-1 py-1 text-sm focus:outline-none focus:border-orange-500"/>
                          </td>
                          <td className="px-4 py-2 text-right text-white font-semibold">{fmt(lineTotal)}</td>
                          <td className="pr-2"><button onClick={()=>removeItem(item.part_id)} className="text-gray-600 hover:text-red-400 p-1"><X size={13}/></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transport & Freight — Extra Fields */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Transport & Freight Details</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Transport Charges ₹"><Input type="number" value={transport} onChange={e=>setTransport(e.target.value)} placeholder="0.00"/></Field>
              <Field label="Loading / Unloading ₹"><Input type="number" value={loading} onChange={e=>setLoading(e.target.value)} placeholder="0.00"/></Field>
              <Field label="Freight Mode">
                <Select value={freightMode} onChange={e=>setFreightMode(e.target.value)}>
                  {FREIGHT_MODES.map(m=><option key={m}>{m}</option>)}
                </Select>
              </Field>
              <Field label="LR / Docket Number"><Input value={lrNumber} onChange={e=>setLrNumber(e.target.value)} placeholder="Lorry receipt no"/></Field>
              <Field label="Vehicle Number"><Input value={vehicleNo} onChange={e=>setVehicleNo(e.target.value)} placeholder="TN 37 AB 1234"/></Field>
              <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
                <button type="button" onClick={()=>setQualityChecked(!qualityChecked)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${qualityChecked?'bg-green-500':'bg-gray-700'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${qualityChecked?'left-5':'left-0.5'}`}/>
                </button>
                <div>
                  <p className="text-white text-xs font-medium">Quality Checked</p>
                  <p className="text-gray-500 text-xs">Items inspected on receipt</p>
                </div>
              </div>
            </div>
            {qualityChecked&&(
              <div className="mt-3">
                <Field label="Inspection Notes">
                  <Textarea value={inspectionNotes} onChange={e=>setInspectionNotes(e.target.value)} rows={2} placeholder="Quality inspection notes..."/>
                </Field>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          <CustomFieldsSection module="purchase" values={customFields} onChange={setCustomField}/>
        </div>

        {/* RIGHT: Summary */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
            <h3 className="text-gray-400 text-xs uppercase tracking-wide">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400"><span>Subtotal</span><span className="text-white">{fmt(totals.subtotal)}</span></div>
              <div className="flex justify-between text-gray-400 text-xs"><span>CGST</span><span>{fmt(totals.cgst_amt)}</span></div>
              <div className="flex justify-between text-gray-400 text-xs"><span>SGST</span><span>{fmt(totals.sgst_amt)}</span></div>
              <div className="flex justify-between text-gray-400 text-xs"><span>Total GST</span><span>{fmt(totals.total_gst)}</span></div>
              {transportAmt>0&&<div className="flex justify-between text-gray-400 text-xs"><span>Transport + Loading</span><span>{fmt(transportAmt)}</span></div>}
              <div className="border-t border-gray-700 pt-2 flex justify-between text-white font-bold">
                <span>Grand Total</span>
                <span className="text-orange-400 text-lg">{fmt(grandTotalWithExtra)}</span>
              </div>
            </div>

            <div>
              <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide">Payment Mode</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PAYMENT_MODES.map(m=>(
                  <button key={m} onClick={()=>setPayMode(m)}
                    className={`py-2 rounded-lg text-xs font-semibold transition-colors ${payMode===m?'bg-orange-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{m}</button>
                ))}
              </div>
            </div>

            <Field label="Notes">
              <Textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Additional notes..."/>
            </Field>

            {(!selSupplier||items.length===0)&&(
              <p className="text-yellow-400 text-xs text-center">{!selSupplier?'⚠ Select a supplier first':'⚠ Add at least one part'}</p>
            )}

            <button onClick={handleSave} disabled={!selSupplier||items.length===0}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors text-sm">
              {editId ? '✏️ Update Purchase' : '💾 Save Purchase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── LIST VIEW ────────────────────────────────────────────────────────────
  const filteredPurs = purchases.filter(p =>
    !search || p.purchase_no?.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier_invoice?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <PageHeader title={t.purchases} subtitle={`${purchases.length} purchase orders`}>
        <Btn variant="primary" onClick={()=>setView('new')}><Plus size={15}/>New Purchase</Btn>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:'Total Orders',  val:purchases.length,                                                                   c:'text-white'},
          {label:'Total Value',   val:fmt(purchases.reduce((s,p)=>s+p.grand_total,0)),                                    c:'text-blue-400'},
          {label:'Paid',          val:fmt(purchases.filter(p=>p.status!=='credit').reduce((s,p)=>s+p.paid_amount,0)),     c:'text-green-400'},
          {label:'Payable',       val:fmt(purchases.reduce((s,p)=>s+(p.balance_due||0),0)),                               c:'text-red-400'},
        ].map(s=>(
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`font-bold text-xl ${s.c}`}>{s.val}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search purchase no, supplier, supplier invoice..."/>

      <Table>
        <THead cols={[
          {label:'PURCHASE NO'},{label:'SUPPLIER'},
          {label:'DATE',hidden:'hidden md:table-cell'},
          {label:'SUP INVOICE',hidden:'hidden lg:table-cell'},
          {label:'TOTAL',align:'right'},
          {label:'BALANCE',align:'right',hidden:'hidden md:table-cell'},
          {label:'MODE',hidden:'hidden lg:table-cell'},
          {label:'STATUS',align:'center'},
          {label:'ACTIONS',align:'center'},
        ]}/>
        <tbody>
          {filteredPurs.length===0&&<tr><td colSpan={8} className="text-center py-12 text-gray-600 text-sm">No purchases yet</td></tr>}
          {filteredPurs.map(p=>(
            <TRow key={p.id} onClick={()=>setViewPur(p)}>
              <TD><span className="text-orange-400 font-mono text-xs">{p.purchase_no}</span></TD>
              <TD><span className="text-white text-sm">{p.supplier_name}</span></TD>
              <TD className="hidden md:table-cell"><span className="text-gray-400 text-xs">{fmtDate(p.purchase_date)}</span></TD>
              <TD className="hidden lg:table-cell"><span className="text-gray-400 text-xs">{p.supplier_invoice||'—'}</span></TD>
              <TD align="right"><span className="text-white font-semibold">{fmt(p.grand_total)}</span></TD>
              <TD align="right" className="hidden md:table-cell">
                <span className={p.balance_due>0?'text-red-400 font-semibold':'text-green-400'}>{p.balance_due>0?fmt(p.balance_due):'Paid'}</span>
              </TD>
              <TD className="hidden lg:table-cell"><span className="text-gray-400 text-xs">{p.payment_mode}</span></TD>
              <TD align="center"><Badge status={p.status}/></TD>
            </TRow>
          ))}
        </tbody>
      </Table>

      {/* Purchase detail modal */}
      <Confirm open={!!confirmId} onCancel={()=>setConfirmId(null)} onConfirm={()=>{deletePurchase(confirmId);setConfirmId(null);}} message="Delete this purchase? Stock will be reversed."/>

      {viewPur&&(
        <Modal open={!!viewPur} onClose={()=>setViewPur(null)} title={`Purchase: ${viewPur.purchase_no}`} size="lg">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Supplier</p>
                <p className="text-white font-semibold">{viewPur.supplier_name}</p>
                <p className="text-gray-400 text-xs">Inv: {viewPur.supplier_invoice||'—'}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">Date</p>
                <p className="text-white">{fmtDate(viewPur.purchase_date)}</p>
                <Badge status={viewPur.status}/>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-800 text-xs text-gray-500">
                <th className="text-left py-2">PART</th><th className="text-center py-2">QTY</th>
                <th className="text-right py-2">RATE</th><th className="text-right py-2">TOTAL</th>
              </tr></thead>
              <tbody>
                {(viewPur.items||[]).map((item,i)=>(
                  <tr key={i} className="border-b border-gray-800/40">
                    <td className="py-2 text-white">{item.part_name}<div className="text-gray-500 text-xs">{item.part_code}</div></td>
                    <td className="py-2 text-center text-gray-300">{item.qty}</td>
                    <td className="py-2 text-right text-gray-300">{fmt(item.rate)}</td>
                    <td className="py-2 text-right text-white font-medium">{fmt(item.qty*item.rate*(1+item.gst_rate/100))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-1 text-sm border-t border-gray-800 pt-3">
              <div className="flex justify-between text-gray-400"><span>Taxable</span><span>{fmt(viewPur.taxable_amt)}</span></div>
              <div className="flex justify-between text-gray-400"><span>GST</span><span>{fmt(viewPur.total_gst)}</span></div>
              {viewPur.transport_charges>0&&<div className="flex justify-between text-gray-400"><span>Transport</span><span>{fmt(viewPur.transport_charges)}</span></div>}
              {viewPur.loading_charges>0&&<div className="flex justify-between text-gray-400"><span>Loading</span><span>{fmt(viewPur.loading_charges)}</span></div>}
              <div className="flex justify-between text-white font-bold text-base"><span>Grand Total</span><span className="text-orange-400">{fmt(viewPur.grand_total)}</span></div>
              {viewPur.balance_due>0&&<div className="flex justify-between text-red-400"><span>Balance Due</span><span>{fmt(viewPur.balance_due)}</span></div>}
            </div>
            {viewPur.freight_mode&&<div className="text-gray-500 text-xs">Freight: {viewPur.freight_mode} {viewPur.lr_number?`· LR: ${viewPur.lr_number}`:''} {viewPur.vehicle_no?`· Vehicle: ${viewPur.vehicle_no}`:''}</div>}
            {viewPur.quality_checked&&<div className="text-green-400 text-xs">✓ Quality checked {viewPur.inspection_notes?`— ${viewPur.inspection_notes}`:''}</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
