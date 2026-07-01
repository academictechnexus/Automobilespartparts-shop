import { useState } from 'react';
import { Plus, Edit2, Trash2, Download, History, TrendingUp, TrendingDown } from 'lucide-react';
import { getShopConfig } from '../../lib/shopConfig';
import { useApp } from '../../lib/AppContext';
import { Modal, Badge, Btn, SearchBar, PageHeader, Table, THead, TRow, TD, Field, Input, Select, Confirm } from '../shared/UI';
import { fmt, exportToExcel } from '../../utils/helpers';
import { CustomFieldsSection, CustomFieldsDisplay } from '../../hooks/useCustomFields';


// Get last stock adjustment for a part
const getLastAdjustment = (partId) => {
  try {
    const history = JSON.parse(localStorage.getItem('stock_adjustments') || '[]');
    return history.find(h => h.part_id === partId) || null;
  } catch { return null; }
};

// Dynamic based on shop type
const _cfg       = getShopConfig();
const CATEGORIES = _cfg.categories;
const GST_RATES  = _cfg.commonGST?.length ? _cfg.commonGST : [0, 5, 12, 18, 28];
const UNITS      = _cfg.units;
const PART_TYPES = ['OEM','Aftermarket','Genuine','Duplicate','Refurbished'];
const ITEM_LABEL = _cfg.itemLabel || 'Part';
const CODE_LABEL = _cfg.codeLabel || 'Part Code';
const SHOW_VEHICLE = _cfg.vehicleFields !== false;
const SHOW_MAKE_MODEL = _cfg.showFields?.includes('make') !== false;
const EXTRA_FIELDS = _cfg.extraInventoryFields || [];
const DEFAULT_GST  = _cfg.defaultGST || 18;
const DEFAULT_HSN  = _cfg.hsnSuggestion || '87083000';
const QUALITIES  = ['Grade A','Grade B','Grade C','Premium','Standard'];

const blank = {
  code:'', name:'', brand:'', make:'', model:'', year_range:'', category:'Brakes',
  hsn_code:DEFAULT_HSN, gst_rate:DEFAULT_GST, purchase_price:'', selling_price:'', mrp:'',
  stock:'', reorder_level:5, location:'', part_type:'Aftermarket', unit:'PCS',
  // Extra useful fields
  warranty_months:'', batch_no:'', expiry_date:'', weight:'',
  country_origin:'India', oem_part_no:'', quality_grade:'Grade A',
  min_order_qty:1, is_genuine: false, description:'',
  // Custom fields values
  custom_fields:{},
};

