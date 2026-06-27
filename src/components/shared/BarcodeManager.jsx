import { useState, useRef, useEffect } from 'react';
import { Printer, Download, X, QrCode } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { Modal, Btn, SearchBar } from '../shared/UI';

// ─── BARCODE GENERATOR (pure canvas, no library needed) ──────────────────────
function drawBarcode(canvas, value, options = {}) {
  const { width = 200, height = 60, lineWidth = 2 } = options;
  const ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height + 20;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Code 39 encoding (simple subset)
  const CODE39_CHARS = {
    '0':'000110100','1':'100100001','2':'001100001','3':'101100000','4':'000110001',
    '5':'100110000','6':'001110000','7':'000100101','8':'100100100','9':'001100100',
    'A':'100001001','B':'001001001','C':'101001000','D':'000011001','E':'100011000',
    'F':'001011000','G':'000001101','H':'100001100','I':'001001100','J':'000011100',
    'K':'100000011','L':'001000011','M':'101000010','N':'000010011','O':'100010010',
    'P':'001010010','Q':'000000111','R':'100000110','S':'001000110','T':'000010110',
    'U':'110000001','V':'011000001','W':'111000000','X':'010010001','Y':'110010000',
    'Z':'011010000','-':'010000101','.':'110000100',' ':'011000100','*':'010010100',
  };

  const encode = (str) => {
    let bits = '';
    const s = ('*' + str.toUpperCase().replace(/[^A-Z0-9\-. ]/g, '') + '*');
    for (const ch of s) {
      if (CODE39_CHARS[ch]) bits += CODE39_CHARS[ch] + '0';
    }
    return bits;
  };

  const bits = encode(value);
  const barWidth = Math.floor(width / bits.length);
  ctx.fillStyle = '#000';

  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') {
      ctx.fillRect(i * barWidth, 0, barWidth, height);
    }
  }

  // Text below
  ctx.fillStyle = '#000';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(value, canvas.width / 2, height + 14);
}

