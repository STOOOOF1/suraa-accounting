-- ============================================================
-- الترحيل 005: سياسات UPDATE و DELETE لجدول الحركات المالية
-- ============================================================
-- يسمح للمستخدمين المسجلين بتحديث وحذف الحركات (للترحيل)

-- سياسة التحديث (لترحيل fund_id)
DROP POLICY IF EXISTS "auth_update_tx" ON public.fund_transactions;
CREATE POLICY "auth_update_tx" ON public.fund_transactions
    FOR UPDATE
    USING (public.is_authenticated())
    WITH CHECK (public.is_authenticated());

-- سياسة الحذف (لحذف الحركات بعد الترحيل)
DROP POLICY IF EXISTS "auth_delete_tx" ON public.fund_transactions;
CREATE POLICY "auth_delete_tx" ON public.fund_transactions
    FOR DELETE
    USING (public.is_authenticated());

DO $$
BEGIN
    RAISE NOTICE 'تم تشغيل ترحيل 005: سياسات UPDATE و DELETE للحركات المالية';
END $$;
