/**
 * AutoSpares Pro — Unified Database Layer
 * Works in demo mode (localStorage) or Supabase mode
 * All writes go through here so audit logs are automatic
 */

import { supabase } from './supabase';

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────
const auditLog = (action, table, recordId, oldData, newData) => {
  const log = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    timestamp: new Date().toISOString(),
    action, table, record_id: recordId,
    user: getCurrentUser()?.email || 'admin',
    old_data: oldData ? JSON.stringify(oldData) : null,
    new_data: newData ? JSON.stringify(newData) : null,
    ip: 'local',
  };
  const logs = getAuditLogs();
  logs.unshift(log);
  localStorage.setItem('audit_logs', JSON.stringify(logs.slice(0, 1000))); // keep last 1000
  return log;
};

export const getAuditLogs = () => {
  try { return JSON.parse(localStorage.getItem('audit_logs') || '[]'); } catch { return []; }
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const getCurrentUser = () => {
  try { return JSON.parse(localStorage.getItem('current_user') || 'null'); } catch { return null; }
};

export const getSession = () => {
  const user = getCurrentUser();
  const expiry = localStorage.getItem('session_expiry');
  if (!user || !expiry) return null;
  if (Date.now() > parseInt(expiry)) { clearSession(); return null; }
  return { user, expiry: parseInt(expiry) };
};

export const clearSession = () => {
  localStorage.removeItem('current_user');
  localStorage.removeItem('session_expiry');
};

// ─── TENANT / SAAS ───────────────────────────────────────────────────────────
export const getTenant = () => {
  try { return JSON.parse(localStorage.getItem('tenant') || 'null'); } catch { return null; }
};

export const saveTenant = (tenant) => {
  localStorage.setItem('tenant', JSON.stringify(tenant));
};

// ─── BACKUP ──────────────────────────────────────────────────────────────────
export const createBackup = (allData) => {
  const backup = {
    version: '1.0',
    created_at: new Date().toISOString(),
    app: 'AutoSpares Pro',
    data: allData,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `autospares_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  localStorage.setItem('last_backup', new Date().toISOString());
};

export const restoreBackup = (json) => {
  try {
    const backup = JSON.parse(json);
    if (!backup.data) throw new Error('Invalid backup file');
    return { success: true, data: backup.data, created_at: backup.created_at };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const getLastBackup = () => localStorage.getItem('last_backup');

// ─── OFFLINE QUEUE ────────────────────────────────────────────────────────────
export const queueOfflineAction = (action) => {
  const queue = getOfflineQueue();
  queue.push({ ...action, queued_at: new Date().toISOString() });
  localStorage.setItem('offline_queue', JSON.stringify(queue));
};

export const getOfflineQueue = () => {
  try { return JSON.parse(localStorage.getItem('offline_queue') || '[]'); } catch { return []; }
};

export const clearOfflineQueue = () => localStorage.removeItem('offline_queue');

// ─── SOFT DELETE REGISTRY ────────────────────────────────────────────────────
export const getDeletedItems = () => {
  try { return JSON.parse(localStorage.getItem('deleted_items') || '[]'); } catch { return []; }
};

export const softDelete = (table, item) => {
  const deleted = getDeletedItems();
  deleted.unshift({ ...item, _table: table, _deleted_at: new Date().toISOString() });
  localStorage.setItem('deleted_items', JSON.stringify(deleted.slice(0, 200)));
  auditLog('DELETE', table, item.id, item, null);
};

export const restoreItem = (id) => {
  const deleted = getDeletedItems();
  const item = deleted.find(d => d.id === id);
  const remaining = deleted.filter(d => d.id !== id);
  localStorage.setItem('deleted_items', JSON.stringify(remaining));
  return item;
};

export { auditLog };
