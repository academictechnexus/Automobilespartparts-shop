import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ─── NUMBER FORMAT ─────────────────────────────────────────────────────────────
export const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

export const fmtNum = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

export const fmtDate = (d) => {
  if (!d) return '';
  try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return d; }
};

// ─── ID GENERATORS ─────────────────────────────────────────────────────────────
export const genInvoiceNo = (prefix = 'INV', counter = 1) =>
  `${prefix}-${new Date().getFullYear()}-${String(counter).padStart(4, '0')}`;

export const genId = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const today = () => format(new Date(), 'yyyy-MM-dd');

// ─── GST CALCULATION ──────────────────────────────────────────────────────────
export const calcGST = (rate, taxableAmt, supplyType = 'intrastate') => {
  const total = (taxableAmt * rate) / 100;
  if (supplyType === 'interstate') {
    return { cgst: 0, sgst: 0, igst: total, total };
  }
  return { cgst: total / 2, sgst: total / 2, igst: 0, total };
};

export const calcLineItem = (qty, rate, discPct, gstRate, supplyType) => {
  const grossAmt = qty * rate;
  const discAmt = (grossAmt * discPct) / 100;
  const taxableAmt = grossAmt - discAmt;
  const gst = calcGST(gstRate, taxableAmt, supplyType);
  return { grossAmt, discAmt, taxableAmt, ...gst, totalAmt: taxableAmt + gst.total };
};

export const calcInvoiceTotals = (items, discPct = 0, supplyType = 'intrastate') => {
  let subtotal = 0, totalDisc = 0, totalTaxable = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0;
  items.forEach(item => {
    const calc = calcLineItem(item.qty, item.rate, discPct + (item.discount_pct || 0), item.gst_rate, supplyType);
    subtotal += calc.grossAmt;
    totalDisc += calc.discAmt;
    totalTaxable += calc.taxableAmt;
    totalCgst += calc.cgst;
    totalSgst += calc.sgst;
    totalIgst += calc.igst;
  });
  const totalGst = totalCgst + totalSgst + totalIgst;
  return { subtotal, discount_amt: totalDisc, taxable_amt: totalTaxable, cgst_amt: totalCgst, sgst_amt: totalSgst, igst_amt: totalIgst, total_gst: totalGst, grand_total: totalTaxable + totalGst };
};

// ─── WHATSAPP ─────────────────────────────────────────────────────────────────
export const sendWhatsApp = (phone, invoice, shop) => {
  const msg = encodeURIComponent(
    `*${shop.name}*\n` +
    `Invoice: ${invoice.invoice_no}\n` +
    `Date: ${fmtDate(invoice.invoice_date)}\n` +
    `Amount: ${fmt(invoice.grand_total)}\n` +
    `Status: ${invoice.status.toUpperCase()}\n\n` +
    `Thank you for your business! 🙏`
  );
  window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
};

