import { supabase } from '../supabase';

export const dashboardApi = {
  getSummary: async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch('/api/dashboard/summary', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
