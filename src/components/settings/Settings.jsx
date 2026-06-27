import { useState } from 'react';
import { Save, Globe, Building2, CreditCard, Bell, Database, FileText, Trash2 } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import { Btn, PageHeader, Field, Input, Select } from '../shared/UI';

const TABS = [
  { key: 'shop',     label: 'Shop Details',  icon: Building2 },
  { key: 'billing',  label: 'Billing',       icon: FileText  },
  { key: 'gst',      label: 'GST & Tax',     icon: CreditCard},
  { key: 'language', label: 'Language',      icon: Globe     },
  { key: 'database', label: 'Database',      icon: Database  },
  { key: 'alerts',   label: 'Alerts',        icon: Bell      },
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Puducherry','Chandigarh',
  'Jammu & Kashmir','Ladakh','Goa',
];

export default function Settings() {
  const { shop, setShop, lang, setLang, demoMode, setDemoMode, t, clearDemoData } = useApp();
  const [tab, setTab]     = useState('shop');
  const [form, setForm]   = useState({ ...shop });
  const [saved, setSaved] = useState(false);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  const saveShop = () => {
    setShop({ ...shop, ...form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClearDemo = () => {
    if (window.confirm('⚠️ This will delete ALL demo data — parts, invoices, customers, everything.\n\nAre you sure you want to start fresh?')) {
      clearDemoData();
      alert('✅ Demo data cleared. You can now add your own data.');
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t.settings} subtitle="Configure your shop settings"/>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Tab Nav */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-2 space-y-0.5 h-fit">
          {TABS.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${tab===tb.key?'bg-orange-500/15 text-orange-400':'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <tb.icon size={14}/>{tb.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-4">

          {/* ── SHOP DETAILS ── */}
          {tab === 'shop' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <h3 className="text-white font-semibold">Shop Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Shop / Business Name" required className="md:col-span-2">
                  <Input value={form.name||''} onChange={e=>f('name',e.target.value)} placeholder="Sri Murugan Auto Parts"/>
                </Field>
                <Field label="Phone Number">
                  <Input value={form.phone||''} onChange={e=>f('phone',e.target.value)} placeholder="9876543210"/>
                </Field>
                <Field label="Alt Phone / WhatsApp">
                  <Input value={form.alt_phone||''} onChange={e=>f('alt_phone',e.target.value)}/>
                </Field>
                <Field label="Email">
                  <Input type="email" value={form.email||''} onChange={e=>f('email',e.target.value)} placeholder="shop@email.com"/>
                </Field>
                <Field label="Website">
                  <Input value={form.website||''} onChange={e=>f('website',e.target.value)} placeholder="www.myshop.com"/>
                </Field>
                <Field label="Address" className="md:col-span-2">
                  <textarea value={form.address||''} onChange={e=>f('address',e.target.value)} rows={2}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-none"/>
                </Field>
                <Field label="City"><Input value={form.city||''} onChange={e=>f('city',e.target.value)} placeholder="Chennai"/></Field>
                <Field label="Pincode"><Input value={form.pincode||''} onChange={e=>f('pincode',e.target.value)} placeholder="600001"/></Field>
              </div>
              <div className="flex justify-end">
                <Btn variant="primary" onClick={saveShop}><Save size={14}/>{saved?'✓ Saved!':'Save Changes'}</Btn>
              </div>
            </div>
          )}

          {/* ── GST & TAX ── */}
          {tab === 'gst' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <h3 className="text-white font-semibold">GST & Tax Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="GSTIN">
                  <Input value={form.gstin||''} onChange={e=>f('gstin',e.target.value)} placeholder="33AABCR1234F1Z5"/>
                </Field>
                <Field label="PAN Number">
                  <Input value={form.pan||''} onChange={e=>f('pan',e.target.value)} placeholder="AABCR1234F"/>
                </Field>
                <Field label="State">
                  <Select value={form.state||'Tamil Nadu'} onChange={e=>f('state',e.target.value)}>
                    {INDIAN_STATES.map(s=><option key={s}>{s}</option>)}
                  </Select>
                </Field>
                <Field label="State Code">
                  <Input value={form.state_code||''} onChange={e=>f('state_code',e.target.value)} placeholder="33"/>
                </Field>
                <Field label="Default Supply Type">
                  <Select value={form.default_supply_type||'intrastate'} onChange={e=>f('default_supply_type',e.target.value)}>
                    <option value="intrastate">Intrastate (CGST + SGST)</option>
                    <option value="interstate">Interstate (IGST)</option>
                  </Select>
                </Field>
                <Field label="Financial Year">
                  <Select value={form.financial_year||'2024-25'} onChange={e=>f('financial_year',e.target.value)}>
                    <option>2023-24</option><option>2024-25</option><option>2025-26</option>
                  </Select>
                </Field>
              </div>
              <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
                <p className="text-blue-400 text-xs font-semibold mb-1">GST Filing Reminder</p>
                <p className="text-gray-400 text-xs">GSTR-1 due: 11th of every month. GSTR-3B due: 20th of every month.</p>
                <p className="text-gray-400 text-xs mt-1">Use Reports → GSTR-1 to export for filing on GST portal.</p>
              </div>
              <div className="flex justify-end">
                <Btn variant="primary" onClick={saveShop}><Save size={14}/>{saved?'✓ Saved!':'Save Changes'}</Btn>
              </div>
            </div>
          )}

          {/* ── BILLING SETTINGS ── */}
          {tab === 'billing' && (
            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                <h3 className="text-white font-semibold">Invoice Number Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Invoice Prefix">
                    <Input value={form.invoice_prefix||'INV'} onChange={e=>f('invoice_prefix',e.target.value)} placeholder="INV"/>
                  </Field>
                  <Field label="Next Invoice Number">
                    <Input type="number" value={form.invoice_counter||1} onChange={e=>f('invoice_counter',parseInt(e.target.value)||1)}/>
                  </Field>
                  <Field label="Purchase Prefix">
                    <Input value={form.purchase_prefix||'PUR'} onChange={e=>f('purchase_prefix',e.target.value)} placeholder="PUR"/>
                  </Field>
                  <Field label="Next Purchase Number">
                    <Input type="number" value={form.purchase_counter||1} onChange={e=>f('purchase_counter',parseInt(e.target.value)||1)}/>
                  </Field>
                  <Field label="Job Card Prefix">
                    <Input value={form.job_prefix||'JOB'} onChange={e=>f('job_prefix',e.target.value)} placeholder="JOB"/>
                  </Field>
                  <Field label="Next Job Number">
                    <Input type="number" value={form.job_counter||1} onChange={e=>f('job_counter',parseInt(e.target.value)||1)}/>
                  </Field>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                <h3 className="text-white font-semibold">Bank Details (shown on Invoice)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Bank Name">
                    <Input value={form.bank_name||''} onChange={e=>f('bank_name',e.target.value)} placeholder="State Bank of India"/>
                  </Field>
                  <Field label="Account Number">
                    <Input value={form.bank_account||''} onChange={e=>f('bank_account',e.target.value)} placeholder="1234567890"/>
                  </Field>
                  <Field label="IFSC Code">
                    <Input value={form.ifsc_code||''} onChange={e=>f('ifsc_code',e.target.value)} placeholder="SBIN0001234"/>
                  </Field>
                  <Field label="UPI ID">
                    <Input value={form.upi_id||''} onChange={e=>f('upi_id',e.target.value)} placeholder="shop@upi"/>
                  </Field>
                </div>
              </div>

              <div className="flex justify-end">
                <Btn variant="primary" onClick={saveShop}><Save size={14}/>{saved?'✓ Saved!':'Save Changes'}</Btn>
              </div>
            </div>
          )}

          {/* ── LANGUAGE ── */}
          {tab === 'language' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <h3 className="text-white font-semibold">Language / மொழி</h3>
              <div className="grid grid-cols-2 gap-3">
                {[{code:'en',label:'English',sub:'English'},{code:'ta',label:'தமிழ்',sub:'Tamil'}].map(l=>(
                  <button key={l.code} onClick={()=>setLang(l.code)}
                    className={`p-4 rounded-xl border-2 text-center transition-colors ${lang===l.code?'border-orange-500 bg-orange-500/10':'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
                    <div className={`text-xl font-bold mb-1 ${lang===l.code?'text-orange-400':'text-white'}`}>{l.label}</div>
                    <div className="text-gray-400 text-sm">{l.sub}</div>
                    {lang===l.code&&<div className="mt-2 text-orange-400 text-xs font-semibold">✓ Active</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── DATABASE ── */}
          {tab === 'database' && (
            <div className="space-y-4">

              {/* Clear Demo Data */}
              <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-red-400 font-semibold text-sm flex items-center gap-2">
                      <Trash2 size={14}/> Clear Demo Data
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Remove all sample invoices, parts, customers etc. and start fresh with your own real data.
                    </p>
                  </div>
                  <button onClick={handleClearDemo}
                    className="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                    Clear & Start Fresh
                  </button>
                </div>
              </div>

              {/* Connection status */}
              <div className={`rounded-xl p-4 border ${demoMode?'bg-orange-500/8 border-orange-500/20':'bg-green-500/8 border-green-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold text-sm ${demoMode?'text-orange-400':'text-green-400'}`}>
                      {demoMode?'⚠ Demo Mode — Data saved in browser':'✓ Connected to Supabase'}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {demoMode?'Add your Supabase keys in Netlify environment variables to enable cloud sync.':'All data is saved permanently to your Supabase database.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Supabase info */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
                <h3 className="text-white font-semibold">Supabase Connection</h3>
                <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-3">
                  <p className="text-blue-400 text-xs font-semibold mb-2">Your Supabase details:</p>
                  <div className="space-y-1 font-mono text-xs text-gray-400">
                    <div>URL: <span className="text-green-400">https://zhmvsuymjszjlgnkybpg.supabase.co</span></div>
                    <div>Status: <span className={demoMode?'text-yellow-400':'text-green-400'}>{demoMode?'Not connected yet':'Connected ✓'}</span></div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-xs font-mono text-gray-400">
                  <p className="text-gray-500 mb-1"># Your .env file should have:</p>
                  <p>REACT_APP_SUPABASE_URL=https://zhmvsuymjszjlgnkybpg.supabase.co</p>
                  <p>REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...</p>
                </div>
                <p className="text-gray-500 text-xs">These are already added to Netlify. After next deploy, data will sync to Supabase automatically.</p>
              </div>
            </div>
          )}

          {/* ── ALERTS ── */}
          {tab === 'alerts' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <h3 className="text-white font-semibold">Alert & Feature Settings</h3>
              <div className="space-y-3">
                {[
                  {key:'low_stock_alert',  label:'Low Stock Alert',      sub:'Alert when stock falls below reorder level', def:true},
                  {key:'payment_reminder', label:'Payment Due Reminder', sub:'Remind about overdue invoices',              def:false},
                  {key:'whatsapp_enabled', label:'WhatsApp Integration', sub:'Enable WhatsApp bill sharing',               def:false},
                  {key:'gst_reminder',     label:'GST Filing Reminder',  sub:'Monthly GSTR-1 and GSTR-3B reminders',      def:true},
                  {key:'tally_export',     label:'Tally XML Export',     sub:'Enable Tally export in reports',             def:false},
                  {key:'negative_stock',   label:'Prevent Negative Stock',sub:'Block sale if stock goes below 0',         def:true},
                ].map(item=>(
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">{item.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{item.sub}</p>
                    </div>
                    <button onClick={()=>f(item.key,!form[item.key])}
                      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${(form[item.key]??item.def)?'bg-orange-500':'bg-gray-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${(form[item.key]??item.def)?'left-6':'left-1'}`}/>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Btn variant="primary" onClick={saveShop}><Save size={14}/>{saved?'✓ Saved!':'Save Changes'}</Btn>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