// ─── PDF INVOICE ──────────────────────────────────────────────────────────────
export const generateInvoicePDF = (invoice, items, shop, customer) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.width;

  // Header
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageW, 40, 'F');
  doc.setTextColor(249, 115, 22);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(shop.name || 'AutoSpares Pro', 14, 18);
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(shop.address || '', 14, 25);
  doc.text(`Phone: ${shop.phone || ''} | GSTIN: ${shop.gstin || ''}`, 14, 31);

  // Invoice title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(invoice.invoice_type || 'INVOICE', pageW - 14, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.text(`No: ${invoice.invoice_no}`, pageW - 14, 25, { align: 'right' });
  doc.text(`Date: ${fmtDate(invoice.invoice_date)}`, pageW - 14, 31, { align: 'right' });

  // Customer info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(customer?.name || invoice.customer_name, 14, 58);
  if (customer?.address) doc.text(customer.address, 14, 64);
  if (customer?.gst_no || invoice.customer_gstin) {
    doc.text(`GSTIN: ${customer?.gst_no || invoice.customer_gstin}`, 14, 70);
  }

  // Supply type
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Supply Type: ${invoice.supply_type === 'intrastate' ? 'Intrastate (CGST + SGST)' : 'Interstate (IGST)'}`, pageW - 14, 52, { align: 'right' });
  doc.text(`Payment: ${invoice.payment_mode}`, pageW - 14, 58, { align: 'right' });
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageW - 14, 64, { align: 'right' });

  // Items table
  const columns = invoice.supply_type === 'intrastate'
    ? ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Taxable', 'CGST', 'SGST', 'Total']
    : ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Taxable', 'IGST', 'Total'];

  const rows = items.map((item, i) => {
    const calc = calcLineItem(item.qty, item.rate, item.discount_pct || 0, item.gst_rate, invoice.supply_type);
    if (invoice.supply_type === 'intrastate') {
      return [i + 1, `${item.part_name}\n${item.part_code || ''}`, item.hsn_code, item.qty, fmt(item.rate), fmt(calc.taxableAmt), fmt(calc.cgst), fmt(calc.sgst), fmt(calc.totalAmt)];
    }
    return [i + 1, `${item.part_name}\n${item.part_code || ''}`, item.hsn_code, item.qty, fmt(item.rate), fmt(calc.taxableAmt), fmt(calc.igst), fmt(calc.totalAmt)];
  });

  doc.autoTable({
    startY: 78,
    head: [columns],
    body: rows,
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 50 } },
  });

  const finalY = doc.lastAutoTable.finalY + 8;

  // Totals
  const totals = [
    ['Subtotal', fmt(invoice.subtotal)],
    invoice.discount_amt > 0 ? ['Discount', `-${fmt(invoice.discount_amt)}`] : null,
    ['Taxable Amount', fmt(invoice.taxable_amt)],
    invoice.supply_type === 'intrastate' ? ['CGST', fmt(invoice.cgst_amt)] : null,
    invoice.supply_type === 'intrastate' ? ['SGST', fmt(invoice.sgst_amt)] : null,
    invoice.supply_type === 'interstate' ? ['IGST', fmt(invoice.igst_amt)] : null,
    ['Total GST', fmt(invoice.total_gst)],
  ].filter(Boolean);

  totals.forEach(([label, val], i) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(label, pageW - 60, finalY + i * 6);
    doc.text(val, pageW - 14, finalY + i * 6, { align: 'right' });
  });

  // Grand total
  const gtY = finalY + totals.length * 6 + 4;
  doc.setFillColor(17, 24, 39);
  doc.rect(pageW - 70, gtY - 5, 56, 10, 'F');
  doc.setTextColor(255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total', pageW - 60, gtY + 1);
  doc.text(fmt(invoice.grand_total), pageW - 14, gtY + 1, { align: 'right' });

  // Bank details
  if (shop.bank_name) {
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Details:', 14, gtY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${shop.bank_name} | A/C: ${shop.bank_account} | IFSC: ${shop.ifsc_code}`, 14, gtY + 6);
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text('Thank you for your business!', pageW / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  doc.text('This is a computer generated invoice.', pageW / 2, doc.internal.pageSize.height - 5, { align: 'center' });

  doc.save(`${invoice.invoice_no}.pdf`);
};

// ─── EXCEL / GSTR EXPORT ──────────────────────────────────────────────────────
export const exportToExcel = async (data, filename) => {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportGSTR1 = async (invoices) => {
  const data = invoices.map(inv => ({
    'Invoice No': inv.invoice_no,
    'Invoice Date': fmtDate(inv.invoice_date),
    'Customer Name': inv.customer_name,
    'Customer GSTIN': inv.customer_gstin || '',
    'Supply Type': inv.supply_type,
    'Taxable Amount': inv.taxable_amt,
    'CGST': inv.cgst_amt,
    'SGST': inv.sgst_amt,
    'IGST': inv.igst_amt,
    'Total GST': inv.total_gst,
    'Invoice Value': inv.grand_total,
  }));
  await exportToExcel(data, 'GSTR1_Export');
};

export const exportTally = (invoices) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER><VERSION>1</VERSION><TALLYREQUEST>Import</TALLYREQUEST><TYPE>Data</TYPE><ID>Vouchers</ID></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
      <REQUESTDATA>
        ${invoices.map(inv => `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create">
            <DATE>${inv.invoice_date?.replace(/-/g, '')}</DATE>
            <NARRATION>${inv.invoice_no} - ${inv.customer_name}</NARRATION>
            <PARTYLEDGERNAME>${inv.customer_name}</PARTYLEDGERNAME>
            <AMOUNT>-${inv.grand_total}</AMOUNT>
          </VOUCHER>
        </TALLYMESSAGE>`).join('')}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
  const blob = new Blob([xml], { type: 'text/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'TallyImport.xml'; a.click();
};
