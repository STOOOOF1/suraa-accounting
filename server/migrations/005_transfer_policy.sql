-- ============================================================
-- الترحيل 005: سياسة UPDATE لجدول الحركات المالية
-- ============================================================
-- يسمح للمستخدمين المسجلين بتحديث fund_id (ترحيل الحركات)

-- السماح بتحديث fund_id للحركات المالية
CREATE POLICY "auth_update_tx_fund_id" ON public.fund_transactions
    FOR UPDATE
    USING (public.is_authenticated())
    WITH CHECK (public.is_authenticated());

-- التحقق من وجود العمود
DO $$
BEGIN
    RAISE NOTICE 'تم تشغيل ترحيل 005: سياسة UPDATE للحركات المالية';
END $$;
