import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { Modal, Badge, Btn, SearchBar, PageHeader, Table, THead, TRow, TD, Field, Input, Confirm } from '../shared/UI';
import { fmt } from '../../utils/helpers';

const blank = { name:'', contact_person:'', phone:'', alt_phone:'', email:'', address:'', city:'', gst_no:'', pan_no:'', bank_name:'', bank_account:'', ifsc_code:'' };

export default function Suppliers() {
  const { t, suppliers, upsertSupplier, deleteSupplier } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [viewS, setViewS] = useState(null);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const filtered = suppliers.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.phone?.includes(search));
  const openNew = () => { setForm(blank); setEditId(null); setShowForm(true); };
  const openEdit = (s) => { setForm({...s}); setEditId(s.id); setShowForm(true); };
  const save = () => { if (!form.name) return; upsertSupplier({...form, id:editId}); setShowForm(false); };

  return (
    <div className="space-y-4">
      <PageHeader title={t.suppliers} subtitle={`${suppliers.length} suppliers`}>
        <Btn variant="primary" onClick={openNew}><Plus size={15}/>{t.add} Supplier</Btn>
      </PageHeader>
      <div className="grid grid-cols-3 gap-3">
        {[{label:'Total Suppliers',val:suppliers.length,c:'text-white'},{label:'Total Payable',val:fmt(suppliers.reduce((s,x)=>s+x.balance,0)),c:'text-red-400'},{label:'Active',val:suppliers.length,c:'text-green-400'}].map(s=>(
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`font-bold text-xl ${s.c}`}>{s.val}</div>
            <div className="text-gray-500 text-xs">{s.label}</div>
          </div>
        ))}
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search supplier name, phone..."/>
      <Table>
        <THead cols={[{label:'SUPPLIER'},{label:'CONTACT',hidden:'hidden md:table-cell'},{label:'GST NO',hidden:'hidden lg:table-cell'},{label:'PAYABLE',align:'right'},{label:'ACTIONS',align:'center'}]}/>
        <tbody>
          {filtered.length===0&&<tr><td colSpan={5} className="text-center py-12 text-gray-600 text-sm">{t.noData}</td></tr>}
          {filtered.map(s=>(
            <TRow key={s.id}>
              <TD><div className="text-white font-medium">{s.name}</div>{s.contact_person&&<div className="text-gray-500 text-xs">{s.contact_person}</div>}{s.city&&<div className="text-gray-600 text-xs">{s.city}</div>}</TD>
              <TD className="hidden md:table-cell"><div className="text-gray-300 text-sm">{s.phone}</div><div className="text-gray-500 text-xs">{s.email}</div></TD>
              <TD className="hidden lg:table-cell"><span className="text-gray-400 font-mono text-xs">{s.gst_no||'—'}</span></TD>
              <TD align="right"><span className={`font-semibold ${s.balance>0?'text-red-400':'text-green-400'}`}>{s.balance>0?fmt(s.balance):'Nil'}</span></TD>
              <TD align="center"><div className="flex items-center justify-center gap-1">
                <button onClick={()=>setViewS(s)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-blue-400 transition-colors"><Eye size={13}/></button>
                <button onClick={()=>openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-orange-400 transition-colors"><Edit2 size={13}/></button>
                <button onClick={()=>setConfirmId(s.id)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
              </div></TD>
            </TRow>
          ))}
        </tbody>
      </Table>

      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editId?'Edit Supplier':'Add Supplier'} size="md">
        <div className="p-5 grid grid-cols-2 gap-3">
          <Field label="Supplier Name" required className="col-span-2"><Input value={form.name} onChange={e=>f('name',e.target.value)}/></Field>
          <Field label="Contact Person"><Input value={form.contact_person} onChange={e=>f('contact_person',e.target.value)}/></Field>
          <Field label="Phone"><Input value={form.phone} onChange={e=>f('phone',e.target.value)}/></Field>
          <Field label="Email" className="col-span-2"><Input type="email" value={form.email} onChange={e=>f('email',e.target.value)}/></Field>
          <Field label="Address" className="col-span-2"><Input value={form.address} onChange={e=>f('address',e.target.value)}/></Field>
          <Field label="City"><Input value={form.city} onChange={e=>f('city',e.target.value)}/></Field>
          <Field label="GST Number"><Input value={form.gst_no} onChange={e=>f('gst_no',e.target.value)}/></Field>
          <Field label="PAN Number"><Input value={form.pan_no} onChange={e=>f('pan_no',e.target.value)}/></Field>
          <Field label="Bank Name"><Input value={form.bank_name} onChange={e=>f('bank_name',e.target.value)}/></Field>
          <Field label="Account Number"><Input value={form.bank_account} onChange={e=>f('bank_account',e.target.value)}/></Field>
          <Field label="IFSC Code"><Input value={form.ifsc_code} onChange={e=>f('ifsc_code',e.target.value)}/></Field>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Btn variant="secondary" className="flex-1" onClick={()=>setShowForm(false)}>{t.cancel}</Btn>
          <Btn variant="primary" className="flex-1" onClick={save}>{t.save}</Btn>
        </div>
      </Modal>
      <Confirm open={!!confirmId} onCancel={()=>setConfirmId(null)} onConfirm={()=>{deleteSupplier(confirmId);setConfirmId(null);}} message="Delete this supplier?"/>
    </div>
  );
}
