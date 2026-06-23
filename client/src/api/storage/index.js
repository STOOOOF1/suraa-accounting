import { supabase } from '../supabase';

export const storageApi = {
  async uploadAttachment(file) {
    const ext = file.name.split('.').pop();
    const fileName = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `transactions/${fileName}`;

    const { error } = await supabase.storage
      .from('attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  getPublicUrl(path) {
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(path);
    return publicUrl;
  },
};
