import { useState } from 'react';
import { Users, Building2, Shield, Clock, Download, Plus, Edit2, Trash2, Eye, EyeOff, RefreshCw, ChevronRight } from 'lucide-react';
import { useAuth, ROLES, PLANS } from '../../lib/AuthContext';
import { getAuditLogs, createBackup, getLastBackup } from '../../lib/db';
import { Modal, Btn, Field, Input, Select, PageHeader, Badge } from '../shared/UI';
import { fmtDate } from '../../utils/helpers';
import { useApp } from '../../lib/AppContext';

const ADMIN_TABS = [
  { key: 'users', label: 'User Management', icon: Users },
  { key: 'branches', label: 'Branch Management', icon: Building2 },
  { key: 'subscription', label: 'Subscription', icon: Shield },
  { key: 'audit', label: 'Audit Logs', icon: Clock },
  { key: 'backup', label: 'Backup & Restore', icon: Download },
];

// ─── USER MANAGEMENT ──────────────────────────────────────────────────────────
function UserManagement() {
  const { allUsers, addUser, updateUser, user: currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'salesman', branch_id:'b1' });
  const [showPasswords, setShowPasswords] = useState({});
  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  const save = () => {
    if (!form.name || !form.email || !form.password) return;
    addUser(form);
    setShowForm(false);
    setForm({ name:'', email:'', password:'', role:'salesman', branch_id:'b1' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Users ({allUsers.length})</h3>
        <Btn variant="primary" size="sm" onClick={()=>setShowForm(true)}><Plus size={13}/>Add User</Btn>
      </div>

      <div className="space-y-2">
        {allUsers.map(u => {
          const roleInfo = ROLES[u.role];
          const isMe = u.id === currentUser?.id;
          return (
            <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-orange-400 font-bold text-sm">{u.avatar || u.name?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{u.name}</span>
                  {isMe && <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">You</span>}
                </div>
                <div className="text-gray-500 text-xs">{u.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-800 ${roleInfo?.color}`}>{roleInfo?.label}</span>
                <button
                  onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${u.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {u.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission Matrix */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800"><h4 className="text-white text-sm font-semibold">Role Permission Matrix</h4></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-2 text-gray-500">PERMISSION</th>
                {Object.entries(ROLES).map(([k,r]) => (
                  <th key={k} className={`px-3 py-2 text-center ${r.color}`}>{r.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['Billing', 'Inventory', 'Customers', 'Suppliers', 'Purchases', 'Reports', 'Job Cards', 'Expenses', 'Admin Panel'].map(mod => (
                <tr key={mod} className="border-b border-gray-800/40">
                  <td className="px-4 py-2 text-gray-400">{mod}</td>
                  {Object.entries(ROLES).map(([k,r]) => {
                    const hasPerm = r.permissions.includes('*') ||
                      r.permissions.some(p => p.startsWith(mod.toLowerCase().replace(' ','_')));
                    return (
                      <td key={k} className="px-3 py-2 text-center">
                        {hasPerm ? <span className="text-green-400">✓</span> : <span className="text-gray-700">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showForm} onClose={()=>setShowForm(false)} title="Add New User" size="sm">
        <div className="p-5 space-y-3">
          <Field label="Full Name" required><Input value={form.name} onChange={e=>f('name',e.target.value)} placeholder="Staff name"/></Field>
          <Field label="Email" required><Input type="email" value={form.email} onChange={e=>f('email',e.target.value)} placeholder="staff@shop.com"/></Field>
          <Field label="Password" required><Input type="password" value={form.password} onChange={e=>f('password',e.target.value)} placeholder="Min 6 characters"/></Field>
          <Field label="Role"><Select value={form.role} onChange={e=>f('role',e.target.value)}>
            {Object.entries(ROLES).map(([k,r])=><option key={k} value={k}>{r.label}</option>)}
          </Select></Field>
          <div className="flex gap-3 pt-2">
            <Btn variant="secondary" className="flex-1" onClick={()=>setShowForm(false)}>Cancel</Btn>
            <Btn variant="primary" className="flex-1" onClick={save}>Add User</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── BRANCH MANAGEMENT ────────────────────────────────────────────────────────
function BranchManagement() {
  const { allBranches, addBranch, tenant } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', address:'' });

  const save = () => {
    if (!form.name) return;
    addBranch(form);
    setShowForm(false);
    setForm({ name:'', address:'' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Branches ({allBranches.length})</h3>
        <Btn variant="primary" size="sm" onClick={()=>setShowForm(true)}><Plus size={13}/>Add Branch</Btn>
      </div>
      {allBranches.map(b => (
        <div key={b.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-blue-400"/>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{b.name}</span>
              {b.is_main && <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">Main</span>}
            </div>
            <div className="text-gray-500 text-xs mt-0.5">{b.address || 'No address set'}</div>
          </div>
          <span className="text-green-400 text-xs">Active</span>
        </div>
      ))}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title="Add Branch" size="sm">
        <div className="p-5 space-y-3">
          <Field label="Branch Name" required><Input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Branch 2 / North Office"/></Field>
          <Field label="Address"><Input value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} placeholder="Full address"/></Field>
          <div className="flex gap-3 pt-2">
            <Btn variant="secondary" className="flex-1" onClick={()=>setShowForm(false)}>Cancel</Btn>
            <Btn variant="primary" className="flex-1" onClick={save}>Add Branch</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── SUBSCRIPTION PANEL ───────────────────────────────────────────────────────
function SubscriptionPanel() {
  const { tenant, setTenant, subscriptionStatus } = useAuth();
  const status = subscriptionStatus();
  const plan = PLANS[tenant?.plan || 'trial'];

  const extendTrial = (days) => {
    const newEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    setTenant({ ...tenant, trial_end: newEnd });
  };

  const upgradePlan = (planKey) => {
    const newEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    setTenant({ ...tenant, plan: planKey, subscription_end: newEnd });
  };

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className={`rounded-xl p-4 border ${status.valid ? 'bg-green-500/8 border-green-500/20' : 'bg-red-500/8 border-red-500/20'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-semibold ${status.valid?'text-green-400':'text-red-400'}`}>
              {status.isTrial ? `Free Trial — ${status.daysLeft} days left` : status.valid ? `${plan?.label} Plan Active` : 'Subscription Expired'}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              {status.isTrial ? `Expires: ${new Date(tenant.trial_end).toLocaleDateString('en-IN')}` : `Renewed until: ${new Date(tenant.subscription_end||'').toLocaleDateString('en-IN')}`}
            </p>
          </div>
          <div className={`text-2xl font-bold ${status.valid?'text-green-400':'text-red-400'}`}>
            {status.daysLeft ?? '—'}
            <div className="text-xs font-normal text-gray-500">days</div>
          </div>
        </div>
      </div>

      {/* Trial Control (for owner/admin) */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <h4 className="text-white font-semibold text-sm">Trial Management (Admin)</h4>
        <p className="text-gray-500 text-xs">For demo/testing: extend or reset trial without online payment</p>
        <div className="flex flex-wrap gap-2">
          {[7, 14, 30].map(d => (
            <Btn key={d} variant="secondary" size="sm" onClick={() => extendTrial(d)}>+{d} days</Btn>
          ))}
          <Btn variant="secondary" size="sm" onClick={() => extendTrial(0)}>Reset Trial</Btn>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(PLANS).filter(([k])=>k!=='trial').map(([key, p]) => (
          <div key={key} className={`bg-gray-900 border rounded-xl p-4 ${tenant?.plan===key?'border-orange-500':'border-gray-800'}`}>
            <div className="text-white font-bold text-lg mb-0.5">{p.label}</div>
            <div className="text-orange-400 text-2xl font-bold mb-1">₹{p.monthly}<span className="text-gray-500 text-sm font-normal">/mo</span></div>
            <div className="text-gray-500 text-xs mb-3">{p.users} user{p.users>1?'s':''} · {p.branches} branch{p.branches>1?'es':''}</div>
            <button onClick={() => upgradePlan(key)}
              className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${tenant?.plan===key?'bg-orange-500 text-white':'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}>
              {tenant?.plan===key ? '✓ Current Plan' : 'Activate Plan'}
            </button>
          </div>
        ))}
      </div>

      {/* Manual payment instructions */}
      <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
        <p className="text-blue-400 font-semibold text-sm mb-2">How Subscription Works (No Online Payment Required)</p>
        <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
          <li>Customer pays via UPI, bank transfer, or cash</li>
          <li>Admin logs in here and clicks "Activate Plan"</li>
          <li>System unlocks features for the selected plan duration</li>
          <li>Expiry warning shown 7 days before subscription ends</li>
        </ol>
      </div>
    </div>
  );
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
function AuditLogs() {
  const logs = getAuditLogs();
  const [filter, setFilter] = useState('all');
  const filtered = logs.filter(l => filter==='all' || l.action===filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Audit Logs ({logs.length})</h3>
        <div className="flex gap-1">
          {['all','CREATE','UPDATE','DELETE','LOGIN'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter===f?'bg-orange-500 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>{f}</button>
          ))}
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-900">
            <tr className="border-b border-gray-800 text-gray-500">
              <th className="text-left px-4 py-2">TIME</th>
              <th className="text-left px-4 py-2">USER</th>
              <th className="text-left px-4 py-2">ACTION</th>
              <th className="text-left px-4 py-2">TABLE</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={4} className="text-center py-8 text-gray-600">No logs yet. Actions will appear here.</td></tr>}
            {filtered.map(l=>(
              <tr key={l.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                <td className="px-4 py-2 text-gray-500">{new Date(l.timestamp).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'})}</td>
                <td className="px-4 py-2 text-gray-300">{l.user}</td>
                <td className="px-4 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${l.action==='CREATE'?'bg-green-500/20 text-green-400':l.action==='DELETE'?'bg-red-500/20 text-red-400':l.action==='LOGIN'?'bg-blue-500/20 text-blue-400':'bg-yellow-500/20 text-yellow-400'}`}>{l.action}</span>
                </td>
                <td className="px-4 py-2 text-gray-500">{l.table}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── BACKUP ───────────────────────────────────────────────────────────────────
function BackupPanel() {
  const { parts, customers, suppliers, invoices, purchases, jobCards, expenses } = useApp();
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState('');
  const lastBackup = getLastBackup();

  const doBackup = () => {
    createBackup({ parts, customers, suppliers, invoices, purchases, jobCards, expenses, timestamp: new Date().toISOString() });
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { success, data, created_at, error } = restoreBackup(ev.target.result);
      if (success) {
        setRestoreMsg(`✓ Backup from ${new Date(created_at).toLocaleDateString('en-IN')} loaded. Refresh to apply.`);
        localStorage.setItem('restore_data', JSON.stringify(data));
      } else {
        setRestoreMsg(`Error: ${error}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold">Backup & Restore</h3>

      {lastBackup && (
        <div className="bg-green-500/8 border border-green-500/20 rounded-xl px-4 py-3">
          <p className="text-green-400 text-sm">Last backup: {new Date(lastBackup).toLocaleString('en-IN')}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backup */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h4 className="text-white font-medium">Create Backup</h4>
          <p className="text-gray-500 text-xs">Download a JSON backup of all your data. Store it safely.</p>
          <Btn variant="primary" onClick={doBackup} className="w-full justify-center"><Download size={14}/>Download Backup</Btn>
          <div className="space-y-1.5 text-xs text-gray-500">
            {[
              `Parts: ${parts.length} records`,
              `Customers: ${customers.length} records`,
              `Invoices: ${invoices.length} records`,
              `Purchases: ${purchases.length} records`,
            ].map(s=><div key={s} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500"/>  {s}</div>)}
          </div>
        </div>

        {/* Restore */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h4 className="text-white font-medium">Restore Backup</h4>
          <p className="text-gray-500 text-xs">Upload a previous backup file to restore your data.</p>
          <label className="block">
            <input type="file" accept=".json" onChange={handleRestore} className="hidden"/>
            <div className="w-full border-2 border-dashed border-gray-700 hover:border-orange-500 rounded-xl p-4 text-center cursor-pointer transition-colors">
              <p className="text-gray-400 text-sm">Click to upload backup.json</p>
            </div>
          </label>
          {restoreMsg && <p className={`text-xs ${restoreMsg.startsWith('✓')?'text-green-400':'text-red-400'}`}>{restoreMsg}</p>}
          <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-lg p-2">
            <p className="text-yellow-400 text-xs">⚠ Restore will overwrite current data. Make a backup first.</p>
          </div>
        </div>
      </div>

      {/* Auto backup schedule */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h4 className="text-white font-medium mb-3">Auto Backup Schedule</h4>
        <div className="space-y-2">
          {[['Daily Backup', 'Every day at 11 PM', true], ['Weekly Backup', 'Every Sunday at 10 PM', true], ['Monthly Backup', '1st of every month', true]].map(([name, schedule, active])=>(
            <div key={name} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
              <div><p className="text-gray-300 text-sm">{name}</p><p className="text-gray-600 text-xs">{schedule}</p></div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${active?'bg-green-500/20 text-green-400':'bg-gray-700 text-gray-500'}`}>{active?'Active':'Off'}</span>
            </div>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-3">Auto backups are stored in your browser. Download manually for off-site storage.</p>
      </div>
    </div>
  );
}

// ─── MAIN ADMIN PAGE ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [tab, setTab] = useState('users');
  const { can, subscriptionStatus } = useAuth();
  const status = subscriptionStatus();

  if (!can('admin.view')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield size={40} className="text-gray-700 mx-auto mb-3"/>
          <p className="text-gray-400">Access Denied — Owner role required</p>
        </div>
      </div>
    );
  }

  const tabContent = { users: UserManagement, branches: BranchManagement, subscription: SubscriptionPanel, audit: AuditLogs, backup: BackupPanel };
  const Content = tabContent[tab];

  return (
    <div className="space-y-4">
      <PageHeader title="Admin Panel" subtitle="Manage users, branches, subscription & data">
        {status.isTrial && (
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg">
            <span className="text-orange-400 text-xs font-semibold">Trial: {status.daysLeft} days left</span>
          </div>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-2 space-y-0.5 h-fit">
          {ADMIN_TABS.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${tab===tb.key?'bg-orange-500/15 text-orange-400':'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <tb.icon size={14}/>{tb.label}
            </button>
          ))}
        </div>
        <div className="lg:col-span-3">
          <Content />
        </div>
      </div>
    </div>
  );
}
