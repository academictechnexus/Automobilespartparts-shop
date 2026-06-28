import { useState, useRef } from 'react';
import { Plus, Printer, Phone, Download, Eye, ChevronLeft, X, CheckCircle } from 'lucide-react';
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
                        <div className={`text-xs ${p.stock <= p.reorder_level ? 'text-red-400' : 'text-green-400'}`}>{p.stock} in stock</div>
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
  const [view, setView]           = useState('list');
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewInv, setViewInv]     = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);

  const filtered = invoices.filter(inv => {
    const ms = !search || inv.invoice_no?.toLowerCase().includes(search.toLowerCase()) || inv.customer_name?.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'all' || inv.status === statusFilter;
    return ms && mst;
  });

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

  const totals = {
    all: invoices.reduce((s,i)=>s+i.grand_total,0),
    paid: invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.grand_total,0),
    unpaid: invoices.filter(i=>i.status==='unpaid').reduce((s,i)=>s+i.balance_due,0),
    partial: invoices.filter(i=>i.status==='partial').reduce((s,i)=>s+i.balance_due,0),
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

  return (
    <div className="space-y-4">
      <PageHeader title={t.billing} subtitle={`${invoices.length} invoices`}>
        <Btn variant="primary" onClick={() => setView('new')}><Plus size={15}/>{t.newSale}</Btn>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:'Total Revenue', val:fmt(totals.all),    color:'text-white'},
          {label:'Collected',     val:fmt(totals.paid),   color:'text-green-400'},
          {label:'Unpaid',        val:fmt(totals.unpaid), color:'text-red-400'},
          {label:'Partial Due',   val:fmt(totals.partial),color:'text-yellow-400'},
        ].map(s=>(
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`font-bold text-lg ${s.color}`}>{s.val}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
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

      {/* Table */}
      <Table>
        <THead cols={[
          {label:'INVOICE NO'},{label:'CUSTOMER'},
          {label:'DATE',hidden:'hidden md:table-cell'},
          {label:'AMOUNT',align:'right'},
          {label:'STATUS',align:'center'},
          {label:'ACTIONS',align:'center'},
        ]}/>
        <tbody>
          {filtered.length===0&&<tr><td colSpan={6} className="text-center py-12 text-gray-600 text-sm">No invoices found</td></tr>}
          {filtered.map(inv=>(
            <TRow key={inv.id}>
              <TD><span className="text-orange-400 font-mono text-xs">{inv.invoice_no}</span></TD>
              <TD><span className="text-white text-sm">{inv.customer_name}</span></TD>
              <TD className="hidden md:table-cell"><span className="text-gray-400 text-xs">{fmtDate(inv.invoice_date)}</span></TD>
              <TD align="right">
                <div className="text-white font-semibold">{fmt(inv.grand_total)}</div>
                {inv.balance_due>0&&<div className="text-red-400 text-xs">Due: {fmt(inv.balance_due)}</div>}
              </TD>
              <TD align="center"><Badge status={inv.status}/></TD>
              <TD align="center">
                <div className="flex items-center justify-center gap-1.5">
                  <button onClick={()=>setViewInv(inv)} title="View" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-blue-400 transition-colors"><Eye size={13}/></button>
                  <button onClick={()=>handlePDF(inv)} title="PDF" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-orange-400 transition-colors"><Download size={13}/></button>
                  <button onClick={()=>handlePrint(inv)} title="Print" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors"><Printer size={13}/></button>
                  <button onClick={()=>handleWhatsApp(inv)} title="WhatsApp" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-green-400 transition-colors"><Phone size={13}/></button>
                  {inv.status!=='cancelled'&&inv.status!=='paid'&&(
                    <button onClick={()=>handleMarkPaid(inv)} title="Mark as Paid" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-green-400 transition-colors text-xs font-bold">✓</button>
                  )}
                  {inv.status!=='cancelled'&&(
                    <button onClick={()=>handleCancel(inv)} title="Cancel Invoice" className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors text-xs">✕</button>
                  )}
                </div>
              </TD>
            </TRow>
          ))}
        </tbody>
      </Table>

      {/* View Invoice Modal */}
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
                <p className="text-gray-500 text-xs">Date</p>
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
