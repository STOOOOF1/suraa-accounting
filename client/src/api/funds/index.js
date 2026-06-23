import { supabase } from '../supabase';

export const fundsApi = {
  getAll: async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch('/api/funds', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getById: async (id) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(`/api/funds/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  create: async (data) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch('/api/funds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  update: async (id, data) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(`/api/funds/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  remove: async (id) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(`/api/funds/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  transfer: async (id, targetFundId) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(`/api/funds/${id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ target_fund_id: targetFundId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
