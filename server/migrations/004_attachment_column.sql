-- ============================================================
-- إضافة عمود المرفقات لجدول الحركات المالية
-- ============================================================
ALTER TABLE public.fund_transactions
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- ============================================================
-- إنشاء Bucket للتخزين
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 
    'attachments',
    'attachments',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'attachments');

-- ============================================================
-- سياسة RLS للقراءة من Bucket (للمستخدمين المسجلين)
-- ============================================================
DROP POLICY IF EXISTS "auth_select_attachments" ON storage.objects;
CREATE POLICY "auth_select_attachments" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'attachments' AND auth.role() = 'authenticated');

-- ============================================================
-- سياسة RLS للرفع إلى Bucket (للمستخدمين المسجلين)
-- ============================================================
DROP POLICY IF EXISTS "auth_insert_attachments" ON storage.objects;
CREATE POLICY "auth_insert_attachments" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');
