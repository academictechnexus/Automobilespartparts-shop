import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Clock, Download, Shield, Wifi } from 'lucide-react';
import { useApp } from '../../lib/AppContext';
import {
  loadGoogleScripts, signInGoogle, signOutGoogle,
  isGoogleConnected, backupToGoogleDrive,
  getBackupLog, getLastBackupTime, isDueForBackup
} from '../../lib/googleDrive';
import { Btn } from '../shared/UI';
import { fmt } from '../../utils/helpers';

export default function GoogleDriveBackup() {
  const { parts, customers, suppliers, invoices, purchases, jobCards, expenses, returns, shop } = useApp();
  const [connected,   setConnected]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [backing,     setBacking]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState('');
  const [backupLog,   setBackupLog]   = useState([]);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [autoBackup,  setAutoBackup]  = useState(localStorage.getItem('gdrive_auto') === 'true');

  const shopName = shop?.name || 'My Shop';
  const hasClientId = !!process.env.REACT_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    setConnected(isGoogleConnected());
    setBackupLog(getBackupLog());

    // Load Google scripts
    if (hasClientId) {
      loadGoogleScripts()
        .then(() => setScriptsReady(true))
        .catch(() => setError('Failed to load Google scripts'));
    }

    // Auto backup check every hour
    const interval = setInterval(() => {
      if (isGoogleConnected() && autoBackup && isDueForBackup()) {
        handleBackup(true);
      }
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      await signInGoogle();
      setConnected(true);
      // Trigger first backup immediately
      await handleBackup(false);
    } catch (err) {
      setError(err.message || 'Failed to connect. Check Google Client ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    signOutGoogle();
    setConnected(false);
    setResult(null);
  };

  const handleBackup = async (silent = false) => {
    if (!isGoogleConnected()) { setError('Not connected to Google Drive'); return; }
    setBacking(true);
    setError('');
    setResult(null);
    try {
      const allData = { parts, customers, suppliers, invoices, purchases, jobCards, expenses, returns };
      const files   = await backupToGoogleDrive(allData, shopName);
      setResult(files);
      setBackupLog(getBackupLog());
      if (!silent) setResult(files);
    } catch (err) {
      setError(err.message || 'Backup failed. Please reconnect.');
      if (err.message?.includes('401') || err.message?.includes('token')) {
        setConnected(false);
      }
    } finally {
      setBacking(false);
    }
  };

  const toggleAutoBackup = (val) => {
    setAutoBackup(val);
    localStorage.setItem('gdrive_auto', val ? 'true' : 'false');
  };

  const lastBackup   = getLastBackupTime();
  const backupDue    = isDueForBackup();
  const dataSize     = JSON.stringify({ parts, customers, invoices }).length;

  // ── NOT CONFIGURED ──────────────────────────────────────────────────────────
  if (!hasClientId) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Cloud size={20} className="text-blue-400 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="text-blue-400 font-semibold">Google Drive Backup Setup</p>
              <p className="text-gray-400 text-sm mt-1">To enable Google Drive backup, add your Google OAuth Client ID to Netlify environment variables.</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">How to Set Up (5 minutes)</h3>
          <ol className="space-y-3">
            {[
              { step: '1', title: 'Go to Google Cloud Console', desc: 'Visit console.cloud.google.com → Create a new project called "AutoSpares Pro"' },
              { step: '2', title: 'Enable Google Drive API', desc: 'APIs & Services → Enable APIs → search "Google Drive API" → Enable' },
              { step: '3', title: 'Create OAuth 2.0 Credentials', desc: 'APIs & Services → Credentials → Create Credentials → OAuth Client ID → Web Application' },
              { step: '4', title: 'Add Authorized Origins', desc: 'Add your Netlify URL: https://your-app.netlify.app (and http://localhost:3000 for local testing)' },
              { step: '5', title: 'Copy Client ID', desc: 'Copy the Client ID (looks like: 123456789-abc.apps.googleusercontent.com)' },
              { step: '6', title: 'Add to Netlify', desc: 'Netlify → Site Settings → Environment Variables → Add REACT_APP_GOOGLE_CLIENT_ID = your-client-id' },
              { step: '7', title: 'Redeploy', desc: 'Netlify → Deploys → Trigger deploy. Done! Google Drive backup will appear here.' },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
                <div>
                  <p className="text-white text-sm font-medium">{s.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </ol>

          <div className="bg-gray-800 rounded-xl p-3 font-mono text-xs">
            <p className="text-gray-500 mb-1"># Add to Netlify Environment Variables:</p>
            <p className="text-green-400">REACT_APP_GOOGLE_CLIENT_ID = 123456789-abc.apps.googleusercontent.com</p>
            <p className="text-green-400">REACT_APP_GOOGLE_API_KEY = AIzaSy... (optional, for Drive API)</p>
          </div>
        </div>

        {/* Marketing note */}
        <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl p-4">
          <p className="text-orange-400 font-semibold text-sm mb-2">💡 Marketing Tip for Your Customers</p>
          <p className="text-gray-400 text-sm italic">
            "Your business data is automatically backed up to your personal Google Drive every day.
            We never store your data on our servers — it's always 100% yours, always safe, always accessible."
          </p>
        </div>
      </div>
    );
  }

  // ── CONNECTED UI ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Connection Status Card */}
      <div className={`rounded-xl p-5 border ${connected ? 'bg-green-500/8 border-green-500/20' : 'bg-gray-900 border-gray-800'}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected ? 'bg-green-500/20' : 'bg-gray-800'}`}>
              {connected ? <Cloud size={20} className="text-green-400"/> : <CloudOff size={20} className="text-gray-500"/>}
            </div>
            <div>
              <p className={`font-semibold ${connected ? 'text-green-400' : 'text-white'}`}>
                {connected ? '✓ Connected to Google Drive' : 'Not Connected'}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                {connected
                  ? `Backing up to: "${shopName} — AutoSpares Pro Backup" folder`
                  : 'Connect your Google account to enable automatic backup'}
              </p>
            </div>
          </div>
          {connected ? (
            <div className="flex gap-2">
              <Btn variant="primary" onClick={() => handleBackup(false)} disabled={backing}>
                {backing ? <><RefreshCw size={13} className="animate-spin"/>Backing up...</> : <><Cloud size={13}/>Backup Now</>}
              </Btn>
              <Btn variant="danger" onClick={handleDisconnect}>Disconnect</Btn>
            </div>
          ) : (
            <button onClick={handleConnect} disabled={loading || !scriptsReady}
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm">
              {loading ? <RefreshCw size={14} className="animate-spin"/> : (
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {loading ? 'Connecting...' : 'Sign in with Google'}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0"/>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Backup Success */}
      {result && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-green-400"/>
            <p className="text-green-400 font-semibold text-sm">Backup Successful!</p>
            <span className="text-gray-500 text-xs">{new Date().toLocaleString('en-IN')}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {result.map((r, i) => (
              <div key={i} className="bg-gray-800 rounded-lg px-3 py-2 text-center">
                <p className="text-white text-xs font-medium">{r.type}</p>
                <p className="text-gray-500 text-xs mt-0.5">{r.file}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto Backup + Data Stats */}
      {connected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Auto Backup Toggle */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <h4 className="text-white font-semibold text-sm">Auto Backup Settings</h4>
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <div>
                <p className="text-gray-300 text-sm">Daily Auto Backup</p>
                <p className="text-gray-500 text-xs">Backs up every 24 hours automatically</p>
              </div>
              <button onClick={() => toggleAutoBackup(!autoBackup)}
                className={`w-11 h-6 rounded-full transition-colors relative ${autoBackup ? 'bg-green-500' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${autoBackup ? 'left-6' : 'left-1'}`}/>
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Last Backup', val: lastBackup ? new Date(lastBackup).toLocaleString('en-IN') : 'Never' },
                { label: 'Status', val: backupDue ? '⚠ Backup due' : '✓ Up to date', color: backupDue ? 'text-yellow-400' : 'text-green-400' },
                { label: 'Data Size', val: `~${(dataSize/1024).toFixed(1)} KB` },
                { label: 'Records', val: `${invoices.length} invoices · ${parts.length} parts · ${customers.length} customers` },
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={item.color || 'text-gray-300'}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What gets backed up */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h4 className="text-white font-semibold text-sm mb-3">What Gets Backed Up</h4>
            <div className="space-y-2">
              {[
                { label: 'Full JSON Backup', desc: 'Complete data snapshot with timestamp', icon: '📦' },
                { label: 'Invoices CSV', desc: `${invoices.length} invoices with GST details`, icon: '🧾' },
                { label: 'Inventory CSV', desc: `${parts.length} parts with stock levels`, icon: '📦' },
                { label: 'Customers CSV', desc: `${customers.length} customer records`, icon: '👥' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-gray-300 text-xs font-medium">{item.label}</p>
                    <p className="text-gray-600 text-xs">{item.desc}</p>
                  </div>
                  <CheckCircle size={12} className="text-green-400 ml-auto flex-shrink-0"/>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
              📁 Saved to: <span className="text-gray-300">Google Drive → "{shopName} — AutoSpares Pro Backup"</span>
            </div>
          </div>
        </div>
      )}

      {/* Backup Log */}
      {backupLog.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h4 className="text-white font-semibold text-sm flex items-center gap-2">
              <Clock size={14} className="text-gray-400"/> Backup History
            </h4>
          </div>
          <div className="divide-y divide-gray-800">
            {backupLog.slice(0, 10).map((log, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`}/>
                  <div>
                    <p className="text-gray-300 text-sm">{log.type}</p>
                    <p className="text-gray-600 text-xs">{log.files} files · {log.shop}</p>
                  </div>
                </div>
                <span className="text-gray-500 text-xs">
                  {new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security note */}
      <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Shield size={16} className="text-blue-400 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-blue-400 font-semibold text-sm">Your Data, Your Drive</p>
            <p className="text-gray-400 text-xs mt-1">
              Files are saved directly to YOUR Google Drive account. AutoSpares Pro never stores your business data on our servers.
              Only you can access your backup files. You can view, download, or delete them anytime from drive.google.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
