import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Command, Bell, BellOff, Download, Wifi, WifiOff, Zap } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { fmt } from '../../utils/helpers';

// ─── GLOBAL SEARCH ────────────────────────────────────────────────────────────
export function GlobalSearch({ open, onClose, setPage }) {
  const { parts, customers, suppliers, invoices, jobCards } = useApp();
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setQ(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); open ? onClose() : null; }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const results = !q ? [] : [
    ...parts.filter(p => p.name?.toLowerCase().includes(q.toLowerCase()) || p.code?.toLowerCase().includes(q.toLowerCase())).slice(0,4).map(p => ({
      type: 'Part', label: p.name, sub: `${p.code} · ${fmt(p.selling_price)} · Stock: ${p.stock}`,
      icon: '📦', action: () => { setPage('inventory'); onClose(); },
    })),
    ...customers.filter(c => c.name?.toLowerCase().includes(q.toLowerCase()) || c.phone?.includes(q)).slice(0,3).map(c => ({
      type: 'Customer', label: c.name, sub: c.phone,
      icon: '👤', action: () => { setPage('customers'); onClose(); },
    })),
    ...invoices.filter(i => i.invoice_no?.toLowerCase().includes(q.toLowerCase()) || i.customer_name?.toLowerCase().includes(q.toLowerCase())).slice(0,3).map(i => ({
      type: 'Invoice', label: i.invoice_no, sub: `${i.customer_name} · ${fmt(i.grand_total)}`,
      icon: '🧾', action: () => { setPage('billing'); onClose(); },
    })),
    ...jobCards.filter(j => j.vehicle_no?.toLowerCase().includes(q.toLowerCase()) || j.customer_name?.toLowerCase().includes(q.toLowerCase())).slice(0,2).map(j => ({
      type: 'Job Card', label: j.job_no, sub: `${j.vehicle_no} · ${j.customer_name}`,
      icon: '🔧', action: () => { setPage('jobcards'); onClose(); },
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}/>
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <Search size={16} className="text-gray-500 flex-shrink-0"/>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Search parts, customers, invoices, vehicle no..."
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-600"/>
          <kbd className="hidden sm:block bg-gray-800 text-gray-500 text-xs px-1.5 py-0.5 rounded">ESC</kbd>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={15}/></button>
        </div>

        {!q && (
          <div className="p-4">
            <p className="text-gray-600 text-xs mb-2 uppercase tracking-wide">Shortcuts</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[['Ctrl+K','Global Search'],['Ctrl+N','New Invoice'],['Ctrl+I','Inventory'],['Ctrl+R','Reports']].map(([k,l])=>(
                <div key={k} className="flex items-center gap-2 text-xs text-gray-500">
                  <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 font-mono">{k}</kbd>{l}
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="py-2 max-h-80 overflow-y-auto">
            {results.map((r, i) => (
              <button key={i} onClick={r.action}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 text-left transition-colors">
                <span className="text-lg flex-shrink-0">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{r.label}</div>
                  <div className="text-gray-500 text-xs truncate">{r.sub}</div>
                </div>
                <span className="text-gray-600 text-xs flex-shrink-0">{r.type}</span>
              </button>
            ))}
          </div>
        )}

        {q && results.length === 0 && (
          <div className="py-10 text-center text-gray-600 text-sm">No results for "{q}"</div>
        )}
      </div>
    </div>
  );
}

// ─── NOTIFICATION CENTER ──────────────────────────────────────────────────────
export function NotificationCenter({ open, onClose }) {
  const { parts, invoices, stats } = useApp();

  const notifications = [
    ...parts.filter(p=>p.stock===0).slice(0,3).map(p=>({
      id:`out_${p.id}`, type:'danger', title:`Out of Stock: ${p.name}`, sub:`Code: ${p.code}`, time:'now',
    })),
    ...parts.filter(p=>p.stock>0&&p.stock<=p.reorder_level).slice(0,4).map(p=>({
      id:`low_${p.id}`, type:'warn', title:`Low Stock: ${p.name}`, sub:`Only ${p.stock} ${p.unit} left`, time:'now',
    })),
    ...invoices.filter(i=>i.status==='unpaid').slice(0,3).map(i=>({
      id:`due_${i.id}`, type:'info', title:`Payment Due: ${i.customer_name}`, sub:`${i.invoice_no} · ${fmt(i.balance_due)}`, time:i.invoice_date,
    })),
    { id:'backup', type:'success', title:'Daily backup recommended', sub:'Last backup: check settings', time:'today' },
  ];

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 px-4">
      <div className="absolute inset-0" onClick={onClose}/>
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-80 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="text-white font-semibold text-sm">Notifications</span>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{notifications.length}</span>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={14}/></button>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-800">
          {notifications.map(n=>(
            <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-800/40">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${n.type==='danger'?'bg-red-400':n.type==='warn'?'bg-yellow-400':n.type==='info'?'bg-blue-400':'bg-green-400'}`}/>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium leading-snug">{n.title}</p>
                <p className="text-gray-500 text-xs">{n.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PWA INSTALL BANNER ───────────────────────────────────────────────────────
export function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(localStorage.getItem('pwa_dismissed') === 'true');
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setPrompt(null);
  };

  const dismiss = () => { setDismissed(true); localStorage.setItem('pwa_dismissed', 'true'); };

  if (!prompt || dismissed || installed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-sm mx-auto">
      <div className="bg-gray-900 border border-orange-500/30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
        <Download size={18} className="text-orange-400 flex-shrink-0"/>
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">Install AutoSpares App</p>
          <p className="text-gray-500 text-xs">Works offline on phone & desktop</p>
        </div>
        <div className="flex gap-2">
          <button onClick={dismiss} className="text-gray-500 hover:text-white text-xs">Later</button>
          <button onClick={install} className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors">Install</button>
        </div>
      </div>
    </div>
  );
}

// ─── OFFLINE INDICATOR ────────────────────────────────────────────────────────
export function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(false);

  useEffect(() => {
    const on = () => { setOnline(true); setPendingSync(false); };
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (online && !pendingSync) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 text-center py-1.5 text-xs font-medium ${online ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
      {online ? '✓ Back online — syncing...' : '⚠ Offline — changes saved locally'}
    </div>
  );
}

// ─── KEYBOARD SHORTCUT HANDLER ────────────────────────────────────────────────
export function useKeyboardShortcuts(setPage, openSearch) {
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'k': e.preventDefault(); openSearch(); break;
          case 'n': e.preventDefault(); setPage('billing'); break;
          case 'i': e.preventDefault(); setPage('inventory'); break;
          case 'r': e.preventDefault(); setPage('reports'); break;
          case 'd': e.preventDefault(); setPage('dashboard'); break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setPage, openSearch]);
}
