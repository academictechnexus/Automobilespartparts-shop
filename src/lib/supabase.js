import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isConnected = () => !!supabase;

// ─── PRODUCTS / PARTS ──────────────────────────────────────────────────────────
export const db = {
  parts: {
    getAll: async () => {
      if (!supabase) return { data: [], error: null };
      return supabase.from('parts').select('*').order('name');
    },
    upsert: async (part) => {
      if (!supabase) return { data: part, error: null };
      return supabase.from('parts').upsert(part).select().single();
    },
    delete: async (id) => {
      if (!supabase) return { error: null };
      return supabase.from('parts').delete().eq('id', id);
    },
    updateStock: async (id, qty) => {
      if (!supabase) return { error: null };
      return supabase.rpc('update_stock', { part_id: id, qty_change: qty });
    },
  },
  customers: {
    getAll: async () => {
      if (!supabase) return { data: [], error: null };
      return supabase.from('customers').select('*').order('name');
    },
    upsert: async (customer) => {
      if (!supabase) return { data: customer, error: null };
      return supabase.from('customers').upsert(customer).select().single();
    },
    delete: async (id) => {
      if (!supabase) return { error: null };
      return supabase.from('customers').delete().eq('id', id);
    },
  },
  suppliers: {
    getAll: async () => {
      if (!supabase) return { data: [], error: null };
      return supabase.from('suppliers').select('*').order('name');
    },
    upsert: async (supplier) => {
      if (!supabase) return { data: supplier, error: null };
      return supabase.from('suppliers').upsert(supplier).select().single();
    },
    delete: async (id) => {
      if (!supabase) return { error: null };
      return supabase.from('suppliers').delete().eq('id', id);
    },
  },
  invoices: {
    getAll: async () => {
      if (!supabase) return { data: [], error: null };
      return supabase.from('invoices').select('*, invoice_items(*)').order('created_at', { ascending: false });
    },
    create: async (invoice, items) => {
      if (!supabase) return { data: invoice, error: null };
      const { data, error } = await supabase.from('invoices').insert(invoice).select().single();
      if (error) return { data, error };
      const itemsWithId = items.map(i => ({ ...i, invoice_id: data.id }));
      await supabase.from('invoice_items').insert(itemsWithId);
      return { data, error: null };
    },
    updateStatus: async (id, status) => {
      if (!supabase) return { error: null };
      return supabase.from('invoices').update({ status }).eq('id', id);
    },
    delete: async (id) => {
      if (!supabase) return { error: null };
      await supabase.from('invoice_items').delete().eq('invoice_id', id);
      return supabase.from('invoices').delete().eq('id', id);
    },
  },
  purchases: {
    getAll: async () => {
      if (!supabase) return { data: [], error: null };
      return supabase.from('purchases').select('*, purchase_items(*)').order('created_at', { ascending: false });
    },
    create: async (purchase, items) => {
      if (!supabase) return { data: purchase, error: null };
      const { data, error } = await supabase.from('purchases').insert(purchase).select().single();
      if (error) return { data, error };
      const itemsWithId = items.map(i => ({ ...i, purchase_id: data.id }));
      await supabase.from('purchase_items').insert(itemsWithId);
      return { data, error: null };
    },
  },
  jobCards: {
    getAll: async () => {
      if (!supabase) return { data: [], error: null };
      return supabase.from('job_cards').select('*').order('created_at', { ascending: false });
    },
    upsert: async (jobCard) => {
      if (!supabase) return { data: jobCard, error: null };
      return supabase.from('job_cards').upsert(jobCard).select().single();
    },
  },
  expenses: {
    getAll: async () => {
      if (!supabase) return { data: [], error: null };
      return supabase.from('expenses').select('*').order('date', { ascending: false });
    },
    create: async (expense) => {
      if (!supabase) return { data: expense, error: null };
      return supabase.from('expenses').insert(expense).select().single();
    },
  },
};
