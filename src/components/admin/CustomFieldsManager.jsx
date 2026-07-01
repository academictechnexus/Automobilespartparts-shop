import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, GripVertical, ChevronDown, ChevronUp, Eye, Settings2, Save, X, AlertCircle } from 'lucide-react';
import { getCustomFields, saveCustomFields, FIELD_TYPES, MODULES, renderCustomField } from '../../lib/customFields';
import { Modal, Btn, Field, Input, Select } from '../shared/UI';

// ─── FIELD EDITOR MODAL ───────────────────────────────────────────────────────
function FieldEditor({ field, onSave, onClose }) {
  const [form, setForm] = useState(field || {
    id: `cf_${Date.now()}`,
    name: '', label: '', type: 'text',
    placeholder: '', options: '', required: false,
    show_in_list: false, show_in_print: true,
    width: 'half', // half / full
  });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.label.trim()) return;
    // Auto-generate field name from label
    const name = form.name || form.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    onSave({ ...form, name });
  };

  return (
    <Modal open={true} onClose={onClose} title={field ? 'Edit Field' : 'Add Custom Field'} size="md">
      <div className="p-5 space-y-3">

        {/* Field Label */}
        <Field label="Field Label" required>
          <Input value={form.label} onChange={e => f('label', e.target.value)} placeholder="e.g. Batch Number, Warranty, Weight"/>
        </Field>

        {/* Field Type */}
        <Field label="Field Type" required>
          <Select value={form.type} onChange={e => f('type', e.target.value)}>
            {FIELD_TYPES.map(ft => (
              <option key={ft.value} value={ft.value}>{ft.label} — {ft.desc}</option>
            ))}
          </Select>
        </Field>

        {/* Dropdown Options — only for select type */}
        {form.type === 'select' && (
          <Field label="Options (comma separated)">
            <Input value={form.options||''} onChange={e => f('options', e.target.value)}
              placeholder="Option 1, Option 2, Option 3"/>
            <p className="text-gray-600 text-xs mt-1">e.g. Grade A, Grade B, Grade C</p>
          </Field>
        )}

        {/* Placeholder */}
        {!['checkbox','select','date'].includes(form.type) && (
          <Field label="Placeholder Text">
            <Input value={form.placeholder||''} onChange={e => f('placeholder', e.target.value)} placeholder="Hint text shown inside field"/>
          </Field>
        )}

        {/* Width */}
        <Field label="Field Width">
          <div className="flex gap-2">
            {[['half','Half Width (2 columns)'],['full','Full Width']].map(([v,l])=>(
              <button key={v} type="button" onClick={()=>f('width',v)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${form.width===v?'bg-orange-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
        </Field>

        {/* Options */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { key:'required',      label:'Required',      sub:'Must fill this field' },
            { key:'show_in_list',  label:'Show in Table', sub:'Column in list view' },
            { key:'show_in_print', label:'Show in Print', sub:'Include in PDF/print' },
          ].map(opt => (
            <div key={opt.key} className="bg-gray-800 rounded-xl p-3 text-center cursor-pointer" onClick={()=>f(opt.key,!form[opt.key])}>
              <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${form[opt.key]?'bg-orange-500':'bg-gray-700'}`}>
                {form[opt.key] ? '✓' : '○'}
              </div>
              <p className="text-white text-xs font-medium">{opt.label}</p>
              <p className="text-gray-500 text-xs">{opt.sub}</p>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
          <p className="text-gray-500 text-xs mb-2 uppercase tracking-wide">Preview</p>
          <label className="text-gray-400 text-xs mb-1.5 block">{form.label || 'Field Label'}{form.required&&<span className="text-orange-400 ml-0.5">*</span>}</label>
          {renderCustomField(form, '', () => {})}
        </div>

        <div className="flex gap-3 pt-2">
          <Btn variant="secondary" className="flex-1" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" className="flex-1" onClick={handleSave} disabled={!form.label.trim()}>
            <Save size={13}/>{field ? 'Update Field' : 'Add Field'}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── FIELD ROW in the list ───────────────────────────────────────────────────
function FieldRow({ field, index, total, onEdit, onDelete, onMove }) {
  const typeInfo = FIELD_TYPES.find(t => t.value === field.type);
  return (
    <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3 group">
      {/* Drag handle */}
      <div className="text-gray-600 cursor-grab flex-shrink-0">
        <GripVertical size={16}/>
      </div>

      {/* Field info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white text-sm font-medium">{field.label}</span>
          <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">{typeInfo?.label}</span>
          {field.required && <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">Required</span>}
          {field.show_in_list && <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">In Table</span>}
          {field.show_in_print && <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">In Print</span>}
          <span className="text-xs text-gray-600">{field.width === 'full' ? 'Full width' : 'Half width'}</span>
        </div>
        {field.type === 'select' && field.options && (
          <p className="text-gray-600 text-xs mt-0.5">Options: {field.options}</p>
        )}
        {field.placeholder && (
          <p className="text-gray-600 text-xs mt-0.5">Placeholder: {field.placeholder}</p>
        )}
      </div>

      {/* Move up/down */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button onClick={() => onMove(index, -1)} disabled={index === 0}
          className="p-0.5 text-gray-600 hover:text-gray-400 disabled:opacity-20 transition-colors">
          <ChevronUp size={14}/>
        </button>
        <button onClick={() => onMove(index, 1)} disabled={index === total - 1}
          className="p-0.5 text-gray-600 hover:text-gray-400 disabled:opacity-20 transition-colors">
          <ChevronDown size={14}/>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onEdit(field)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-orange-400 transition-colors">
          <Edit2 size={13}/>
        </button>
        <button onClick={() => onDelete(field.id)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors">
          <Trash2 size={13}/>
        </button>
      </div>
    </div>
  );
}

// ─── MAIN CUSTOM FIELDS MANAGER ──────────────────────────────────────────────
export default function CustomFieldsManager() {
  const [activeModule, setActiveModule] = useState('inventory');
  const [fields, setFields]     = useState(() => getCustomFields('inventory'));
  const [showEditor, setShowEditor] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [saved, setSaved]       = useState(false);

  // Load fields when module changes
  useEffect(() => {
    setFields(getCustomFields(activeModule));
  }, [activeModule]);

  const saveAll = () => {
    saveCustomFields(activeModule, fields);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveField = (field) => {
    setFields(prev => {
      const exists = prev.find(f => f.id === field.id);
      if (exists) return prev.map(f => f.id === field.id ? field : f);
      return [...prev, field];
    });
    setShowEditor(false);
    setEditingField(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this custom field? Existing data using this field will not be deleted.')) {
      setFields(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setShowEditor(true);
  };

  const handleMove = (index, dir) => {
    setFields(prev => {
      const arr = [...prev];
      const newIdx = index + dir;
      if (newIdx < 0 || newIdx >= arr.length) return arr;
      [arr[index], arr[newIdx]] = [arr[newIdx], arr[index]];
      return arr;
    });
  };

  const activeModuleInfo = MODULES.find(m => m.key === activeModule);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Settings2 size={16} className="text-orange-400"/> Custom Fields Manager
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">Add extra fields to forms across the app. Admin only.</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="primary" size="sm" onClick={() => { setEditingField(null); setShowEditor(true); }}>
            <Plus size={13}/> Add Field
          </Btn>
          <Btn variant="secondary" size="sm" onClick={saveAll}>
            <Save size={13}/>{saved ? '✓ Saved!' : 'Save Changes'}
          </Btn>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
        <AlertCircle size={14} className="text-blue-400 flex-shrink-0 mt-0.5"/>
        <div className="text-xs text-gray-400">
          Custom fields you add here will appear in the <strong className="text-white">{activeModuleInfo?.label}</strong> form immediately after saving.
          Fields marked "In Table" will appear as columns in the list view.
          Fields marked "In Print" will appear on printed invoices/documents.
        </div>
      </div>

      {/* Module selector */}
      <div className="flex flex-wrap gap-2">
        {MODULES.map(mod => (
          <button key={mod.key} onClick={() => setActiveModule(mod.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeModule === mod.key ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            <span>{mod.icon}</span>{mod.label}
            {getCustomFields(mod.key).length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeModule===mod.key?'bg-white/20 text-white':'bg-gray-700 text-gray-400'}`}>
                {getCustomFields(mod.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Fields list */}
      {fields.length === 0 ? (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-white font-semibold mb-1">No custom fields yet</p>
          <p className="text-gray-500 text-sm mb-4">Add fields to extend the {activeModuleInfo?.label} form with your own data.</p>
          <Btn variant="primary" onClick={() => { setEditingField(null); setShowEditor(true); }}>
            <Plus size={14}/> Add First Field
          </Btn>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <FieldRow key={field.id} field={field} index={idx} total={fields.length}
              onEdit={handleEdit} onDelete={handleDelete} onMove={handleMove}/>
          ))}

          {/* Save reminder */}
          <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-yellow-400 text-xs">Remember to click "Save Changes" after making edits to apply them to the forms.</p>
            <Btn variant="primary" size="sm" onClick={saveAll}>
              <Save size={12}/>{saved ? '✓ Saved!' : 'Save'}
            </Btn>
          </div>
        </div>
      )}

      {/* Quick examples */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wide">💡 Quick Add — Common Fields for {activeModuleInfo?.label}</p>
        <div className="flex flex-wrap gap-2">
          {(activeModule === 'inventory' ? [
            { label:'Batch Number',    type:'text',   placeholder:'BN-2024-001' },
            { label:'Expiry Date',     type:'date'   },
            { label:'Warranty Months', type:'number', placeholder:'12' },
            { label:'Weight (kg)',     type:'number', placeholder:'0.5' },
            { label:'Country of Origin', type:'select', options:'India,China,Japan,Germany,USA,Taiwan' },
            { label:'OEM Part Number', type:'text',   placeholder:'123456-ABC' },
            { label:'Min Order Qty',   type:'number', placeholder:'1' },
            { label:'Shelf Life',      type:'text',   placeholder:'2 years' },
            { label:'Quality Grade',   type:'select', options:'Grade A,Grade B,Grade C,Rejected' },
            { label:'Is Genuine',      type:'checkbox' },
          ] : activeModule === 'purchase' ? [
            { label:'Transport Charges', type:'number', placeholder:'0.00' },
            { label:'Loading Charges',   type:'number', placeholder:'0.00' },
            { label:'Expected Delivery', type:'date'   },
            { label:'Quality Checked',   type:'checkbox' },
            { label:'Inspection Notes',  type:'textarea', placeholder:'Quality inspection notes...' },
            { label:'Freight Mode',      type:'select', options:'Road,Rail,Air,Sea,Courier' },
            { label:'LR Number',         type:'text',   placeholder:'Lorry Receipt No' },
            { label:'Vehicle Number',    type:'text',   placeholder:'TN 37 AB 1234' },
          ] : activeModule === 'billing' ? [
            { label:'Vehicle Number',    type:'text',   placeholder:'TN 37 AB 1234' },
            { label:'Salesperson',       type:'text',   placeholder:'Staff name' },
            { label:'PO Number',         type:'text',   placeholder:'Customer PO ref' },
            { label:'Delivery Date',     type:'date'   },
            { label:'Terms & Conditions',type:'textarea',placeholder:'T&C...' },
            { label:'Warranty Covered',  type:'checkbox' },
          ] : activeModule === 'customer' ? [
            { label:'Birthday',          type:'date'   },
            { label:'Mechanic Name',     type:'text',   placeholder:'Associated mechanic' },
            { label:'Vehicles Owned',    type:'textarea',placeholder:'TN37AB1234, KA01BC5678...' },
            { label:'Preferred Brands',  type:'text',   placeholder:'Bosch, TVS...' },
            { label:'Source',            type:'select', options:'Walk-in,Referral,Social Media,Old Customer' },
          ] : [
            { label:'Lead Time (days)',  type:'number', placeholder:'3' },
            { label:'Min Order Value ₹', type:'number', placeholder:'1000' },
            { label:'Payment Terms',     type:'select', options:'Cash,7 days,15 days,30 days,45 days,60 days' },
            { label:'Rating',            type:'select', options:'5 Star,4 Star,3 Star,2 Star,1 Star' },
            { label:'Blacklisted',       type:'checkbox' },
          ]).map(suggestion => (
            <button key={suggestion.label}
              onClick={() => {
                const newField = {
                  id: `cf_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
                  label: suggestion.label,
                  name: suggestion.label.toLowerCase().replace(/[^a-z0-9]/g,'_'),
                  type: suggestion.type,
                  placeholder: suggestion.placeholder || '',
                  options: suggestion.options || '',
                  required: false,
                  show_in_list: false,
                  show_in_print: false,
                  width: 'half',
                };
                setFields(prev => [...prev, newField]);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/30 text-gray-400 rounded-lg text-xs border border-gray-700 transition-colors">
              <Plus size={10}/> {suggestion.label}
            </button>
          ))}
        </div>
      </div>

      {/* Field editor modal */}
      {showEditor && (
        <FieldEditor
          field={editingField}
          onSave={handleSaveField}
          onClose={() => { setShowEditor(false); setEditingField(null); }}
        />
      )}
    </div>
  );
}
