import { useState } from 'react';
import { Plus, Edit2, Trash2, Download } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { Modal, Badge, Btn, SearchBar, PageHeader, Table, THead, TRow, TD, Field, Input, Select, Textarea, Confirm } from '../shared/UI';
import { fmt, exportToExcel } from '../../utils/helpers';

const CATEGORIES = ['Brakes','Filters','Electrical','Engine','Cooling','Transmission','Suspension','Body','Tyres','Steering','Fuel System','Exhaust','Others'];
const GST_RATES = [5, 12, 18, 28];
const UNITS = ['PCS','SET','KIT','LTR','MTR','KG','PAIR','BOX'];
const blank = { code:'', name:'', brand:'', make:'', model:'', year_range:'', category:'Brakes', hsn_code:'87083000', gst_rate:18, purchase_price:'', selling_price:'', mrp:'', stock:'', reorder_level:5, location:'', part_type:'Aftermarket', unit:'PCS', description:'' };

export default function Inventory() {
  const { t, parts, upsertPart, deletePart } = useApp();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const f = (k, v) => setForm(p => ({...p, [k]: v}));

  const filtered = parts.filter(p => {
    const ms = !search || ['name','code','brand','make','model'].some(k => p[k]?.toLowerCase().includes(search.toLowerCase()));
    const mc = catFilter === 'All' || p.category === catFilter;
    const mst = stockFilter === 'all' || (stockFilter === 'low' && p.stock <= p.reorder_level && p.stock > 0) || (stockFilter === 'out' && p.stock === 0) || (stockFilter === 'ok' && p.stock > p.reorder_level);
    return ms && mc && mst;
  });

  const openNew = () => { setForm({...blank, code:`PRT-${Date.now().toString().slice(-5)}`}); setEditId(null); setShowForm(true); };
  const openEdit = (p) => { setForm({...p}); setEditId(p.id); setShowForm(true); };
  const save = () => {
    if (!form.name || !form.selling_price) return;
    upsertPart({ ...form, id: editId, purchase_price: +form.purchase_price||0, selling_price: +form.selling_price||0, mrp: +form.mrp||0, stock: +form.stock||0, reorder_level: +form.reorder_level||5, gst_rate: +form.gst_rate||18 });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t.inventory} subtitle={`${parts.length} SKUs`}>
        <Btn variant="secondary" onClick={() => exportToExcel(parts, 'Inventory')}><Download size={14}/>Export</Btn>
        <Btn variant="primary" onClick={openNew}><Plus size={15}/>Add Part</Btn>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:'Total SKUs', val:parts.length, c:'text-white'},
          {label:'Stock Value', val:fmt(parts.reduce((s,p)=>s+p.purchase_price*p.stock,0)), c:'text-blue-400'},
          {label:'Low Stock', val:parts.filter(p=>p.stock<=p.reorder_level&&p.stock>0).length, c:'text-yellow-400'},
          {label:'Out of Stock', val:parts.filter(p=>p.stock===0).length, c:'text-red-400'},
        ].map(s=>(
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`font-bold text-xl ${s.c}`}>{s.val}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <SearchBar value={search} onChange={setSearch} placeholder="Search name, code, brand, vehicle..." className="flex-1 min-w-52"/>
        <div className="flex gap-1">
          {[['all','All'],['ok','In Stock'],['low','Low'],['out','Out']].map(([v,l])=>(
            <button key={v} onClick={()=>setStockFilter(v)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${stockFilter===v?'bg-orange-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {['All',...CATEGORIES].map(c=>(
          <button key={c} onClick={()=>setCatFilter(c)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${catFilter===c?'bg-orange-500/20 text-orange-400 border border-orange-500/30':'bg-gray-800 text-gray-400 hover:text-white'}`}>{c}</button>
        ))}
      </div>

      <Table>
        <THead cols={[
          {label:'PART / CODE'},{label:'VEHICLE',hidden:'hidden lg:table-cell'},
          {label:'CATEGORY',hidden:'hidden md:table-cell'},{label:'MRP',align:'right'},
          {label:'SALE PRICE',align:'right'},{label:'STOCK',align:'center'},
          {label:'STATUS',align:'center'},{label:'ACTIONS',align:'center'},
        ]}/>
        <tbody>
          {filtered.length===0&&<tr><td colSpan={8} className="text-center py-12 text-gray-600 text-sm">{t.noData}</td></tr>}
          {filtered.map(p=>(
            <TRow key={p.id}>
              <TD><div className="text-white text-sm font-medium">{p.name}</div><div className="text-gray-500 text-xs">{p.code} · {p.brand}</div><div className="text-gray-600 text-xs">HSN:{p.hsn_code} · GST:{p.gst_rate}%</div></TD>
              <TD className="hidden lg:table-cell"><div className="text-gray-300 text-xs">{p.make} {p.model}</div><div className="text-gray-500 text-xs">{p.year_range}</div></TD>
              <TD className="hidden md:table-cell"><span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{p.category}</span><div className="mt-1"><Badge status={p.part_type}/></div></TD>
              <TD align="right"><span className="text-gray-400 text-sm">{fmt(p.mrp)}</span></TD>
              <TD align="right"><span className="text-white font-semibold">{fmt(p.selling_price)}</span><div className="text-gray-600 text-xs">Cost:{fmt(p.purchase_price)}</div></TD>
              <TD align="center"><div className={`font-bold text-sm ${p.stock===0?'text-red-400':p.stock<=p.reorder_level?'text-yellow-400':'text-green-400'}`}>{p.stock} {p.unit}</div><div className="text-gray-600 text-xs">Min:{p.reorder_level}</div></TD>
              <TD align="center"><Badge status={p.stock===0?'out':p.stock<=p.reorder_level?'low':'ok'}/></TD>
              <TD align="center"><div className="flex items-center justify-center gap-1">
                <button onClick={()=>openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-orange-400 transition-colors"><Edit2 size={13}/></button>
                <button onClick={()=>setConfirmId(p.id)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
              </div></TD>
            </TRow>
          ))}
        </tbody>
      </Table>

      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editId?'Edit Part':'Add New Part'} size="xl">
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Part Code" required><Input value={form.code} onChange={e=>f('code',e.target.value)} placeholder="BRK-001"/></Field>
          <Field label="Part Name" required className="col-span-2 md:col-span-2"><Input value={form.name} onChange={e=>f('name',e.target.value)} placeholder="Brake Pad Set"/></Field>
          <Field label="Brand"><Input value={form.brand} onChange={e=>f('brand',e.target.value)} placeholder="TVS, Bosch..."/></Field>
          <Field label="Category"><Select value={form.category} onChange={e=>f('category',e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</Select></Field>
          <Field label="Part Type"><Select value={form.part_type} onChange={e=>f('part_type',e.target.value)}><option>OEM</option><option>Aftermarket</option></Select></Field>
          <Field label="Vehicle Make"><Input value={form.make} onChange={e=>f('make',e.target.value)} placeholder="Maruti, Hyundai..."/></Field>
          <Field label="Vehicle Model"><Input value={form.model} onChange={e=>f('model',e.target.value)} placeholder="Swift, i20..."/></Field>
          <Field label="Year Range"><Input value={form.year_range} onChange={e=>f('year_range',e.target.value)} placeholder="2018-2023"/></Field>
          <Field label="HSN Code"><Input value={form.hsn_code} onChange={e=>f('hsn_code',e.target.value)}/></Field>
          <Field label="GST Rate %"><Select value={form.gst_rate} onChange={e=>f('gst_rate',e.target.value)}>{GST_RATES.map(r=><option key={r} value={r}>{r}%</option>)}</Select></Field>
          <Field label="Unit"><Select value={form.unit} onChange={e=>f('unit',e.target.value)}>{UNITS.map(u=><option key={u}>{u}</option>)}</Select></Field>
          <Field label="Purchase Price ₹" required><Input type="number" value={form.purchase_price} onChange={e=>f('purchase_price',e.target.value)} placeholder="0.00"/></Field>
          <Field label="Selling Price ₹" required><Input type="number" value={form.selling_price} onChange={e=>f('selling_price',e.target.value)} placeholder="0.00"/></Field>
          <Field label="MRP ₹"><Input type="number" value={form.mrp} onChange={e=>f('mrp',e.target.value)} placeholder="0.00"/></Field>
          <Field label="Opening Stock"><Input type="number" value={form.stock} onChange={e=>f('stock',e.target.value)} placeholder="0"/></Field>
          <Field label="Reorder Level"><Input type="number" value={form.reorder_level} onChange={e=>f('reorder_level',e.target.value)}/></Field>
          <Field label="Rack/Location"><Input value={form.location} onChange={e=>f('location',e.target.value)} placeholder="A1, B2..."/></Field>
          <Field label="Description" className="col-span-2 md:col-span-3"><Input value={form.description} onChange={e=>f('description',e.target.value)} placeholder="Notes..."/></Field>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Btn variant="secondary" className="flex-1" onClick={()=>setShowForm(false)}>{t.cancel}</Btn>
          <Btn variant="primary" className="flex-1" onClick={save}>{t.save}</Btn>
        </div>
      </Modal>
      <Confirm open={!!confirmId} onCancel={()=>setConfirmId(null)} onConfirm={()=>{deletePart(confirmId);setConfirmId(null);}} message="Delete this part permanently?"/>
    </div>
  );
}
