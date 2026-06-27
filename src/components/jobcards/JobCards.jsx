import { useState } from 'react';
import { Plus, Edit2, Wrench, ChevronLeft, X } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { Modal, Badge, Btn, SearchBar, PageHeader, Table, THead, TRow, TD, Field, Input, Select, Textarea, Confirm } from '../shared/UI';
import { fmt, fmtDate, today } from '../../utils/helpers';

const STATUSES = ['open', 'in-progress', 'done', 'delivered'];
const blank = {
  customer_name:'', phone:'', vehicle_no:'', vehicle_make:'', vehicle_model:'', year:'',
  km_in:'', km_out:'', complaints:'', diagnosis:'', work_done:'', labour_charge:'',
  parts_charge:'', total_charge:'', mechanic_name:'', status:'open', notes:'', job_date: today(),
};

export default function JobCards() {
  const { t, jobCards, upsertJobCard, nextJobNo } = useApp();
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filtered = jobCards.filter(j => {
    const ms = !search || j.customer_name?.toLowerCase().includes(search.toLowerCase()) || j.vehicle_no?.toLowerCase().includes(search.toLowerCase()) || j.job_no?.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'all' || j.status === statusFilter;
    return ms && mst;
  });

  const openNew = () => { setForm({ ...blank }); setEditId(null); setView('form'); };
  const openEdit = (j) => { setForm({ ...j }); setEditId(j.id); setView('form'); };

  const save = () => {
    if (!form.customer_name || !form.vehicle_no) return;
    const labour = parseFloat(form.labour_charge) || 0;
    const parts = parseFloat(form.parts_charge) || 0;
    upsertJobCard({
      ...form, id: editId,
      job_no: editId ? form.job_no : nextJobNo(),
      labour_charge: labour,
      parts_charge: parts,
      total_charge: labour + parts,
    });
    setView('list');
  };

  const statusCounts = {
    open: jobCards.filter(j => j.status === 'open').length,
    'in-progress': jobCards.filter(j => j.status === 'in-progress').length,
    done: jobCards.filter(j => j.status === 'done').length,
    delivered: jobCards.filter(j => j.status === 'delivered').length,
  };

  if (view === 'form') return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('list')} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"><ChevronLeft size={20} /></button>
        <h2 className="text-white font-bold text-xl">{editId ? 'Edit Job Card' : 'New Job Card'}</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer & Vehicle */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="text-orange-400 text-xs font-semibold uppercase tracking-wide">Customer & Vehicle Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Customer Name" required className="col-span-2"><Input value={form.customer_name} onChange={e => f('customer_name', e.target.value)} placeholder="Customer name"/></Field>
            <Field label="Phone" required><Input value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="9876543210"/></Field>
            <Field label="Job Date"><Input type="date" value={form.job_date} onChange={e => f('job_date', e.target.value)}/></Field>
            <Field label="Vehicle No" required><Input value={form.vehicle_no} onChange={e => f('vehicle_no', e.target.value.toUpperCase())} placeholder="TN 37 AB 1234"/></Field>
            <Field label="Vehicle Make"><Input value={form.vehicle_make} onChange={e => f('vehicle_make', e.target.value)} placeholder="Maruti, Hyundai..."/></Field>
            <Field label="Vehicle Model"><Input value={form.vehicle_model} onChange={e => f('vehicle_model', e.target.value)} placeholder="Swift, i20..."/></Field>
            <Field label="Year"><Input value={form.year} onChange={e => f('year', e.target.value)} placeholder="2020"/></Field>
            <Field label="KM In"><Input type="number" value={form.km_in} onChange={e => f('km_in', e.target.value)} placeholder="45000"/></Field>
            <Field label="KM Out"><Input type="number" value={form.km_out} onChange={e => f('km_out', e.target.value)} placeholder="45050"/></Field>
          </div>
        </div>

        {/* Work Details */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="text-orange-400 text-xs font-semibold uppercase tracking-wide">Work Details</h3>
          <Field label="Customer Complaints" required>
            <Textarea value={form.complaints} onChange={e => f('complaints', e.target.value)} rows={3} placeholder="Engine noise, AC not cooling, brake vibration..."/>
          </Field>
          <Field label="Diagnosis / Root Cause">
            <Textarea value={form.diagnosis} onChange={e => f('diagnosis', e.target.value)} rows={2} placeholder="Worn brake pads, AC gas leak..."/>
          </Field>
          <Field label="Work Done">
            <Textarea value={form.work_done} onChange={e => f('work_done', e.target.value)} rows={3} placeholder="Replaced brake pads, AC gas refill, oil change..."/>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mechanic Name"><Input value={form.mechanic_name} onChange={e => f('mechanic_name', e.target.value)} placeholder="Murugan, Selvam..."/></Field>
            <Field label="Status"><Select value={form.status} onChange={e => f('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </Select></Field>
          </div>
        </div>

        {/* Charges */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="text-orange-400 text-xs font-semibold uppercase tracking-wide">Charges</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Labour Charge ₹">
              <Input type="number" value={form.labour_charge} onChange={e => f('labour_charge', e.target.value)} placeholder="500"/>
            </Field>
            <Field label="Parts Charge ₹">
              <Input type="number" value={form.parts_charge} onChange={e => f('parts_charge', e.target.value)} placeholder="1200"/>
            </Field>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 flex justify-between items-center">
            <span className="text-gray-400 text-sm">Total Charge</span>
            <span className="text-orange-400 font-bold text-xl">
              {fmt((parseFloat(form.labour_charge)||0) + (parseFloat(form.parts_charge)||0))}
            </span>
          </div>
          <Field label="Additional Notes">
            <Textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2} placeholder="Any special instructions..."/>
          </Field>
        </div>
      </div>

      <div className="flex gap-3 max-w-md">
        <Btn variant="secondary" className="flex-1" onClick={() => setView('list')}>Cancel</Btn>
        <Btn variant="primary" className="flex-1" onClick={save}>Save Job Card</Btn>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader title={t.jobCards} subtitle={`${jobCards.length} job cards`}>
        <Btn variant="primary" onClick={openNew}><Plus size={15}/>New Job Card</Btn>
      </PageHeader>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Open', val: statusCounts.open, c: 'text-blue-400' },
          { label: 'In Progress', val: statusCounts['in-progress'], c: 'text-orange-400' },
          { label: 'Done', val: statusCounts.done, c: 'text-green-400' },
          { label: 'Delivered', val: statusCounts.delivered, c: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`font-bold text-xl ${s.c}`}>{s.val}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <SearchBar value={search} onChange={setSearch} placeholder="Search job no, customer, vehicle no..." className="flex-1 min-w-52"/>
        <div className="flex gap-1">
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      <Table>
        <THead cols={[
          { label: 'JOB NO' }, { label: 'CUSTOMER' }, { label: 'VEHICLE' },
          { label: 'KM IN', hidden: 'hidden md:table-cell' },
          { label: 'MECHANIC', hidden: 'hidden lg:table-cell' },
          { label: 'TOTAL', align: 'right' }, { label: 'STATUS', align: 'center' },
          { label: 'ACTIONS', align: 'center' },
        ]}/>
        <tbody>
          {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-600 text-sm">{t.noData}</td></tr>}
          {filtered.map(j => (
            <TRow key={j.id}>
              <TD><span className="text-orange-400 font-mono text-xs">{j.job_no}</span><div className="text-gray-600 text-xs">{fmtDate(j.job_date)}</div></TD>
              <TD><div className="text-white text-sm">{j.customer_name}</div><div className="text-gray-500 text-xs">{j.phone}</div></TD>
              <TD><div className="text-gray-300 text-sm font-medium">{j.vehicle_no}</div><div className="text-gray-500 text-xs">{j.vehicle_make} {j.vehicle_model} {j.year}</div></TD>
              <TD className="hidden md:table-cell"><span className="text-gray-400 text-sm">{j.km_in ? j.km_in.toLocaleString('en-IN') : '—'}</span></TD>
              <TD className="hidden lg:table-cell"><span className="text-gray-400 text-sm">{j.mechanic_name || '—'}</span></TD>
              <TD align="right"><span className="text-white font-semibold">{fmt(j.total_charge)}</span><div className="text-gray-600 text-xs">L:{fmt(j.labour_charge)} P:{fmt(j.parts_charge)}</div></TD>
              <TD align="center"><Badge status={j.status}/></TD>
              <TD align="center">
                <button onClick={() => openEdit(j)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-orange-400 transition-colors"><Edit2 size={13}/></button>
              </TD>
            </TRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
