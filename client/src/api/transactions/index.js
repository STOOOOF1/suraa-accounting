import { supabase } from '../supabase';

export const transactionsApi = {
  getAll: async (params = {}) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/transactions?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  create: async (data) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
