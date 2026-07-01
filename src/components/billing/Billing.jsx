import { useState, useRef } from 'react';
import { Plus, Printer, Phone, Download, Eye, ChevronLeft, X, CheckCircle, AlertTriangle, FileText, BarChart2, Calendar, CheckSquare, Square, Trash2 } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { Modal, Badge, Btn, SearchBar, PageHeader, Table, THead, TRow, TD, Field, Input, Select, Textarea } from '../shared/UI';
import { fmt, fmtDate, calcLineItem, calcInvoiceTotals, sendWhatsApp, generateInvoicePDF, today } from '../../utils/helpers';

// ─── NEW INVOICE FORM ─────────────────────────────────────────────────────────
function NewInvoice({ onBack, onSave, shop, customers, parts, nextInvoiceNo }) {
  const [invType, setInvType]       = useState('Invoice');
  const [supplyType, setSupplyType] = useState('intrastate');
  const [invDate, setInvDate]       = useState(today());
  const [dueDate, setDueDate]       = useState('');
  const [selCustomer, setSelCustomer] = useState(null);
  const [custSearch, setCustSearch] = useState('');
  const [items, setItems]           = useState([]);
  const [partSearch, setPartSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [discPct, setDiscPct]       = useState(0);
  const [payMode, setPayMode]       = useState('Cash');
  const [payRef, setPayRef]         = useState('');
  const [notes, setNotes]           = useState('');
  const [saved, setSaved]           = useState(false);
  const [savedInv, setSavedInv]     = useState(null);

  const filteredParts = parts.filter(p =>
    !partSearch ||
    p.name?.toLowerCase().includes(partSearch.toLowerCase()) ||
    p.code?.toLowerCase().includes(partSearch.toLowerCase()) ||
    p.brand?.toLowerCase().includes(partSearch.toLowerCase()) ||
    p.make?.toLowerCase().includes(partSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(custSearch.toLowerCase()) || c.phone?.includes(custSearch)
  );

  const addPart = (part) => {
    const exists = items.find(i => i.part_id === part.id);
    if (exists) {
      setItems(items.map(i => i.part_id === part.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setItems([...items, {
        part_id: part.id, part_code: part.code, part_name: part.name,
        hsn_code: part.hsn_code, qty: 1, unit: part.unit || 'PCS',
        rate: part.selling_price, discount_pct: 0, gst_rate: part.gst_rate,
      }]);
    }
    setShowPicker(false); setPartSearch('');
  };

  const updateItem = (partId, field, val) =>
    setItems(items.map(i => i.part_id === partId ? { ...i, [field]: parseFloat(val) || 0 } : i));
  const removeItem = (partId) => setItems(items.filter(i => i.part_id !== partId));

  const totals = calcInvoiceTotals(items, discPct, supplyType);

  const buildInvoice = () => ({
    id: `inv_${Date.now()}`,
    invoice_no: nextInvoiceNo(),
    invoice_type: invType,
    invoice_date: invDate,
    due_date: dueDate,
    customer_id: selCustomer?.id,
    customer_name: selCustomer?.name || '',
    customer_gstin: selCustomer?.gst_no || '',
    billing_address: selCustomer?.address || '',
    ...totals,
    paid_amount: payMode !== 'Credit' ? totals.grand_total : 0,
    balance_due: payMode === 'Credit' ? totals.grand_total : 0,
    payment_mode: payMode,
    payment_ref: payRef,
    status: payMode === 'Credit' ? 'unpaid' : 'paid',
    supply_type: supplyType,
    notes,
    items,
  });

  const handleSave = () => {
    if (!selCustomer || items.length === 0) return;

    // Check for stock issues
    const stockIssues = items.filter(item => {
      const part = parts.find(p => p.id === item.part_id);
      return part && item.qty > part.stock;
    });

    if (stockIssues.length > 0) {
      const names = stockIssues.map(i => {
        const part = parts.find(p=>p.id===i.part_id);
        return `${i.part_name} (available: ${part?.stock||0}, requested: ${i.qty})`;
      }).join('\n');
      const proceed = window.confirm(
        `⚠️ Stock shortage for:\n${names}\n\nDo you want to proceed anyway? (Stock will go negative)`
      );
      if (!proceed) return;
    }

    const inv = buildInvoice();
    onSave(inv);
    setSavedInv(inv);
    setSaved(true);
  };

  const handlePrint = () => {
    if (!selCustomer || items.length === 0) {
      alert('Please add customer and items first, then save the invoice before printing.');
      return;
    }
    const inv = savedInv || buildInvoice();
    generateInvoicePDF(inv, inv.items || [], shop, selCustomer);
  };

  const handleWhatsApp = () => {
    if (!selCustomer?.phone) {
      alert('Please select a customer with a phone number to send via WhatsApp.');
      return;
    }
    if (items.length === 0) {
      alert('Please add items to the invoice first.');
      return;
    }
    const inv = savedInv || buildInvoice();
    sendWhatsApp(selCustomer.phone, inv, shop);
  };

  const handlePrintDirect = () => {
    if (!selCustomer || items.length === 0) return;
    const inv = savedInv || buildInvoice();
    // Build printable HTML
    const printContent = `
      <html><head><title>${inv.invoice_no}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
        h1 { font-size: 20px; margin: 0; }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .shop { font-size: 13px; color: #555; }
        .inv-no { text-align: right; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
        th { background: #f3f4f6; padding: 8px; text-align: left; border: 1px solid #ddd; }
        td { padding: 7px 8px; border: 1px solid #eee; }
        .totals { float: right; width: 250px; font-size: 13px; }
        .totals tr td { border: none; padding: 3px 5px; }
        .grand { font-size: 16px; font-weight: bold; border-top: 2px solid #000; }
        .footer { margin-top: 30px; font-size: 11px; color: #777; text-align: center; }
      </style></head><body>
      <div class="header">
        <div>
          <h1>${shop.name || 'AutoSpares Pro'}</h1>
          <div class="shop">${shop.address || ''}<br/>${shop.phone || ''} | GSTIN: ${shop.gstin || ''}</div>
          <br/><b>Bill To:</b><br/>${inv.customer_name}<br/>${inv.billing_address || ''}<br/>${inv.customer_gstin ? 'GSTIN: ' + inv.customer_gstin : ''}
        </div>
        <div class="inv-no">
          <h2 style="color:#f97316">${inv.invoice_type?.toUpperCase() || 'INVOICE'}</h2>
          <div>No: <b>${inv.invoice_no}</b></div>
          <div>Date: ${fmtDate(inv.invoice_date)}</div>
          <div>Payment: ${inv.payment_mode}</div>
          <div>Status: <b>${inv.status?.toUpperCase()}</b></div>
        </div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Part Name</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Taxable</th><th>GST%</th><th>GST Amt</th><th>Total</th></tr></thead>
        <tbody>
          ${(inv.items || []).map((item, i) => {
            const calc = calcLineItem(item.qty, item.rate, item.discount_pct || 0, item.gst_rate, inv.supply_type);
            return `<tr><td>${i+1}</td><td>${item.part_name}<br/><small>${item.part_code || ''}</small></td><td>${item.hsn_code || ''}</td><td>${item.qty}</td><td>₹${item.rate}</td><td>₹${calc.taxableAmt.toFixed(2)}</td><td>${item.gst_rate}%</td><td>₹${calc.total.toFixed(2)}</td><td>₹${calc.totalAmt.toFixed(2)}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
      <table class="totals">
        <tr><td>Subtotal</td><td align="right">${fmt(inv.subtotal)}</td></tr>
        ${inv.discount_amt > 0 ? `<tr><td>Discount</td><td align="right">-${fmt(inv.discount_amt)}</td></tr>` : ''}
        <tr><td>Taxable Amt</td><td align="right">${fmt(inv.taxable_amt)}</td></tr>
        ${inv.supply_type === 'intrastate' ? `<tr><td>CGST</td><td align="right">${fmt(inv.cgst_amt)}</td></tr><tr><td>SGST</td><td align="right">${fmt(inv.sgst_amt)}</td></tr>` : `<tr><td>IGST</td><td align="right">${fmt(inv.igst_amt)}</td></tr>`}
        <tr class="grand"><td><b>Grand Total</b></td><td align="right"><b>${fmt(inv.grand_total)}</b></td></tr>
      </table>
      <br/><br/>
      ${shop.bank_name ? `<div style="font-size:12px"><b>Bank:</b> ${shop.bank_name} | A/C: ${shop.bank_account} | IFSC: ${shop.ifsc_code}</div>` : ''}
      <div class="footer">Thank you for your business! This is a computer generated invoice.</div>
      </body></html>
    `;
    const w = window.open('', '_blank', 'width=800,height=600');
    w.document.write(printContent);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  };

  // ── SAVED STATE ────────────────────────────────────────────────────────────
  if (saved && savedInv) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
            <ChevronLeft size={20}/>
          </button>
          <h2 className="text-white font-bold text-xl">Invoice Saved!</h2>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-3"/>
          <h3 className="text-white font-bold text-xl mb-1">{savedInv.invoice_no}</h3>
          <p className="text-gray-400 text-sm mb-1">{savedInv.customer_name}</p>
          <p className="text-orange-400 font-bold text-2xl mb-4">{fmt(savedInv.grand_total)}</p>
          <p className="text-green-400 text-sm mb-6">Invoice saved successfully ✓</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md mx-auto">
            <button onClick={handlePrintDirect}
              className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl transition-colors font-medium">
              <Printer size={18}/> Print
            </button>
            <button onClick={() => generateInvoicePDF(savedInv, savedInv.items || [], shop, selCustomer)}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl transition-colors font-medium">
              <Download size={18}/> PDF
            </button>
            <button onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition-colors font-medium">
              <Phone size={18}/> WhatsApp
            </button>
          </div>

          <button onClick={onBack} className="mt-4 text-gray-500 hover:text-gray-300 text-sm underline">
            ← Back to Invoice List
          </button>
        </div>
      </div>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
          <ChevronLeft size={20}/>
        </button>
        <div>
          <h2 className="text-white font-bold text-xl">New {invType}</h2>
          <p className="text-gray-500 text-sm">{invDate}</p>
        </div>
        <div className="ml-auto flex gap-2">
          {['Invoice', 'Quotation'].map(tp => (
            <button key={tp} onClick={() => setInvType(tp)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${invType === tp ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {tp}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* LEFT */}
        <div className="xl:col-span-2 space-y-4">

          {/* Invoice Meta */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Invoice Date">
              <Input type="date" value={invDate} onChange={e => setInvDate(e.target.value)}/>
            </Field>
            <Field label="Due Date">
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}/>
            </Field>
            <Field label="Supply Type" className="col-span-2">
              <Select value={supplyType} onChange={e => setSupplyType(e.target.value)}>
                <option value="intrastate">Intrastate (CGST + SGST)</option>
                <option value="interstate">Interstate (IGST)</option>
              </Select>
            </Field>
          </div>

          {/* Customer */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide">Bill To *</p>
            {selCustomer ? (
              <div className="flex items-start justify-between bg-gray-800 rounded-xl px-4 py-3">
                <div>
                  <div className="text-white font-semibold">{selCustomer.name}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{selCustomer.phone}</div>
                  {selCustomer.address && <div className="text-gray-500 text-xs">{selCustomer.address}</div>}
                  {selCustomer.gst_no && <div className="text-gray-500 text-xs font-mono">GSTIN: {selCustomer.gst_no}</div>}
                </div>
                <button onClick={() => setSelCustomer(null)} className="text-gray-500 hover:text-red-400 ml-3">
                  <X size={16}/>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input value={custSearch} onChange={e => setCustSearch(e.target.value)}
                  placeholder="Search customer name or phone..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"/>
                {custSearch && (
                  <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl mt-1 z-20 overflow-hidden shadow-xl">
                    {filteredCustomers.slice(0, 5).map(c => (
                      <button key={c.id} onClick={() => { setSelCustomer(c); setCustSearch(''); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-0">
                        <div className="text-white text-sm font-medium">{c.name}</div>
                        <div className="text-gray-400 text-xs">{c.phone} {c.gst_no ? `· ${c.gst_no}` : ''}</div>
                      </button>
                    ))}
                    <button
                      onClick={() => { setSelCustomer({ id: null, name: custSearch, phone: '', gst_no: '', address: '' }); setCustSearch(''); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-700 text-orange-400 text-sm border-t border-gray-700">
                      + Use "{custSearch}" as walk-in customer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="text-gray-400 text-xs uppercase tracking-wide">Items ({items.length}) *</span>
              <button onClick={() => setShowPicker(!showPicker)}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                <Plus size={13}/> Add Part
              </button>
            </div>

            {/* Part Picker */}
            {showPicker && (
              <div className="p-3 border-b border-gray-800 bg-gray-950">
                <input value={partSearch} onChange={e => setPartSearch(e.target.value)}
                  placeholder="Search by name, code, brand, vehicle..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 mb-2"/>
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {filteredParts.slice(0, 10).map(p => (
                    <button key={p.id} onClick={() => addPart(p)}
                      className="w-full text-left bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 flex items-center justify-between transition-colors">
                      <div className="min-w-0">
                        <span className="text-white text-sm font-medium">{p.name}</span>
                        <span className="text-gray-500 text-xs ml-2">{p.code} · {p.brand}</span>
                        <div className="text-gray-600 text-xs">{p.make} {p.model} · HSN: {p.hsn_code}</div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="text-orange-400 text-sm font-semibold">{fmt(p.selling_price)}</div>
                        <div className={`text-xs font-semibold ${p.stock===0?'text-red-400':p.stock<=p.reorder_level?'text-yellow-400':'text-green-400'}`}>
                          {p.stock===0?'⚠ OUT OF STOCK':p.stock<=p.reorder_level?`⚠ Low: ${p.stock}`:p.stock+' in stock'}
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredParts.length === 0 && <p className="text-gray-600 text-sm text-center py-4">No parts found</p>}
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-600 text-sm">
                Click "Add Part" to start adding items
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs text-gray-500">
                      <th className="text-left px-4 py-2">PART</th>
                      <th className="text-center px-2 py-2 w-16">QTY</th>
                      <th className="text-right px-2 py-2 w-24">RATE ₹</th>
                      <th className="text-center px-2 py-2 w-16">DISC%</th>
                      <th className="text-center px-2 py-2 w-16">GST%</th>
                      <th className="text-right px-4 py-2 w-28">TOTAL</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const calc = calcLineItem(item.qty, item.rate, (item.discount_pct || 0) + discPct, item.gst_rate, supplyType);
                      return (
                        <tr key={item.part_id} className="border-b border-gray-800/40">
                          <td className="px-4 py-2">
                            <div className="text-white text-sm font-medium">{item.part_name}</div>
                            <div className="text-gray-500 text-xs">{item.part_code} · HSN: {item.hsn_code}</div>
                            {(() => {
                              const part = parts.find(p=>p.id===item.part_id);
                              if (part && item.qty > part.stock) return (
                                <div className="text-red-400 text-xs flex items-center gap-1">
                                  <AlertTriangle size={10}/> Only {part.stock} in stock
                                </div>
                              );
                              return null;
                            })()}
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" min="0.01" step="0.01" value={item.qty}
                              onChange={e => updateItem(item.part_id, 'qty', e.target.value)}
                              className="w-16 text-center bg-gray-800 border border-gray-700 text-white rounded-lg px-1 py-1 text-sm focus:outline-none focus:border-orange-500"/>
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" min="0" step="0.01" value={item.rate}
                              onChange={e => updateItem(item.part_id, 'rate', e.target.value)}
                              className="w-24 text-right bg-gray-800 border border-gray-700 text-white rounded-lg px-1 py-1 text-sm focus:outline-none focus:border-orange-500"/>
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" min="0" max="100" value={item.discount_pct}
                              onChange={e => updateItem(item.part_id, 'discount_pct', e.target.value)}
                              className="w-16 text-center bg-gray-800 border border-gray-700 text-white rounded-lg px-1 py-1 text-sm focus:outline-none focus:border-orange-500"/>
                          </td>
                          <td className="px-2 py-2 text-gray-400 text-center text-xs">{item.gst_rate}%</td>
                          <td className="px-4 py-2 text-right">
                            <div className="text-white font-semibold">{fmt(calc.totalAmt)}</div>
                            <div className="text-gray-600 text-xs">Tax: {fmt(calc.total)}</div>
                          </td>
                          <td className="pr-2">
                            <button onClick={() => removeItem(item.part_id)} className="text-gray-600 hover:text-red-400 p-1 transition-colors">
                              <X size={13}/>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Summary */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
            <h3 className="text-gray-400 text-xs uppercase tracking-wide">Payment Summary</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400"><span>Subtotal</span><span className="text-white">{fmt(totals.subtotal)}</span></div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Invoice Discount %</span>
                <input type="number" min="0" max="100" value={discPct}
                  onChange={e => setDiscPct(parseFloat(e.target.value) || 0)}
                  className="w-16 text-right bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-0.5 text-sm focus:outline-none focus:border-orange-500"/>
              </div>
              {totals.discount_amt > 0 && <div className="flex justify-between text-red-400 text-xs"><span>Discount</span><span>-{fmt(totals.discount_amt)}</span></div>}
              <div className="flex justify-between text-gray-400"><span>Taxable Amt</span><span className="text-white">{fmt(totals.taxable_amt)}</span></div>
              {supplyType === 'intrastate' ? (
                <>
                  <div className="flex justify-between text-gray-400 text-xs"><span>CGST</span><span>{fmt(totals.cgst_amt)}</span></div>
                  <div className="flex justify-between text-gray-400 text-xs"><span>SGST</span><span>{fmt(totals.sgst_amt)}</span></div>
                </>
              ) : (
                <div className="flex justify-between text-gray-400 text-xs"><span>IGST</span><span>{fmt(totals.igst_amt)}</span></div>
              )}
              <div className="flex justify-between text-gray-400 text-xs"><span>Total GST</span><span>{fmt(totals.total_gst)}</span></div>
              <div className="border-t border-gray-700 pt-2 flex justify-between text-white font-bold">
                <span>Grand Total</span>
                <span className="text-orange-400 text-lg">{fmt(totals.grand_total)}</span>
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide">Payment Mode</p>
              <div className="grid grid-cols-3 gap-1.5">
                {['Cash', 'UPI', 'Credit', 'Cheque', 'NEFT'].map(m => (
                  <button key={m} onClick={() => setPayMode(m)}
                    className={`py-2 rounded-lg text-xs font-semibold transition-colors ${payMode === m ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {(payMode === 'Cheque' || payMode === 'NEFT' || payMode === 'UPI') && (
              <Field label="Reference / Cheque No">
                <Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Enter reference..."/>
              </Field>
            )}

            <Field label="Notes">
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any special notes..."/>
            </Field>

            {/* Validation hint */}
            {(!selCustomer || items.length === 0) && (
              <p className="text-yellow-400 text-xs text-center">
                {!selCustomer ? '⚠ Select a customer first' : '⚠ Add at least one part'}
              </p>
            )}

            {/* Save button */}
            <button onClick={handleSave}
              disabled={!selCustomer || items.length === 0}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm">
              💾 Save {invType}
            </button>

            {/* Print / WhatsApp — before save shows preview, after save uses saved invoice */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handlePrintDirect}
                disabled={items.length === 0}
                className="flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 py-2 rounded-lg text-xs transition-colors font-medium">
                <Printer size={13}/> Print
              </button>
              <button onClick={handleWhatsApp}
                disabled={!selCustomer?.phone || items.length === 0}
                className="flex items-center justify-center gap-1.5 bg-green-600/20 hover:bg-green-600/30 disabled:opacity-40 text-green-400 py-2 rounded-lg text-xs border border-green-500/30 transition-colors font-medium">
                <Phone size={13}/> WhatsApp
              </button>
            </div>
            <button onClick={() => generateInvoicePDF(savedInv || buildInvoice(), items, shop, selCustomer)}
              disabled={items.length === 0}
              className="w-full flex items-center justify-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-40 text-blue-400 py-2 rounded-lg text-xs border border-blue-500/30 transition-colors font-medium">
              <Download size={13}/> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INVOICE LIST ─────────────────────────────────────────────────────────────
export default function Billing() {
  const { t, invoices, addInvoice, updateInvoice, cancelInvoice, customers, shop, parts, nextInvoiceNo } = useApp();
  const [view, setView]             = useState('list');
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewInv, setViewInv]       = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  // Bulk select
  const [selected, setSelected]     = useState([]);
  const [showReport, setShowReport] = useState(false);
  // Date filter
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [quickDate, setQuickDate]   = useState('all');

  const applyQuickDate = (range) => {
    setQuickDate(range);
    const now = new Date();
    const fmt2 = (d) => d.toISOString().split('T')[0];
    if (range === 'all')       { setDateFrom(''); setDateTo(''); }
    else if (range === 'today') { setDateFrom(fmt2(now)); setDateTo(fmt2(now)); }
    else if (range === 'week')  { const d=new Date(); d.setDate(d.getDate()-7); setDateFrom(fmt2(d)); setDateTo(fmt2(now)); }
    else if (range === 'month') { setDateFrom(fmt2(new Date(now.getFullYear(),now.getMonth(),1))); setDateTo(fmt2(now)); }
    else if (range === 'last')  { const s=new Date(now.getFullYear(),now.getMonth()-1,1); const e=new Date(now.getFullYear(),now.getMonth(),0); setDateFrom(fmt2(s)); setDateTo(fmt2(e)); }
    else if (range === 'fy')    { const yr=now.getMonth()>=3?now.getFullYear():now.getFullYear()-1; setDateFrom(`${yr}-04-01`); setDateTo(`${yr+1}-03-31`); }
  };

  const filtered = invoices.filter(inv => {
    const ms = !search || inv.invoice_no?.toLowerCase().includes(search.toLowerCase()) || inv.customer_name?.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'all' || inv.status === statusFilter;
    const mdf = !dateFrom || inv.invoice_date >= dateFrom;
    const mdt = !dateTo   || inv.invoice_date <= dateTo;
    return ms && mst && mdf && mdt;
  });

  // Bulk select helpers
  const allSelected = filtered.length > 0 && filtered.every(i => selected.includes(i.id));
  const toggleAll   = () => setSelected(allSelected ? [] : filtered.map(i => i.id));
  const toggleOne   = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  const selectedInvs = invoices.filter(i => selected.includes(i.id));

  // Bulk PDF download — generates one PDF per invoice
  const bulkDownloadPDF = () => {
    selectedInvs.forEach((inv, idx) => {
      setTimeout(() => {
        const customer = customers.find(c=>c.id===inv.customer_id);
        generateInvoicePDF(inv, inv.items||[], shop, customer);
      }, idx * 800); // stagger to avoid browser blocking
    });
  };

  // Bulk Excel export
  const bulkExportExcel = async () => {
    const XLSX = await import('xlsx');
    const data = selectedInvs.map(inv => ({
      'Invoice No':     inv.invoice_no,
      'Type':           inv.invoice_type||'Invoice',
      'Date':           inv.invoice_date,
      'Customer':       inv.customer_name,
      'Customer GSTIN': inv.customer_gstin||'',
      'Supply Type':    inv.supply_type,
      'Subtotal':       inv.subtotal,
      'Discount':       inv.discount_amt||0,
      'Taxable Amt':    inv.taxable_amt,
      'CGST':           inv.cgst_amt,
      'SGST':           inv.sgst_amt,
      'IGST':           inv.igst_amt,
      'Total GST':      inv.total_gst,
      'Grand Total':    inv.grand_total,
      'Paid Amount':    inv.paid_amount||0,
      'Balance Due':    inv.balance_due||0,
      'Payment Mode':   inv.payment_mode,
      'Status':         inv.status,
      'Notes':          inv.notes||'',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.writeFile(wb, `Invoices_${dateFrom||'all'}_to_${dateTo||'all'}.xlsx`);
  };

  // Bulk print — all selected in one print window
  const bulkPrint = () => {
    const rows = selectedInvs.map(inv => `
      <div style="page-break-after:always;padding:20px;font-family:Arial,sans-serif">
        <div style="display:flex;justify-content:space-between;margin-bottom:15px">
          <div>
            <h2 style="margin:0;color:#f97316">${shop.name||'AutoSpares Pro'}</h2>
            <p style="margin:2px 0;font-size:12px;color:#555">${shop.address||''} | ${shop.phone||''}</p>
            <p style="margin:2px 0;font-size:12px;color:#555">GSTIN: ${shop.gstin||''}</p>
            <br/>
            <b>Bill To:</b> ${inv.customer_name}<br/>
            <span style="font-size:11px">${inv.billing_address||''} ${inv.customer_gstin?'| GSTIN: '+inv.customer_gstin:''}</span>
          </div>
          <div style="text-align:right">
            <h3 style="margin:0">${(inv.invoice_type||'INVOICE').toUpperCase()}</h3>
            <p style="margin:2px 0"><b>${inv.invoice_no}</b></p>
            <p style="margin:2px 0;font-size:12px">Date: ${inv.invoice_date}</p>
            <p style="margin:2px 0;font-size:12px">Mode: ${inv.payment_mode}</p>
            <span style="background:${inv.status==='paid'?'#22c55e':'#ef4444'};color:white;padding:2px 8px;border-radius:4px;font-size:11px">${inv.status.toUpperCase()}</span>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#f3f4f6">
            <th style="padding:6px;border:1px solid #ddd;text-align:left">#</th>
            <th style="padding:6px;border:1px solid #ddd;text-align:left">Part</th>
            <th style="padding:6px;border:1px solid #ddd">Qty</th>
            <th style="padding:6px;border:1px solid #ddd;text-align:right">Rate</th>
            <th style="padding:6px;border:1px solid #ddd;text-align:right">GST</th>
            <th style="padding:6px;border:1px solid #ddd;text-align:right">Total</th>
          </tr></thead>
          <tbody>
            ${(inv.items||[]).map((item,i) => `
              <tr>
                <td style="padding:5px;border:1px solid #eee">${i+1}</td>
                <td style="padding:5px;border:1px solid #eee">${item.part_name}<br/><small style="color:#888">${item.part_code||''}</small></td>
                <td style="padding:5px;border:1px solid #eee;text-align:center">${item.qty}</td>
                <td style="padding:5px;border:1px solid #eee;text-align:right">₹${item.rate}</td>
                <td style="padding:5px;border:1px solid #eee;text-align:right">${item.gst_rate}%</td>
                <td style="padding:5px;border:1px solid #eee;text-align:right">₹${(item.qty*item.rate*(1+item.gst_rate/100)).toFixed(2)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div style="float:right;margin-top:10px;width:220px;font-size:12px">
          <table style="width:100%">
            <tr><td>Taxable</td><td style="text-align:right">₹${inv.taxable_amt?.toFixed(2)}</td></tr>
            <tr><td>GST</td><td style="text-align:right">₹${inv.total_gst?.toFixed(2)}</td></tr>
            <tr style="font-weight:bold;font-size:14px"><td>Grand Total</td><td style="text-align:right">₹${inv.grand_total?.toFixed(2)}</td></tr>
            ${inv.balance_due>0?`<tr style="color:red"><td>Balance Due</td><td style="text-align:right">₹${inv.balance_due?.toFixed(2)}</td></tr>`:''}
          </table>
        </div>
        <div style="clear:both;margin-top:30px;font-size:10px;color:#aaa;text-align:center">
          Thank you for your business! — ${shop.name||''}
        </div>
      </div>
    `).join('');

    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(`<html><head><title>Invoices</title></head><body>${rows}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  const handlePDF = (inv) => {
    const customer = customers.find(c => c.id === inv.customer_id);
    generateInvoicePDF(inv, inv.items || [], shop, customer);
  };

  const handleWhatsApp = (inv) => {
    const customer = customers.find(c => c.id === inv.customer_id);
    const phone = customer?.phone || inv.customer_phone;
    if (!phone) { alert('No phone number found for this customer.'); return; }
    sendWhatsApp(phone, inv, shop);
  };

  const handlePrint = (inv) => {
    const printContent = `
      <html><head><title>${inv.invoice_no}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px;color:#000}
        h1{font-size:20px;margin:0}.header{display:flex;justify-content:space-between;margin-bottom:20px}
        .shop{font-size:13px;color:#555}table{width:100%;border-collapse:collapse;margin:15px 0;font-size:12px}
        th{background:#f3f4f6;padding:8px;text-align:left;border:1px solid #ddd}td{padding:7px 8px;border:1px solid #eee}
        .totals{float:right;width:250px;font-size:13px}.totals tr td{border:none;padding:3px 5px}
        .grand{font-size:16px;font-weight:bold;border-top:2px solid #000}
        .footer{margin-top:40px;font-size:11px;color:#777;text-align:center;clear:both}
      </style></head><body>
      <div class="header">
        <div><h1>${shop.name||'AutoSpares Pro'}</h1>
        <div class="shop">${shop.address||''}<br/>${shop.phone||''} | GSTIN: ${shop.gstin||''}</div>
        <br/><b>Bill To:</b><br/>${inv.customer_name}<br/>${inv.billing_address||''}<br/>${inv.customer_gstin?'GSTIN: '+inv.customer_gstin:''}</div>
        <div style="text-align:right"><h2 style="color:#f97316">${(inv.invoice_type||'INVOICE').toUpperCase()}</h2>
        <div>No: <b>${inv.invoice_no}</b></div><div>Date: ${fmtDate(inv.invoice_date)}</div>
        <div>Mode: ${inv.payment_mode}</div><div>Status: <b>${(inv.status||'').toUpperCase()}</b></div></div>
      </div>
      <table><thead><tr><th>#</th><th>Part</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Taxable</th><th>GST</th><th>Total</th></tr></thead>
      <tbody>${(inv.items||[]).map((item,i)=>{const calc=calcLineItem(item.qty,item.rate,item.discount_pct||0,item.gst_rate,inv.supply_type);return`<tr><td>${i+1}</td><td>${item.part_name}<br/><small>${item.part_code||''}</small></td><td>${item.hsn_code||''}</td><td>${item.qty}</td><td>₹${item.rate}</td><td>₹${calc.taxableAmt.toFixed(2)}</td><td>${item.gst_rate}% = ₹${calc.total.toFixed(2)}</td><td>₹${calc.totalAmt.toFixed(2)}</td></tr>`;}).join('')}</tbody></table>
      <table class="totals">
        <tr><td>Subtotal</td><td align="right">${fmt(inv.subtotal)}</td></tr>
        ${inv.discount_amt>0?`<tr><td>Discount</td><td align="right">-${fmt(inv.discount_amt)}</td></tr>`:''}
        <tr><td>Taxable</td><td align="right">${fmt(inv.taxable_amt)}</td></tr>
        ${inv.supply_type==='intrastate'?`<tr><td>CGST</td><td align="right">${fmt(inv.cgst_amt)}</td></tr><tr><td>SGST</td><td align="right">${fmt(inv.sgst_amt)}</td></tr>`:`<tr><td>IGST</td><td align="right">${fmt(inv.igst_amt)}</td></tr>`}
        <tr class="grand"><td><b>Grand Total</b></td><td align="right"><b>${fmt(inv.grand_total)}</b></td></tr>
        ${inv.paid_amount>0?`<tr><td>Paid</td><td align="right">${fmt(inv.paid_amount)}</td></tr>`:''}
        ${inv.balance_due>0?`<tr><td style="color:red"><b>Balance Due</b></td><td align="right" style="color:red"><b>${fmt(inv.balance_due)}</b></td></tr>`:''}
      </table>
      ${shop.bank_name?`<div style="font-size:12px;margin-top:10px"><b>Bank:</b> ${shop.bank_name} | A/C: ${shop.bank_account} | IFSC: ${shop.ifsc_code}${shop.upi_id?` | UPI: ${shop.upi_id}`:''}</div>`:''}
      <div class="footer">Thank you for your business! — Computer generated invoice — ${shop.name||''}</div>
      </body></html>`;
    const w = window.open('', '_blank', 'width=800,height=700');
    w.document.write(printContent);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  const handleCancel = (inv) => {
    const reason = window.prompt(`Cancel invoice ${inv.invoice_no}?\nEnter reason for cancellation:`);
    if (reason !== null) {
      cancelInvoice(inv.id, reason || 'Cancelled by admin');
      setViewInv(null);
    }
  };

  const handleMarkPaid = (inv) => {
    updateInvoice(inv.id, { status:'paid', paid_amount: inv.grand_total, balance_due: 0 });
    setViewInv(null);
  };

  if (view === 'new') return (
    <NewInvoice
      onBack={() => setView('list')}
      onSave={addInvoice}
      shop={shop}
      customers={customers}
      parts={parts}
      nextInvoiceNo={nextInvoiceNo}
    />
  );

 

  const totals = {
    all:     invoices.reduce((s,i)=>s+i.grand_total,0),
    paid:    invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.grand_total,0),
    unpaid:  invoices.filter(i=>i.status==='unpaid').reduce((s,i)=>s+i.balance_due,0),
    partial: invoices.filter(i=>i.status==='partial').reduce((s,i)=>s+i.balance_due,0),
  };

  // Invoice Report data
  const reportData = {
    totalInvs:    filtered.length,
    totalRevenue: filtered.reduce((s,i)=>s+i.grand_total,0),
    totalTaxable: filtered.reduce((s,i)=>s+i.taxable_amt,0),
    totalGST:     filtered.reduce((s,i)=>s+i.total_gst,0),
    totalCGST:    filtered.reduce((s,i)=>s+i.cgst_amt,0),
    totalSGST:    filtered.reduce((s,i)=>s+i.sgst_amt,0),
    totalIGST:    filtered.reduce((s,i)=>s+i.igst_amt,0),
    collected:    filtered.filter(i=>i.status==='paid').reduce((s,i)=>s+i.grand_total,0),
    pending:      filtered.filter(i=>i.status!=='paid'&&!i.is_cancelled).reduce((s,i)=>s+i.balance_due,0),
    byMode:       ['Cash','UPI','Cheque','NEFT','Credit'].map(m=>({
      mode:m, count:filtered.filter(i=>i.payment_mode===m).length,
      amount:filtered.filter(i=>i.payment_mode===m).reduce((s,i)=>s+i.grand_total,0)
    })).filter(m=>m.count>0),
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t.billing} subtitle={`${invoices.length} total invoices`}>
        <Btn variant="secondary" onClick={()=>setShowReport(!showReport)}>
          <BarChart2 size={14}/>{showReport?'Hide Report':'Invoice Report'}
        </Btn>
        <Btn variant="primary" onClick={()=>setView('new')}><Plus size={15}/>{t.newSale}</Btn>
      </PageHeader>

      {/* ── INVOICE REPORT ── */}
      {showReport && (
        <div className="bg-gray-900 border border-orange-500/20 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-orange-400 font-semibold flex items-center gap-2"><BarChart2 size={15}/>Invoice Report</h3>
            <Btn variant="secondary" size="sm" onClick={()=>{ setSelected(filtered.map(i=>i.id)); setTimeout(bulkExportExcel,50); }}><Download size={13}/>Export All</Btn>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {label:'Total Invoices', val:reportData.totalInvs,              c:'text-white'},
              {label:'Total Revenue',  val:fmt(reportData.totalRevenue),       c:'text-orange-400'},
              {label:'Taxable Amount', val:fmt(reportData.totalTaxable),       c:'text-blue-400'},
              {label:'Total GST',      val:fmt(reportData.totalGST),           c:'text-yellow-400'},
              {label:'CGST',           val:fmt(reportData.totalCGST),          c:'text-yellow-400'},
              {label:'SGST',           val:fmt(reportData.totalSGST),          c:'text-yellow-400'},
              {label:'IGST',           val:fmt(reportData.totalIGST),          c:'text-yellow-400'},
              {label:'Collected',      val:fmt(reportData.collected),          c:'text-green-400'},
              {label:'Pending',        val:fmt(reportData.pending),            c:'text-red-400'},
            ].map(s=>(
              <div key={s.label} className="bg-gray-800 rounded-xl p-3 text-center">
                <div className={`font-bold text-base ${s.c}`}>{s.val}</div>
                <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Payment Mode Breakdown */}
          {reportData.byMode.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide">Payment Mode Breakdown</p>
              <div className="flex flex-wrap gap-2">
                {reportData.byMode.map(m=>(
                  <div key={m.mode} className="bg-gray-800 rounded-xl px-4 py-2.5 text-center min-w-24">
                    <div className="text-white font-semibold text-sm">{fmt(m.amount)}</div>
                    <div className="text-gray-400 text-xs">{m.mode} ({m.count})</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:'Total Revenue', val:fmt(totals.all),     color:'text-white'},
          {label:'Collected',     val:fmt(totals.paid),    color:'text-green-400'},
          {label:'Unpaid',        val:fmt(totals.unpaid),  color:'text-red-400'},
          {label:'Partial Due',   val:fmt(totals.partial), color:'text-yellow-400'},
        ].map(s=>(
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`font-bold text-lg ${s.color}`}>{s.val}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── DATE FILTER ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <p className="text-gray-500 text-xs mb-1.5 flex items-center gap-1"><Calendar size={11}/>Quick Date Filter</p>
            <div className="flex gap-1 flex-wrap">
              {[['all','All'],['today','Today'],['week','This Week'],['month','This Month'],['last','Last Month'],['fy','FY 2024-25']].map(([v,l])=>(
                <button key={v} onClick={()=>applyQuickDate(v)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${quickDate===v?'bg-orange-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2 ml-auto">
            <div>
              <p className="text-gray-500 text-xs mb-1">From</p>
              <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setQuickDate('custom');}}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-500"/>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">To</p>
              <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setQuickDate('custom');}}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-500"/>
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH + STATUS FILTER ── */}
      <div className="flex flex-wrap gap-2">
        <SearchBar value={search} onChange={setSearch} placeholder="Search invoice no or customer..." className="flex-1 min-w-48"/>
        <div className="flex gap-1 flex-wrap">
          {['all','paid','unpaid','partial','cancelled'].map(s=>(
            <button key={s} onClick={()=>setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter===s?'bg-orange-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── BULK ACTION BAR ── */}
      {selected.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-orange-400 font-semibold text-sm">{selected.length} invoice{selected.length>1?'s':''} selected</span>
          <span className="text-gray-400 text-xs">Total: {fmt(selectedInvs.reduce((s,i)=>s+i.grand_total,0))}</span>
          <div className="flex gap-2 ml-auto flex-wrap">
            <Btn variant="secondary" size="sm" onClick={bulkPrint}>
              <Printer size={13}/>Print All
            </Btn>
            <Btn variant="secondary" size="sm" onClick={bulkDownloadPDF}>
              <Download size={13}/>PDF All
            </Btn>
            <Btn variant="secondary" size="sm" onClick={bulkExportExcel}>
              <FileText size={13}/>Excel
            </Btn>
            <Btn variant="secondary" size="sm" onClick={()=>setSelected([])}>
              <X size={13}/>Clear
            </Btn>
          </div>
        </div>
      )}

      {/* ── INVOICE TABLE ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* Table header with select all */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <button onClick={toggleAll} className="text-gray-400 hover:text-orange-400 transition-colors">
              {allSelected ? <CheckSquare size={16} className="text-orange-400"/> : <Square size={16}/>}
            </button>
            <span className="text-gray-500 text-xs">{filtered.length} invoices{dateFrom||dateTo?' in range':''}</span>
          </div>
          {filtered.length > 0 && (
            <div className="flex gap-2">
              <Btn variant="secondary" size="sm" onClick={()=>setSelected(filtered.map(i=>i.id))}>
                Select All {filtered.length}
              </Btn>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500">
                <th className="w-8 px-4 py-3"></th>
                <th className="text-left px-4 py-3">INVOICE NO</th>
                <th className="text-left px-4 py-3">CUSTOMER</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">DATE</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">MODE</th>
                <th className="text-right px-4 py-3">AMOUNT</th>
                <th className="text-center px-4 py-3">STATUS</th>
                <th className="text-center px-4 py-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0&&(
                <tr><td colSpan={8} className="text-center py-12 text-gray-600 text-sm">
                  No invoices found for the selected filters
                </td></tr>
              )}
              {filtered.map(inv=>(
                <tr key={inv.id}
                  className={`border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors ${selected.includes(inv.id)?'bg-orange-500/5':''}`}>
                  <td className="px-4 py-3">
                    <button onClick={()=>toggleOne(inv.id)} className="text-gray-500 hover:text-orange-400 transition-colors">
                      {selected.includes(inv.id)?<CheckSquare size={15} className="text-orange-400"/>:<Square size={15}/>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-orange-400 font-mono text-xs">{inv.invoice_no}</span>
                    {inv.is_cancelled&&<div className="text-red-400 text-xs">Cancelled</div>}
                  </td>
                  <td className="px-4 py-3"><span className="text-white text-sm">{inv.customer_name}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="text-gray-400 text-xs">{fmtDate(inv.invoice_date)}</span></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><span className="text-gray-400 text-xs">{inv.payment_mode}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-white font-semibold">{fmt(inv.grand_total)}</div>
                    {inv.balance_due>0&&<div className="text-red-400 text-xs">Due:{fmt(inv.balance_due)}</div>}
                  </td>
                  <td className="px-4 py-3 text-center"><Badge status={inv.status}/></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={()=>setViewInv(inv)} title="View" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-blue-400 transition-colors"><Eye size={13}/></button>
                      <button onClick={()=>handlePDF(inv)} title="PDF" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-orange-400 transition-colors"><Download size={13}/></button>
                      <button onClick={()=>handlePrint(inv)} title="Print" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors"><Printer size={13}/></button>
                      <button onClick={()=>handleWhatsApp(inv)} title="WhatsApp" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-green-400 transition-colors"><Phone size={13}/></button>
                      {inv.status!=='cancelled'&&inv.status!=='paid'&&(
                        <button onClick={()=>handleMarkPaid(inv)} title="Mark Paid" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-green-400 transition-colors text-xs font-bold">✓</button>
                      )}
                      {inv.status!=='cancelled'&&(
                        <button onClick={()=>handleCancel(inv)} title="Cancel" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors text-xs">✕</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length>0&&(
              <tfoot>
                <tr className="bg-gray-800/60 border-t border-gray-700">
                  <td colSpan={5} className="px-4 py-3 text-gray-400 text-sm font-semibold">
                    Total ({filtered.length} invoices){selected.length>0?` · ${selected.length} selected`:''}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-white font-bold">{fmt(filtered.reduce((s,i)=>s+i.grand_total,0))}</div>
                    <div className="text-yellow-400 text-xs">GST: {fmt(filtered.reduce((s,i)=>s+i.total_gst,0))}</div>
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── VIEW INVOICE MODAL ── */}
      {viewInv && (
        <Modal open={!!viewInv} onClose={()=>setViewInv(null)} title={`${viewInv.invoice_type||'Invoice'}: ${viewInv.invoice_no}`} size="lg">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Customer</p>
                <p className="text-white font-semibold">{viewInv.customer_name}</p>
                {viewInv.customer_gstin&&<p className="text-gray-400 text-xs font-mono">{viewInv.customer_gstin}</p>}
                {viewInv.billing_address&&<p className="text-gray-500 text-xs">{viewInv.billing_address}</p>}
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">Date / Mode</p>
                <p className="text-white">{fmtDate(viewInv.invoice_date)}</p>
                <p className="text-gray-400 text-xs">{viewInv.payment_mode}</p>
                <Badge status={viewInv.status}/>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-800 text-xs text-gray-500">
                  <th className="text-left py-2">#</th>
                  <th className="text-left py-2">PART</th>
                  <th className="text-center py-2">QTY</th>
                  <th className="text-right py-2">RATE</th>
                  <th className="text-right py-2">GST</th>
                  <th className="text-right py-2">TOTAL</th>
                </tr></thead>
                <tbody>
                  {(viewInv.items||[]).map((item,i)=>{
                    const calc=calcLineItem(item.qty,item.rate,item.discount_pct||0,item.gst_rate,viewInv.supply_type);
                    return(
                      <tr key={i} className="border-b border-gray-800/40">
                        <td className="py-2 text-gray-600 text-xs">{i+1}</td>
                        <td className="py-2 text-white">{item.part_name}<div className="text-gray-500 text-xs">{item.part_code}</div></td>
                        <td className="py-2 text-center text-gray-300">{item.qty}</td>
                        <td className="py-2 text-right text-gray-300">{fmt(item.rate)}</td>
                        <td className="py-2 text-right text-yellow-400 text-xs">{fmt(calc.total)}</td>
                        <td className="py-2 text-right text-white font-medium">{fmt(calc.totalAmt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 text-sm border-t border-gray-800 pt-3">
              <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>{fmt(viewInv.subtotal)}</span></div>
              {viewInv.discount_amt>0&&<div className="flex justify-between text-red-400"><span>Discount</span><span>-{fmt(viewInv.discount_amt)}</span></div>}
              <div className="flex justify-between text-gray-400"><span>Taxable</span><span>{fmt(viewInv.taxable_amt)}</span></div>
              <div className="flex justify-between text-gray-400"><span>GST</span><span>{fmt(viewInv.total_gst)}</span></div>
              <div className="flex justify-between text-white font-bold text-base"><span>Grand Total</span><span className="text-orange-400">{fmt(viewInv.grand_total)}</span></div>
              {viewInv.balance_due>0&&<div className="flex justify-between text-red-400"><span>Balance Due</span><span>{fmt(viewInv.balance_due)}</span></div>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Btn variant="secondary" onClick={()=>handlePrint(viewInv)}><Printer size={13}/>Print</Btn>
              <Btn variant="secondary" onClick={()=>handlePDF(viewInv)}><Download size={13}/>PDF</Btn>
              <Btn variant="green" onClick={()=>handleWhatsApp(viewInv)}><Phone size={13}/>WhatsApp</Btn>
              {viewInv.status!=='paid'&&viewInv.status!=='cancelled'&&(
                <Btn variant="green" onClick={()=>handleMarkPaid(viewInv)}>✓ Mark as Paid</Btn>
              )}
              {viewInv.status!=='cancelled'&&(
                <Btn variant="danger" onClick={()=>handleCancel(viewInv)}>✕ Cancel Invoice</Btn>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
