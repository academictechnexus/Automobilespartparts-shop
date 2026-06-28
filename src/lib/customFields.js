/**
 * Custom Fields System
 * - Admin defines custom fields per module (inventory / purchase / billing)
 * - Fields saved to localStorage
 * - Components read fields and render them dynamically
 * - Values saved alongside the record
 */

// â”€â”€â”€ FIELD TYPES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const FIELD_TYPES = [
  { value: 'text',     label: 'Text',           desc: 'Short text input' },
  { value: 'number',   label: 'Number',          desc: 'Numeric value' },
  { value: 'textarea', label: 'Long Text',       desc: 'Multi-line text' },
  { value: 'select',   label: 'Dropdown',        desc: 'Select from options' },
  { value: 'date',     label: 'Date',            desc: 'Date picker' },
  { value: 'checkbox', label: 'Yes/No',          desc: 'Toggle checkbox' },
  { value: 'url',      label: 'URL / Link',      desc: 'Web link' },
];

// â”€â”€â”€ MODULES that support custom fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const MODULES = [
  { key: 'inventory', label: 'Inventory / Parts',  icon: 'ðŸ“¦' },
  { key: 'purchase',  label: 'Purchase Orders',     icon: 'ðŸ›’' },
  { key: 'billing',   label: 'Sales Invoice',       icon: 'ðŸ§¾' },
  { key: 'customer',  label: 'Customers',           icon: 'ðŸ‘¥' },
  { key: 'supplier',  label: 'Suppliers',           icon: 'ðŸš›' },
  { key: 'jobcard',   label: 'Job Cards',           icon: 'ðŸ”§' },
];

const STORAGE_KEY = 'custom_fields_v1';

// â”€â”€â”€ STORAGE HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getAllCustomFields = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
};

export const getCustomFields = (module) => {
  const all = getAllCustomFields();
  return all[module] || [];
};

export const saveCustomFields = (module, fields) => {
  const all = getAllCustomFields();
  all[module] = fields;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

// â”€â”€â”€ RENDER custom field value in form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const renderCustomField = (field, value, onChange) => {
  const base = "w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500";

  switch (field.type) {
    case 'text':
      return <input type="text" className={base} value={value||''} placeholder={field.placeholder||''} onChange={e=>onChange(e.target.value)}/>;
    case 'number':
      return <input type="number" className={base} value={value||''} placeholder={field.placeholder||'0'} onChange={e=>onChange(e.target.value)}/>;
    case 'textarea':
      return <textarea className={`${base} resize-none`} rows={2} value={value||''} placeholder={field.placeholder||''} onChange={e=>onChange(e.target.value)}/>;
    case 'date':
      return <input type="date" className={base} value={value||''} onChange={e=>onChange(e.target.value)}/>;
    case 'url':
      return <input type="url" className={base} value={value||''} placeholder="https://" onChange={e=>onChange(e.target.value)}/>;
    case 'checkbox':
      return (
        <button type="button" onClick={()=>onChange(!value)}
          className={`w-11 h-6 rounded-full transition-colors relative ${value?'bg-orange-500':'bg-gray-700'}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${value?'left-6':'left-1'}`}/>
        </button>
      );
    case 'select':
      return (
        <select className={base} value={value||''} onChange={e=>onChange(e.target.value)}>
          <option value="">â€” Select â€”</option>
          {(field.options||'').split(',').map(o=>o.trim()).filter(Boolean).map(o=>(
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    default:
      return <input type="text" className={base} value={value||''} onChange={e=>onChange(e.target.value)}/>;
  }
};

// â”€â”€â”€ DISPLAY custom field value (read-only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const displayCustomValue = (field, value) => {
  if (value === null || value === undefined || value === '') return 'â€”';
  if (field.type === 'checkbox') return value ? 'âœ“ Yes' : 'âœ— No';
  if (field.type === 'date') return new Date(value).toLocaleDateString('en-IN');
  if (field.type === 'url') return <a href={value} target="_blank" rel="noreferrer" className="text-blue-400 underline text-xs">{value}</a>;
  return String(value);
};