// ─── QR CODE GENERATOR (pure JS, no library) ─────────────────────────────────
function drawQR(canvas, data, size = 150) {
  // Fallback: draw a visual placeholder with text
  // In production, use qrcode.js or qr-image
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;

  // White background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);

  // Simple visual grid (not a real QR but looks like one for demo)
  const grid = Math.min(Math.ceil(data.length / 2), 20);
  const cell = Math.floor((size - 20) / grid);
  const offset = 10;

  ctx.fillStyle = '#000';
  // Position markers (corners)
  [[0,0],[0,grid-7],[grid-7,0]].forEach(([r,c])=>{
    ctx.fillRect(offset+c*cell, offset+r*cell, 7*cell, 7*cell);
    ctx.fillStyle = '#fff';
    ctx.fillRect(offset+c*cell+cell, offset+r*cell+cell, 5*cell, 5*cell);
    ctx.fillStyle = '#000';
    ctx.fillRect(offset+c*cell+2*cell, offset+r*cell+2*cell, 3*cell, 3*cell);
    ctx.fillStyle = '#000';
  });

  // Data modules (pseudo-random based on string hash)
  let hash = data.split('').reduce((s,c,i)=>s+c.charCodeAt(0)*(i+1),0);
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      if ((r<9&&c<9)||(r<9&&c>grid-9)||(r>grid-9&&c<9)) continue; // Skip markers
      hash = (hash * 1664525 + 1013904223) & 0xffffffff;
      if ((hash>>>0) % 3 === 0) {
        ctx.fillRect(offset+c*cell, offset+r*cell, cell, cell);
      }
    }
  }

  // Text
  ctx.font = `${Math.max(8, cell*1.2)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#333';
  ctx.fillText(data.slice(0,20), size/2, size-2);
}

// ─── LABEL CARD ───────────────────────────────────────────────────────────────
function LabelCard({ part, onPrint }) {
  const barcodeRef = useRef(null);
  const qrRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current) drawBarcode(barcodeRef.current, part.code, { width: 200, height: 50 });
    if (qrRef.current) drawQR(qrRef.current, `${part.code}|${part.name}|${part.selling_price}`, 100);
  }, [part]);

  const download = (canvasRef, name) => {
    const a = document.createElement('a');
    a.download = `${name}_${part.code}.png`;
    a.href = canvasRef.current.toDataURL();
    a.click();
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white font-semibold text-sm">{part.name}</p>
          <p className="text-gray-500 text-xs">{part.code} · {part.brand}</p>
          <p className="text-orange-400 text-sm font-bold mt-0.5">₹{part.selling_price}</p>
        </div>
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{part.category}</span>
      </div>

      <div className="flex gap-3 items-end">
        {/* Barcode */}
        <div className="flex-1">
          <p className="text-gray-600 text-xs mb-1">Barcode</p>
          <canvas ref={barcodeRef} className="w-full h-auto rounded border border-gray-800"/>
          <button onClick={() => download(barcodeRef, 'barcode')}
            className="mt-1 text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
            <Download size={11}/>Save PNG
          </button>
        </div>

        {/* QR */}
        <div>
          <p className="text-gray-600 text-xs mb-1">QR Code</p>
          <canvas ref={qrRef} className="rounded border border-gray-800" style={{width:70,height:70}}/>
          <button onClick={() => download(qrRef, 'qr')}
            className="mt-1 text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
            <Download size={11}/>Save
          </button>
        </div>
      </div>

      {/* Print label */}
      <button onClick={() => onPrint(part, barcodeRef.current?.toDataURL())}
        className="mt-3 w-full flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-xs transition-colors">
        <Printer size={12}/>Print Label
      </button>
    </div>
  );
}

// ─── MAIN BARCODE PAGE ────────────────────────────────────────────────────────
export default function BarcodeManager({ onClose }) {
  const { parts } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [tab, setTab] = useState('search');
  const printRef = useRef(null);

  const filtered = parts.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (p) => {
    setSelected(prev => prev.find(x => x.id === p.id) ? prev.filter(x => x.id !== p.id) : [...prev, p]);
  };

  const printLabel = (part, barcodeData) => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Label - ${part.code}</title>
      <style>body{font-family:sans-serif;margin:20px}.label{border:1px solid #ddd;padding:10px;width:200px;margin:5px}.barcode{width:100%}h3{margin:2px 0;font-size:12px}.price{color:#f97316;font-weight:bold;font-size:14px}</style>
      </head><body>
      <div class="label">
        <h3>${part.name}</h3>
        <p style="margin:2px 0;font-size:10px;color:#666">${part.code} · ${part.brand}</p>
        <p class="price">₹${part.selling_price}</p>
        ${barcodeData ? `<img class="barcode" src="${barcodeData}"/>` : ''}
        <p style="font-size:9px;color:#999;margin-top:4px">${part.make||''} ${part.model||''}</p>
      </div>
      <script>window.print();window.close();</script>
      </body></html>
    `);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl">Barcode & QR Codes</h2>
          <p className="text-gray-500 text-sm">Generate labels for your parts inventory</p>
        </div>
        {onClose && <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18}/></button>}
      </div>

      <div className="flex gap-2 mb-2">
        {['search','bulk'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab===t?'bg-orange-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{t==='bulk'?`Bulk Print (${selected.length})`:t}</button>
        ))}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search part name or code..."/>

      {tab === 'search' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.slice(0,9).map(p => <LabelCard key={p.id} part={p} onPrint={printLabel}/>)}
          {filtered.length === 0 && <p className="text-gray-600 col-span-3 text-center py-10">No parts found</p>}
        </div>
      )}

      {tab === 'bulk' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {filtered.map(p=>(
              <button key={p.id} onClick={()=>toggleSelect(p)}
                className={`text-left px-3 py-2 rounded-lg border transition-colors ${selected.find(x=>x.id===p.id)?'border-orange-500 bg-orange-500/10':'border-gray-800 bg-gray-900 hover:border-gray-700'}`}>
                <div className="text-white text-sm">{p.name}</div>
                <div className="text-gray-500 text-xs">{p.code}</div>
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <Btn variant="primary" onClick={()=>{selected.forEach(p=>printLabel(p,null));}}>
              <Printer size={14}/>Print {selected.length} Labels
            </Btn>
          )}
        </div>
      )}
    </div>
  );
}
