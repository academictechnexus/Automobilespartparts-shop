import { useState } from 'react';
import { Plus, Edit2, Trash2, Phone, Eye } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { Modal, Badge, Btn, SearchBar, PageHeader, Table, THead, TRow, TD, Field, Input, Select, Confirm } from '../shared/UI';
import { fmt } from '../../utils/helpers';

const blank = { name:'', phone:'', alt_phone:'', email:'', address:'', city:'', gst_no:'', customer_type:'Retail', credit_limit:0, discount_pct:0 };

export default function Customers() {
  const { t, customers, upsertCustomer, deleteCustomer } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [viewC, setViewC] = useState(null);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  const filtered = customers.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search) || c.city?.toLowerCase().includes(search.toLowerCase()));
  const openNew = () => { setForm(blank); setEditId(null); setShowForm(true); };
  const openEdit = (c) => { setForm({...c}); setEditId(c.id); setShowForm(true); };
  const save = () => { if (!form.name) return; upsertCustomer({...form, id:editId, credit_limit:+form.credit_limit||0, discount_pct:+form.discount_pct||0}); setShowForm(false); };

  return (
    <div className="space-y-4">
      <PageHeader title={t.customers} subtitle={`${customers.length} customers`}>
        <Btn variant="primary" onClick={openNew}><Plus size={15}/>{t.add} Customer</Btn>
      </PageHeader>
      <div className="grid grid-cols-3 gap-3">
        {[{label:'Total',val:customers.length,c:'text-white'},{label:'Wholesale',val:customers.filter(c=>c.customer_type==='Wholesale').length,c:'text-blue-400'},{label:'Outstanding',val:fmt(customers.reduce((s,c)=>s+c.balance,0)),c:'text-red-400'}].map(s=>(
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`font-bold text-xl ${s.c}`}>{s.val}</div>
            <div className="text-gray-500 text-xs">{s.label}</div>
          </div>
        ))}
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, phone, city..."/>
      <Table>
        <THead cols={[{label:'CUSTOMER'},{label:'CONTACT',hidden:'hidden md:table-cell'},{label:'GST NO',hidden:'hidden lg:table-cell'},{label:'TYPE',align:'center'},{label:'BALANCE',align:'right'},{label:'ACTIONS',align:'center'}]}/>
        <tbody>
          {filtered.length===0&&<tr><td colSpan={6} className="text-center py-12 text-gray-600 text-sm">{t.noData}</td></tr>}
          {filtered.map(c=>(
            <TRow key={c.id}>
              <TD><div className="text-white font-medium">{c.name}</div><div className="text-gray-500 text-xs md:hidden">{c.phone}</div>{c.city&&<div className="text-gray-600 text-xs">{c.city}</div>}</TD>
              <TD className="hidden md:table-cell"><div className="text-gray-300 text-sm">{c.phone}</div><div className="text-gray-500 text-xs">{c.email}</div></TD>
              <TD className="hidden lg:table-cell"><span className="text-gray-400 font-mono text-xs">{c.gst_no||'—'}</span></TD>
              <TD align="center"><Badge status={c.customer_type}/></TD>
              <TD align="right"><span className={`font-semibold ${c.balance>0?'text-red-400':'text-green-400'}`}>{c.balance>0?fmt(c.balance):'Nil'}</span></TD>
              <TD align="center"><div className="flex items-center justify-center gap-1">
                <button onClick={()=>setViewC(c)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-blue-400 transition-colors"><Eye size={13}/></button>
                <button onClick={()=>openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-orange-400 transition-colors"><Edit2 size={13}/></button>
                <button onClick={()=>setConfirmId(c.id)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
              </div></TD>
            </TRow>
          ))}
        </tbody>
      </Table>

      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editId?'Edit Customer':'Add Customer'} size="md">
        <div className="p-5 grid grid-cols-2 gap-3">
          <Field label="Name" required className="col-span-2"><Input value={form.name} onChange={e=>f('name',e.target.value)} placeholder="Customer / Shop name"/></Field>
          <Field label="Phone" required><Input value={form.phone} onChange={e=>f('phone',e.target.value)} placeholder="9876543210"/></Field>
          <Field label="Alt Phone"><Input value={form.alt_phone} onChange={e=>f('alt_phone',e.target.value)}/></Field>
          <Field label="Email" className="col-span-2"><Input type="email" value={form.email} onChange={e=>f('email',e.target.value)}/></Field>
          <Field label="Address" className="col-span-2"><Input value={form.address} onChange={e=>f('address',e.target.value)}/></Field>
          <Field label="City"><Input value={form.city} onChange={e=>f('city',e.target.value)}/></Field>
          <Field label="Type"><Select value={form.customer_type} onChange={e=>f('customer_type',e.target.value)}><option>Retail</option><option>Wholesale</option></Select></Field>
          <Field label="GST Number"><Input value={form.gst_no} onChange={e=>f('gst_no',e.target.value)} placeholder="33AABCR1234F1Z5"/></Field>
          <Field label="Credit Limit ₹"><Input type="number" value={form.credit_limit} onChange={e=>f('credit_limit',e.target.value)}/></Field>
          <Field label="Default Discount %"><Input type="number" value={form.discount_pct} onChange={e=>f('discount_pct',e.target.value)}/></Field>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Btn variant="secondary" className="flex-1" onClick={()=>setShowForm(false)}>{t.cancel}</Btn>
          <Btn variant="primary" className="flex-1" onClick={save}>{t.save}</Btn>
        </div>
      </Modal>

      <Modal open={!!viewC} onClose={()=>setViewC(null)} title="Customer Details" size="sm">
        {viewC&&<div className="p-5 space-y-2">
          {[['Name',viewC.name],['Phone',viewC.phone],['Alt Phone',viewC.alt_phone],['Email',viewC.email],['Address',viewC.address],['City',viewC.city],['GST No',viewC.gst_no],['Type',viewC.customer_type],['Credit Limit',fmt(viewC.credit_limit)],['Balance Due',fmt(viewC.balance)]].map(([l,v])=>v?(<div key={l} className="flex justify-between"><span className="text-gray-500 text-sm">{l}</span><span className="text-white text-sm font-medium">{v}</span></div>):null)}
        </div>}
      </Modal>
      <Confirm open={!!confirmId} onCancel={()=>setConfirmId(null)} onConfirm={()=>{deleteCustomer(confirmId);setConfirmId(null);}} message="Delete this customer?"/>
    </div>
  );
}
