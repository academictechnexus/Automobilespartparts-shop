import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

// ─── MODAL ─────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={`relative bg-gray-900 border border-gray-700 rounded-2xl w-full ${sizes[size]} max-h-[92vh] flex flex-col shadow-2xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
          <h3 className="text-white font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors rounded-lg p-1 hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// ─── STAT CARD ─────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, icon: Icon, color = 'orange', trend, trendVal }) => {
  const colorMap = {
    orange: { bg: 'from-orange-500/15 to-orange-600/5 border-orange-500/20', icon: 'text-orange-400', trend: 'bg-orange-500/10' },
    green:  { bg: 'from-green-500/15 to-green-600/5 border-green-500/20',   icon: 'text-green-400',  trend: 'bg-green-500/10' },
    red:    { bg: 'from-red-500/15 to-red-600/5 border-red-500/20',         icon: 'text-red-400',    trend: 'bg-red-500/10' },
    blue:   { bg: 'from-blue-500/15 to-blue-600/5 border-blue-500/20',      icon: 'text-blue-400',   trend: 'bg-blue-500/10' },
    purple: { bg: 'from-purple-500/15 to-purple-600/5 border-purple-500/20',icon: 'text-purple-400', trend: 'bg-purple-500/10' },
    yellow: { bg: 'from-yellow-500/15 to-yellow-600/5 border-yellow-500/20',icon: 'text-yellow-400', trend: 'bg-yellow-500/10' },
  };
  const c = colorMap[color] || colorMap.orange;
  return (
    <div className={`bg-gradient-to-br ${c.bg} border rounded-xl p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.trend}`}>
          <Icon size={17} className={c.icon} />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${trend === 'up' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            {trend === 'up' ? '↑' : '↓'} {trendVal}
          </span>
        )}
      </div>
      <div className="text-white font-bold text-xl leading-tight mb-0.5">{value}</div>
      <div className="text-gray-400 text-xs">{label}</div>
      {sub && <div className="text-gray-600 text-xs mt-0.5">{sub}</div>}
    </div>
  );
};

// ─── BADGE ─────────────────────────────────────────────────────────────────────
export const Badge = ({ status }) => {
  const map = {
    paid: 'bg-green-500/20 text-green-400',
    unpaid: 'bg-red-500/20 text-red-400',
    partial: 'bg-yellow-500/20 text-yellow-400',
    cancelled: 'bg-gray-500/20 text-gray-400',
    received: 'bg-green-500/20 text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    open: 'bg-blue-500/20 text-blue-400',
    'in-progress': 'bg-orange-500/20 text-orange-400',
    done: 'bg-green-500/20 text-green-400',
    delivered: 'bg-purple-500/20 text-purple-400',
    OEM: 'bg-blue-500/20 text-blue-400',
    Aftermarket: 'bg-purple-500/20 text-purple-400',
    Retail: 'bg-gray-700 text-gray-400',
    Wholesale: 'bg-blue-500/20 text-blue-400',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-gray-700 text-gray-400'}`}>
      {status}
    </span>
  );
};

// ─── FORM FIELD ───────────────────────────────────────────────────────────────
export const Field = ({ label, required, children, className = '' }) => (
  <div className={className}>
    <label className="text-gray-400 text-xs mb-1.5 block">
      {label}{required && <span className="text-orange-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export const Input = ({ className = '', ...props }) => (
  <input className={`w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder-gray-600 ${className}`} {...props} />
);

export const Select = ({ children, className = '', ...props }) => (
  <select className={`w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors ${className}`} {...props}>
    {children}
  </select>
);

export const Textarea = ({ className = '', ...props }) => (
  <textarea className={`w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder-gray-600 resize-none ${className}`} {...props} />
);

// ─── BUTTON ────────────────────────────────────────────────────────────────────
export const Btn = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => {
  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-300',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
    ghost: 'hover:bg-gray-800 text-gray-400 hover:text-white',
    green: 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30',
  };
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  return (
    <button className={`inline-flex items-center gap-1.5 font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
import { Search } from 'lucide-react';
export const SearchBar = ({ value, onChange, placeholder, className = '' }) => (
  <div className={`relative ${className}`}>
    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-orange-500 placeholder-gray-600" />
  </div>
);

// ─── PAGE HEADER ──────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, children }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
    <div>
      <h2 className="text-white font-bold text-xl">{title}</h2>
      {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
    </div>
    {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
  </div>
);

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, message, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
      <Icon size={24} className="text-gray-600" />
    </div>
    <p className="text-gray-500 text-sm mb-4">{message}</p>
    {action}
  </div>
);

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
export const Confirm = ({ open, onConfirm, onCancel, message = 'Are you sure?' }) => (
  <Modal open={open} onClose={onCancel} title="Confirm" size="sm">
    <div className="p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <p className="text-gray-300 text-sm">{message}</p>
      </div>
      <div className="flex gap-3">
        <Btn variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Btn>
        <Btn variant="danger" className="flex-1" onClick={onConfirm}>Delete</Btn>
      </div>
    </div>
  </Modal>
);

// ─── TABLE WRAPPER ────────────────────────────────────────────────────────────
export const Table = ({ children }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  </div>
);

export const THead = ({ cols }) => (
  <thead>
    <tr className="border-b border-gray-800">
      {cols.map((col, i) => (
        <th key={i} className={`text-gray-500 font-medium text-xs px-4 py-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.hidden || ''}`}>
          {col.label}
        </th>
      ))}
    </tr>
  </thead>
);

export const TRow = ({ children, onClick }) => (
  <tr onClick={onClick} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${onClick ? 'cursor-pointer' : ''}`}>
    {children}
  </tr>
);

export const TD = ({ children, align, className = '' }) => (
  <td className={`px-4 py-3 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''} ${className}`}>
    {children}
  </td>
);
