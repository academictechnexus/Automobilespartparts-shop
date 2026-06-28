import { useState } from 'react';
import { Plus, Download, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { Btn, SearchBar, PageHeader, Table, THead, TRow, TD, Field, Input, Select, Textarea, Modal, Confirm } from '../shared/UI';
import { fmt, fmtDate, today, exportToExcel } from '../../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CATEGORIES = ['Rent','Salary','Electricity','Water','Transport','Maintenance','Packaging','Stationery','Internet','Telephone','Advertisement','Miscellaneous'];
const PAY_MODES  = ['Cash','UPI','Cheque','NEFT'];

const blank = { date:today(), category:'Rent', description:'', amount:'', payment_mode:'Cash', receipt_no:'', notes:'' };

export default function Expenses() {
  const { t, expenses, addExpense, updateExpense, deleteExpense } = useApp();
  const [search, setSearch]     = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(blank);
  const [editId, setEditId]     = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  const filtered = expenses.filter(e => {
    const ms = !search || e.description?.toLowerCase().includes(search.toLowerCase()) || e.category?.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'all' || e.category === catFilter;
    return ms && mc;
  });

  const openNew = () => { setForm(blank); setEditId(null); setShowForm(true); };
  const openEdit = (e) => { setForm({...e, amount: String(e.amount)}); setEditId(e.id); setShowForm(true); };

  const save = () => {
    if (!form.description || !form.amount) return;
    const data = { ...form, amount: parseFloat(form.amount)||0 };
    if (editId) {
      updateExpense(editId, data);
    } else {
      addExpense(data);
    }
    setShowForm(false);
    setEditId(null);
    setForm(blank);
  };

  // Category summary for chart
  const catSummary = CATEGORIES.map(c => ({
    name: c.slice(0,8),
    amount: expenses.filter(e=>e.category===c).reduce((s,e)=>s+e.amount,0),
  })).filter(c=>c.amount>0).sort((a,b)=>b.amount-a.amount);

  const totalExpenses = expenses.reduce((s,e)=>s+e.amount,0);
  const thisMonth     = expenses.filter(e=>e.date?.startsWith(new Date().toISOString().slice(0,7))).reduce((s,e)=>s+e.amount,0);

  return (
    <div className="space-y-4">
      <PageHeader title={t.expenses} subtitle={`${expenses.length} entries`}>
        <Btn variant="secondary" onClick={()=>exportToExcel(expenses,'Expenses')}><Download size={14}/>Export</Btn>
        <Btn variant="primary" onClick={openNew}><Plus size={15}/>Add Expense</Btn>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:'Total Expenses', val:fmt(totalExpenses), c:'text-red-400'},
          {label:'This Month',     val:fmt(thisMonth),     c:'text-orange-400'},
          {label:'Categories',     val:catSummary.length,  c:'text-blue-400'},
          {label:'Entries',        val:expenses.length,    c:'text-white'},
        ].map(s=>(
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`font-bold text-xl ${s.c}`}>{s.val}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {catSummary.length>0&&(
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={catSummary} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="name" tick={{fill:'#6b7280',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#6b7280',fontSize:10}} tickFormatter={v=>`₹${v/1000}k`} axisLine={false} tickLine={false}/>
              <Tooltip formatter={v=>[fmt(v),'Amount']} contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8,fontSize:12}}/>
              <Bar dataKey="amount" fill="#ef4444" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <SearchBar value={search} onChange={setSearch} placeholder="Search description, category..." className="flex-1 min-w-48"/>
        <div className="flex gap-1 flex-wrap">
          <button onClick={()=>setCatFilter('all')} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${catFilter==='all'?'bg-orange-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>All</button>
          {CATEGORIES.filter(c=>expenses.some(e=>e.category===c)).map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${catFilter===c?'bg-orange-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Table>
        <THead cols={[
          {label:'DATE'},{label:'CATEGORY'},{label:'DESCRIPTION'},
          {label:'PAYMENT',hidden:'hidden md:table-cell'},
          {label:'RECEIPT',hidden:'hidden lg:table-cell'},
          {label:'AMOUNT',align:'right'},
          {label:'ACTIONS',align:'center'},
        ]}/>
        <tbody>
          {filtered.length===0&&<tr><td colSpan={7} className="text-center py-12 text-gray-600">No expenses found</td></tr>}
          {filtered.map(e=>(
            <TRow key={e.id}>
              <TD><span className="text-gray-400 text-xs">{fmtDate(e.date)}</span></TD>
              <TD><span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">{e.category}</span></TD>
              <TD><span className="text-white text-sm">{e.description}</span>{e.notes&&<div className="text-gray-600 text-xs">{e.notes}</div>}</TD>
              <TD className="hidden md:table-cell"><span className="text-gray-400 text-xs">{e.payment_mode}</span></TD>
              <TD className="hidden lg:table-cell"><span className="text-gray-600 text-xs">{e.receipt_no||'—'}</span></TD>
              <TD align="right"><span className="text-red-400 font-semibold">{fmt(e.amount)}</span></TD>
              <TD align="center">
                <div className="flex items-center justify-center gap-1">
                  <button onClick={()=>openEdit(e)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-orange-400 transition-colors"><Edit2 size={13}/></button>
                  <button onClick={()=>setConfirmId(e.id)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                </div>
              </TD>
            </TRow>
          ))}
          {filtered.length>0&&(
            <tr className="bg-gray-800/40">
              <td colSpan={5} className="px-4 py-3 text-gray-400 text-sm font-semibold">Total ({filtered.length} entries)</td>
              <td className="px-4 py-3 text-right text-red-400 font-bold">{fmt(filtered.reduce((s,e)=>s+e.amount,0))}</td>
              <td></td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Add / Edit Modal */}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editId?'Edit Expense':'Add Expense'} size="md">
        <div className="p-5 grid grid-cols-2 gap-3">
          <Field label="Date" required><Input type="date" value={form.date} onChange={e=>f('date',e.target.value)}/></Field>
          <Field label="Category" required><Select value={form.category} onChange={e=>f('category',e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</Select></Field>
          <Field label="Description" required className="col-span-2"><Input value={form.description} onChange={e=>f('description',e.target.value)} placeholder="Shop rent Jan 2024, Electricity bill..."/></Field>
          <Field label="Amount ₹" required><Input type="number" value={form.amount} onChange={e=>f('amount',e.target.value)} placeholder="0.00"/></Field>
          <Field label="Payment Mode"><Select value={form.payment_mode} onChange={e=>f('payment_mode',e.target.value)}>{PAY_MODES.map(m=><option key={m}>{m}</option>)}</Select></Field>
          <Field label="Receipt / Voucher No" className="col-span-2"><Input value={form.receipt_no} onChange={e=>f('receipt_no',e.target.value)} placeholder="Optional receipt number"/></Field>
          <Field label="Notes" className="col-span-2"><Textarea value={form.notes} onChange={e=>f('notes',e.target.value)} rows={2} placeholder="Any additional notes..."/></Field>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Btn variant="secondary" className="flex-1" onClick={()=>setShowForm(false)}>Cancel</Btn>
          <Btn variant="primary" className="flex-1" onClick={save} disabled={!form.description||!form.amount}>
            {editId ? 'Update Expense' : 'Save Expense'}
          </Btn>
        </div>
      </Modal>

      <Confirm open={!!confirmId} onCancel={()=>setConfirmId(null)}
        onConfirm={()=>{deleteExpense(confirmId);setConfirmId(null);}}
        message="Delete this expense entry?"/>
    </div>
  );
}