export default function Inventory() {
  const { t, parts, upsertPart, deletePart } = useApp();
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('all');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(blank);
  const [editId, setEditId]       = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [viewPart, setViewPart]   = useState(null);
  const [activeTab, setActiveTab] = useState('basic'); // basic / pricing / extra / custom

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setCustomField = (name, val) => setForm(p => ({ ...p, custom_fields: { ...p.custom_fields, [name]: val } }));

  const filtered = parts.filter(p => {
    const ms = !search || ['name','code','brand','make','model','oem_part_no','batch_no'].some(k => p[k]?.toLowerCase?.().includes(search.toLowerCase()));
    const mc = catFilter === 'All' || p.category === catFilter;
    const mst = stockFilter==='all' || (stockFilter==='low'&&p.stock<=p.reorder_level&&p.stock>0) || (stockFilter==='out'&&p.stock===0) || (stockFilter==='ok'&&p.stock>p.reorder_level);
    return ms && mc && mst;
  });

  const openNew = () => {
    setForm({ ...blank, code:`PRT-${Date.now().toString().slice(-5)}` });
    setEditId(null); setActiveTab('basic'); setShowForm(true);
  };
  const openEdit = (p) => {
    setForm({ ...blank, ...p, custom_fields: p.custom_fields || {} });
    setEditId(p.id); setActiveTab('basic'); setShowForm(true);
  };

  const save = () => {
    if (!form.name || !form.selling_price) return;
    upsertPart({
      ...form, id: editId,
      purchase_price: +form.purchase_price||0,
      selling_price:  +form.selling_price||0,
      mrp:            +form.mrp||0,
      stock:          +form.stock||0,
      reorder_level:  +form.reorder_level||5,
      gst_rate:       +form.gst_rate||18,
      warranty_months:+form.warranty_months||0,
      weight:         +form.weight||0,
      min_order_qty:  +form.min_order_qty||1,
    });
    setShowForm(false);
  };

  const handleExport = () => exportToExcel(parts.map(p => ({
    'Code':p.code,'Name':p.name,'Brand':p.brand,'Make':p.make,'Model':p.model,
    'Category':p.category,'HSN':p.hsn_code,'GST%':p.gst_rate,
    'Purchase Price':p.purchase_price,'Selling Price':p.selling_price,'MRP':p.mrp,
    'Stock':p.stock,'Reorder':p.reorder_level,'Location':p.location,
    'Type':p.part_type,'OEM Part No':p.oem_part_no||'','Warranty Months':p.warranty_months||0,
    'Batch No':p.batch_no||'','Country':p.country_origin||'',
  })), 'Inventory_Export');

  const FORM_TABS = [
    { key:'basic',   label:'Basic Info' },
    { key:'pricing', label:'Pricing & Stock' },
    { key:'extra',   label:'Extra Details' },
    { key:'custom',  label:'Custom Fields' },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t.inventory} subtitle={`${parts.length} ${ITEM_LABEL}s · ${parts.reduce((s,p)=>s+p.stock,0)} units`}>
        <Btn variant="secondary" onClick={handleExport}><Download size={14}/>Excel</Btn>
        <Btn variant="primary" onClick={openNew}><Plus size={15}/>Add {ITEM_LABEL}</Btn>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:'Total SKUs',    val:parts.length,                                                     c:'text-white'},
          {label:'Stock Value',   val:fmt(parts.reduce((s,p)=>s+p.purchase_price*p.stock,0)),           c:'text-blue-400'},
          {label:'Low Stock',     val:parts.filter(p=>p.stock<=p.reorder_level&&p.stock>0).length,     c:'text-yellow-400'},
          {label:'Out of Stock',  val:parts.filter(p=>p.stock===0).length,                              c:'text-red-400'},
        ].map(s=>(
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`font-bold text-xl ${s.c}`}>{s.val}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <SearchBar value={search} onChange={setSearch} placeholder="Search name, code, brand, OEM no..." className="flex-1 min-w-52"/>
        <div className="flex gap-1">
          {[['all','All'],['ok','In Stock'],['low','Low'],['out','Out']].map(([v,l])=>(
            <button key={v} onClick={()=>setStockFilter(v)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${stockFilter===v?'bg-orange-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {['All',...CATEGORIES].map(c=>(
          <button key={c} onClick={()=>setCatFilter(c)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${catFilter===c?'bg-orange-500/20 text-orange-400 border border-orange-500/30':'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Table */}
      <Table>
        <THead cols={[
          {label:'PART / CODE'},{label:'VEHICLE',hidden:'hidden lg:table-cell'},
          {label:'CATEGORY',hidden:'hidden md:table-cell'},{label:'MRP',align:'right',hidden:'hidden md:table-cell'},
          {label:'SALE PRICE',align:'right'},{label:'STOCK',align:'center'},
          {label:'STATUS',align:'center'},{label:'LAST ADJ',hidden:'hidden xl:table-cell'},{label:'ACTIONS',align:'center'},
        ]}/>
        <tbody>
          {filtered.length===0&&<tr><td colSpan={8} className="text-center py-12 text-gray-600 text-sm">No parts found</td></tr>}
          {filtered.map(p=>(
            <TRow key={p.id} onClick={()=>setViewPart(p)}>
              <TD>
                <div className="text-white text-sm font-medium">{p.name}</div>
                <div className="text-gray-500 text-xs">{p.code} · {p.brand}</div>
                {p.oem_part_no&&<div className="text-gray-600 text-xs">OEM: {p.oem_part_no}</div>}
                <div className="text-gray-600 text-xs">HSN:{p.hsn_code} · GST:{p.gst_rate}%</div>
              </TD>
              <TD className="hidden lg:table-cell">
                <div className="text-gray-300 text-xs">{p.make} {p.model}</div>
                <div className="text-gray-500 text-xs">{p.year_range}</div>
              </TD>
              <TD className="hidden md:table-cell">
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{p.category}</span>
                <div className="mt-1"><Badge status={p.part_type}/></div>
                {p.warranty_months>0&&<div className="text-gray-600 text-xs mt-0.5">{p.warranty_months}m warranty</div>}
              </TD>
              <TD align="right" className="hidden md:table-cell"><span className="text-gray-400 text-sm">{fmt(p.mrp)}</span></TD>
              <TD align="right">
                <span className="text-white font-semibold">{fmt(p.selling_price)}</span>
                <div className="text-gray-600 text-xs">Cost:{fmt(p.purchase_price)}</div>
              </TD>
              <TD align="center">
                <div className={`font-bold text-sm ${p.stock===0?'text-red-400':p.stock<=p.reorder_level?'text-yellow-400':'text-green-400'}`}>{p.stock} {p.unit}</div>
                <div className="text-gray-600 text-xs">Min:{p.reorder_level}</div>
              </TD>
              <TD align="center">
                <Badge status={p.stock===0?'out':p.stock<=p.reorder_level?'low':'ok'}/>
              </TD>
              <TD className="hidden xl:table-cell">
                {(() => {
                  const adj = getLastAdjustment(p.id);
                  if (!adj) return <span className="text-gray-700 text-xs">—</span>;
                  const isPos = adj.qty_change > 0;
                  return (
                    <div className="text-xs">
                      <div className={`flex items-center gap-1 font-semibold ${isPos?'text-green-400':'text-red-400'}`}>
                        {isPos?<TrendingUp size={10}/>:<TrendingDown size={10}/>}
                        {isPos?'+':''}{adj.qty_change}
                      </div>
                      <div className="text-gray-600">{adj.adj_type}</div>
                      <div className="text-gray-700">{adj.date}</div>
                    </div>
                  );
                })()}
              </TD>
              <TD align="center">
                <div className="flex items-center justify-center gap-1" onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-orange-400 transition-colors"><Edit2 size={13}/></button>
                  <button onClick={()=>setConfirmId(p.id)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                </div>
              </TD>
            </TRow>
          ))}
        </tbody>
      </Table>

      {/* ── PART FORM MODAL ── */}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editId?`Edit ${ITEM_LABEL}`:`Add New ${ITEM_LABEL}`} size="xl">

        {/* Tab Nav inside modal */}
        <div className="flex border-b border-gray-800 px-5">
          {FORM_TABS.map(tab=>(
            <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab===tab.key?'border-orange-500 text-orange-400':'border-transparent text-gray-500 hover:text-gray-300'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* BASIC INFO TAB */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label={CODE_LABEL} required><Input value={form.code} onChange={e=>f('code',e.target.value)} placeholder="BRK-001"/></Field>
              <Field label="Part Name" required className="col-span-2"><Input value={form.name} onChange={e=>f('name',e.target.value)} placeholder="Brake Pad Set Front"/></Field>
              <Field label="Brand"><Input value={form.brand} onChange={e=>f('brand',e.target.value)} placeholder="TVS, Bosch, NGK..."/></Field>
              <Field label="Category"><Select value={form.category} onChange={e=>f('category',e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</Select></Field>
              <Field label="Part Type"><Select value={form.part_type} onChange={e=>f('part_type',e.target.value)}>{PART_TYPES.map(t=><option key={t}>{t}</option>)}</Select></Field>
              {SHOW_VEHICLE && <>
                <Field label="Vehicle Make"><Input value={form.make} onChange={e=>f('make',e.target.value)} placeholder="Maruti, Hyundai, TVS..."/></Field>
                <Field label="Vehicle Model"><Input value={form.model} onChange={e=>f('model',e.target.value)} placeholder="Swift, i20, Apache..."/></Field>
                <Field label="Year Range"><Input value={form.year_range} onChange={e=>f('year_range',e.target.value)} placeholder="2018-2023 or All"/></Field>
              </>}
              {_cfg.showFields?.includes('oem_part_no') !== false && (
                <Field label="OEM Part Number"><Input value={form.oem_part_no||''} onChange={e=>f('oem_part_no',e.target.value)} placeholder="Manufacturer part no"/></Field>
              )}
              <Field label="HSN Code"><Input value={form.hsn_code} onChange={e=>f('hsn_code',e.target.value)} placeholder="87083000"/></Field>
              <Field label="GST Rate %"><Select value={form.gst_rate} onChange={e=>f('gst_rate',e.target.value)}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</Select></Field>
              <Field label="Unit"><Select value={form.unit} onChange={e=>f('unit',e.target.value)}>{UNITS.map(u=><option key={u}>{u}</option>)}</Select></Field>
              <Field label="Rack / Location"><Input value={form.location} onChange={e=>f('location',e.target.value)} placeholder="A1, B2, Shelf 3..."/></Field>
              <Field label="Description" className="col-span-2 md:col-span-3">
                <textarea value={form.description} onChange={e=>f('description',e.target.value)} rows={2}
                  placeholder="Additional description..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-none"/>
              </Field>
              {EXTRA_FIELDS.map(ef => (
                <Field key={ef.name} label={ef.label} className={ef.type==='textarea'?'col-span-2 md:col-span-3':''}>
                  {ef.type==='select'
                    ? <Select value={form[ef.name]||''} onChange={e=>f(ef.name,e.target.value)}>
                        <option value="">— Select —</option>
                        {(ef.options||'').split(',').map(o=><option key={o.trim()} value={o.trim()}>{o.trim()}</option>)}
                      </Select>
                    : ef.type==='checkbox'
                    ? <div className="flex items-center gap-2 mt-1">
                        <button type="button" onClick={()=>f(ef.name,!form[ef.name])}
                          className={`w-10 h-5 rounded-full transition-colors relative ${form[ef.name]?'bg-orange-500':'bg-gray-700'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form[ef.name]?'left-5':'left-0.5'}`}/>
                        </button>
                        <span className="text-gray-400 text-xs">Yes</span>
                      </div>
                    : ef.type==='textarea'
                    ? <textarea value={form[ef.name]||''} onChange={e=>f(ef.name,e.target.value)} rows={2} placeholder={ef.placeholder||''}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-none"/>
                    : <Input type={ef.type==='number'?'number':'text'} value={form[ef.name]||''} onChange={e=>f(ef.name,e.target.value)} placeholder={ef.placeholder||''}/>
                  }
                </Field>
              ))}
            </div>
          )}

          {/* PRICING & STOCK TAB */}
          {activeTab === 'pricing' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Purchase Price ₹" required><Input type="number" value={form.purchase_price} onChange={e=>f('purchase_price',e.target.value)} placeholder="0.00"/></Field>
              <Field label="Selling Price ₹" required><Input type="number" value={form.selling_price} onChange={e=>f('selling_price',e.target.value)} placeholder="0.00"/></Field>
              <Field label="MRP ₹"><Input type="number" value={form.mrp} onChange={e=>f('mrp',e.target.value)} placeholder="0.00"/></Field>
              <Field label="Opening Stock"><Input type="number" value={form.stock} onChange={e=>f('stock',e.target.value)} placeholder="0"/></Field>
              <Field label="Reorder Level"><Input type="number" value={form.reorder_level} onChange={e=>f('reorder_level',e.target.value)} placeholder="5"/></Field>
              <Field label="Min Order Qty"><Input type="number" value={form.min_order_qty||1} onChange={e=>f('min_order_qty',e.target.value)} placeholder="1"/></Field>

              {/* Profit preview */}
              {form.purchase_price && form.selling_price && (
                <div className="col-span-2 md:col-span-3 bg-gray-800 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Gross Profit</p>
                    <p className={`font-bold text-lg ${(form.selling_price-form.purchase_price)>=0?'text-green-400':'text-red-400'}`}>
                      {fmt(form.selling_price-form.purchase_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Margin %</p>
                    <p className="text-orange-400 font-bold text-lg">
                      {form.selling_price>0?((form.selling_price-form.purchase_price)/form.selling_price*100).toFixed(1):0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Stock Value</p>
                    <p className="text-blue-400 font-bold text-lg">{fmt(form.purchase_price*(form.stock||0))}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EXTRA DETAILS TAB */}
          {activeTab === 'extra' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Batch / Lot Number"><Input value={form.batch_no||''} onChange={e=>f('batch_no',e.target.value)} placeholder="BN-2024-001"/></Field>
              <Field label="Expiry Date"><Input type="date" value={form.expiry_date||''} onChange={e=>f('expiry_date',e.target.value)}/></Field>
              <Field label="Warranty (months)"><Input type="number" value={form.warranty_months||''} onChange={e=>f('warranty_months',e.target.value)} placeholder="12"/></Field>
              <Field label="Weight (kg)"><Input type="number" step="0.01" value={form.weight||''} onChange={e=>f('weight',e.target.value)} placeholder="0.5"/></Field>
              <Field label="Country of Origin">
                <Select value={form.country_origin||'India'} onChange={e=>f('country_origin',e.target.value)}>
                  {['India','China','Japan','Germany','USA','Taiwan','South Korea','Italy','UK','Thailand'].map(c=><option key={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Quality Grade">
                <Select value={form.quality_grade||'Grade A'} onChange={e=>f('quality_grade',e.target.value)}>
                  {QUALITIES.map(q=><option key={q}>{q}</option>)}
                </Select>
              </Field>
              <div className="col-span-2 md:col-span-3 flex items-center gap-3 bg-gray-800 rounded-xl p-3">
                <button type="button" onClick={()=>f('is_genuine',!form.is_genuine)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.is_genuine?'bg-orange-500':'bg-gray-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.is_genuine?'left-6':'left-1'}`}/>
                </button>
                <div>
                  <p className="text-white text-sm font-medium">Genuine / Certified Part</p>
                  <p className="text-gray-500 text-xs">Mark as genuine OEM certified part</p>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOM FIELDS TAB */}
          {activeTab === 'custom' && (
            <CustomFieldsSection
              module="inventory"
              values={form.custom_fields||{}}
              onChange={setCustomField}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5">
          <Btn variant="secondary" className="flex-1" onClick={()=>setShowForm(false)}>Cancel</Btn>
          <Btn variant="primary"   className="flex-1" onClick={save}>
            {editId ? 'Update Part' : 'Add Part'}
          </Btn>
        </div>
      </Modal>

      {/* Part View Modal */}
      {viewPart && (
        <Modal open={!!viewPart} onClose={()=>setViewPart(null)} title="Part Details" size="md">
          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">{viewPart.name}</h3>
                <p className="text-gray-400 text-sm">{viewPart.code} · {viewPart.brand}</p>
              </div>
              <Badge status={viewPart.part_type}/>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ['Category',    viewPart.category],
                ['Vehicle',     `${viewPart.make||''} ${viewPart.model||''} ${viewPart.year_range||''}`.trim()||'—'],
                ['HSN Code',    viewPart.hsn_code],
                ['GST Rate',    `${viewPart.gst_rate}%`],
                ['Purchase Price', fmt(viewPart.purchase_price)],
                ['Selling Price',  fmt(viewPart.selling_price)],
                ['MRP',         fmt(viewPart.mrp)],
                ['Stock',       `${viewPart.stock} ${viewPart.unit}`],
                ['Reorder Level', viewPart.reorder_level],
                ['Location',    viewPart.location||'—'],
                ['OEM Part No', viewPart.oem_part_no||'—'],
                ['Warranty',    viewPart.warranty_months?`${viewPart.warranty_months} months`:'—'],
                ['Batch No',    viewPart.batch_no||'—'],
                ['Country',     viewPart.country_origin||'—'],
                ['Quality',     viewPart.quality_grade||'—'],
                ['Genuine',     viewPart.is_genuine?'✓ Yes':'—'],
              ].filter(([,v])=>v&&v!=='—'&&v!=='₹0.00').map(([l,v])=>(
                <div key={l} className="flex justify-between">
                  <span className="text-gray-500 text-xs">{l}</span>
                  <span className="text-white text-xs font-medium">{v}</span>
                </div>
              ))}
            </div>
            {viewPart.description && <p className="text-gray-400 text-xs border-t border-gray-800 pt-2">{viewPart.description}</p>}
            <CustomFieldsDisplay module="inventory" record={viewPart}/>
            <div className="flex gap-2 pt-2">
              <Btn variant="secondary" className="flex-1" onClick={()=>setViewPart(null)}>Close</Btn>
              <Btn variant="primary" className="flex-1" onClick={()=>{openEdit(viewPart);setViewPart(null);}}>Edit Part</Btn>
            </div>
          </div>
        </Modal>
      )}

      <Confirm open={!!confirmId} onCancel={()=>setConfirmId(null)}
        onConfirm={()=>{deletePart(confirmId);setConfirmId(null);}}
        message="Delete this part permanently? Stock history will be lost."/>
    </div>
  );
}
