import { useState } from 'react';
import { Car, Eye, EyeOff, Lock, Mail, AlertCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

const DEMO_ACCOUNTS = [
  { role: 'Owner (Full Access)', email: 'admin@autospares.in', pass: 'admin123', color: 'text-orange-400' },
  { role: 'Salesman', email: 'sales@autospares.in', pass: 'sales123', color: 'text-green-400' },
  { role: 'Accountant', email: 'accounts@autospares.in', pass: 'acc123', color: 'text-purple-400' },
];

export default function Login() {
  const { login, loginError } = useAuth();
  const [email, setEmail] = useState('admin@autospares.in');
  const [password, setPassword] = useState('admin123');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  const quickLogin = async (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setLoading(true);
    await login(acc.email, acc.pass);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-orange-500 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
            <Car size={28} className="text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">AutoSpares Pro</h1>
          <p className="text-gray-500 text-sm mt-1">GST Billing & Inventory</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-5">Sign In</h2>

          {loginError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2.5 rounded-lg mb-4">
              <AlertCircle size={14} />
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="admin@yourshop.in"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 placeholder-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Enter password"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-orange-500 placeholder-gray-600"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><span>Sign In</span><ChevronRight size={14} /></>
              )}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-gray-500 text-xs mb-3 uppercase tracking-wide font-medium">Demo Accounts — Click to Login</p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.email} onClick={() => quickLogin(acc)}
                className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded-xl px-3 py-2.5 transition-colors group">
                <div className="text-left">
                  <div className={`text-xs font-semibold ${acc.color}`}>{acc.role}</div>
                  <div className="text-gray-500 text-xs">{acc.email} / {acc.pass}</div>
                </div>
                <ChevronRight size={13} className="text-gray-600 group-hover:text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-700 text-xs mt-4">
          AutoSpares Pro v1.0 · Made for Indian Auto Parts Shops
        </p>
      </div>
    </div>
  );
}
