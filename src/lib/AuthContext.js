import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auditLog, getCurrentUser, getSession, clearSession, getTenant, saveTenant } from './db';

// ─── ROLES & PERMISSIONS ─────────────────────────────────────────────────────
export const ROLES = {
  owner: {
    label: 'Owner', color: 'text-orange-400',
    permissions: ['*'], // all
  },
  manager: {
    label: 'Manager', color: 'text-blue-400',
    permissions: ['billing.*','inventory.*','customers.*','suppliers.*','purchases.*','reports.*','jobcards.*','expenses.*'],
  },
  salesman: {
    label: 'Salesman', color: 'text-green-400',
    permissions: ['billing.view','billing.create','customers.view','customers.create','inventory.view'],
  },
  accountant: {
    label: 'Accountant', color: 'text-purple-400',
    permissions: ['billing.*','purchases.*','expenses.*','reports.*','customers.view','suppliers.view'],
  },
  stock_manager: {
    label: 'Stock Manager', color: 'text-yellow-400',
    permissions: ['inventory.*','purchases.*','suppliers.*','reports.stock'],
  },
  viewer: {
    label: 'Viewer (Read Only)', color: 'text-gray-400',
    permissions: ['*.view'],
  },
};

// ─── PLAN LIMITS ──────────────────────────────────────────────────────────────
export const PLANS = {
  trial: {
    label: 'Free Trial', days: 30, users: 1, branches: 1,
    features: ['billing','inventory','customers','suppliers','purchases','reports','jobcards','expenses'],
  },
  basic: {
    label: 'Basic', monthly: 499, users: 1, branches: 1,
    features: ['billing','inventory','customers','suppliers','purchases','reports','jobcards','expenses'],
  },
  standard: {
    label: 'Standard', monthly: 899, users: 3, branches: 1,
    features: ['billing','inventory','customers','suppliers','purchases','reports','jobcards','expenses','ai','backup'],
  },
  pro: {
    label: 'Pro', monthly: 1499, users: 5, branches: 3,
    features: ['*'],
  },
};

// ─── DEMO USERS ──────────────────────────────────────────────────────────────
const DEMO_USERS = [
  {
    id: 'u1', name: 'Shop Owner', email: 'admin@autospares.in', password: 'admin123',
    role: 'owner', branch_id: 'b1', is_active: true,
    tenant_id: 't1', avatar: 'SO',
  },
  {
    id: 'u2', name: 'Sales Staff', email: 'sales@autospares.in', password: 'sales123',
    role: 'salesman', branch_id: 'b1', is_active: true,
    tenant_id: 't1', avatar: 'SS',
  },
  {
    id: 'u3', name: 'Accountant', email: 'accounts@autospares.in', password: 'acc123',
    role: 'accountant', branch_id: 'b1', is_active: true,
    tenant_id: 't1', avatar: 'AC',
  },
];

const DEMO_TENANT = {
  id: 't1',
  shop_name: 'My Auto Spares',
  plan: 'trial',
  trial_start: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  trial_end: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days left
  subscription_end: null,
  is_active: true,
  branches: [
    { id: 'b1', name: 'Main Branch', address: '123 Main Road', is_main: true },
    { id: 'b2', name: 'Branch 2', address: '45 Cross Street', is_main: false },
  ],
  users: DEMO_USERS,
};

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenantState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginHistory, setLoginHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('login_history') || '[]'); } catch { return []; }
  });

  // Restore session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session.user);
      const t = getTenant() || DEMO_TENANT;
      setTenantState(t);
    }
    setLoading(false);
  }, []);

  // Auto backup check
  useEffect(() => {
    const lastBackup = localStorage.getItem('last_backup');
    if (!lastBackup || Date.now() - new Date(lastBackup).getTime() > 24 * 60 * 60 * 1000) {
      localStorage.setItem('backup_due', 'true');
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoginError('');
    // Demo mode: check against demo users
    const found = DEMO_USERS.find(u => u.email === email && u.password === password && u.is_active);
    if (!found) {
      setLoginError('Invalid email or password');
      return false;
    }
    const { password: _, ...safeUser } = found;
    const expiry = Date.now() + 8 * 60 * 60 * 1000; // 8 hour session
    localStorage.setItem('current_user', JSON.stringify(safeUser));
    localStorage.setItem('session_expiry', String(expiry));

    const t = getTenant() || DEMO_TENANT;
    saveTenant(t);
    setUser(safeUser);
    setTenantState(t);

    // Log login
    const entry = { user: email, time: new Date().toISOString(), success: true, ip: '127.0.0.1' };
    const history = [entry, ...loginHistory].slice(0, 100);
    setLoginHistory(history);
    localStorage.setItem('login_history', JSON.stringify(history));
    auditLog('LOGIN', 'auth', safeUser.id, null, { email, time: entry.time });
    return true;
  }, [loginHistory]);

  const logout = useCallback(() => {
    auditLog('LOGOUT', 'auth', user?.id, { email: user?.email }, null);
    clearSession();
    setUser(null);
    setTenantState(null);
  }, [user]);

  // Permission check
  const can = useCallback((permission) => {
    if (!user) return false;
    const role = ROLES[user.role];
    if (!role) return false;
    if (role.permissions.includes('*')) return true;
    if (role.permissions.some(p => p === permission)) return true;
    // wildcard: billing.* covers billing.view, billing.create etc
    const [mod] = permission.split('.');
    if (role.permissions.includes(`${mod}.*`)) return true;
    if (role.permissions.includes('*.view') && permission.endsWith('.view')) return true;
    return false;
  }, [user]);

  // Subscription check
  const subscriptionStatus = () => {
    if (!tenant) return { valid: false, reason: 'No tenant' };
    if (tenant.plan === 'trial') {
      const end = new Date(tenant.trial_end);
      const daysLeft = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) return { valid: false, reason: 'Trial expired', daysLeft: 0, isTrial: true };
      return { valid: true, isTrial: true, daysLeft, plan: 'trial' };
    }
    if (tenant.subscription_end) {
      const end = new Date(tenant.subscription_end);
      const daysLeft = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) return { valid: false, reason: 'Subscription expired', daysLeft: 0 };
      return { valid: true, daysLeft, plan: tenant.plan };
    }
    return { valid: true, plan: tenant.plan };
  };

  const addUser = (newUser) => {
    const updated = { ...tenant, users: [...(tenant.users || []), { ...newUser, id: `u_${Date.now()}`, tenant_id: tenant.id, is_active: true }] };
    saveTenant(updated);
    setTenantState(updated);
    auditLog('CREATE', 'users', newUser.email, null, newUser);
  };

  const updateUser = (id, updates) => {
    const updated = { ...tenant, users: (tenant.users || []).map(u => u.id === id ? { ...u, ...updates } : u) };
    saveTenant(updated);
    setTenantState(updated);
    auditLog('UPDATE', 'users', id, null, updates);
  };

  const addBranch = (branch) => {
    const updated = { ...tenant, branches: [...(tenant.branches || []), { ...branch, id: `b_${Date.now()}` }] };
    saveTenant(updated);
    setTenantState(updated);
  };

  return (
    <AuthContext.Provider value={{
      user, tenant, loading, loginError, loginHistory,
      login, logout, can, subscriptionStatus,
      addUser, updateUser, addBranch,
      setTenant: (t) => { saveTenant(t); setTenantState(t); },
      currentBranch: tenant?.branches?.find(b => b.id === user?.branch_id) || tenant?.branches?.[0],
      allBranches: tenant?.branches || [],
      allUsers: tenant?.users || [],
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
