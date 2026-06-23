-- ============================================================
-- إصلاح سياسات RLS - إزالة التكرار اللانهائي
-- جمعية سفراء التعليمية
-- ============================================================

-- حذف السياسات الحالية
DROP POLICY IF EXISTS "المدير - قراءة جميع المستخدمين" ON public.users;
DROP POLICY IF EXISTS "المدير - تعديل المستخدمين" ON public.users;
DROP POLICY IF EXISTS "المدير - إدارة الخزائن" ON public.funds;

-- إنشاء دالة لتجنب التكرار اللانهائي في RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;

-- إنشاء دالة للتحقق من أن المستخدم مسجل
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT auth.role() = 'authenticated';
$$;

-- ============================================================
-- سياسات RLS المعدلة - المستخدمين
-- ============================================================

-- المستخدم العادي يرى فقط بياناته
CREATE POLICY "المستخدمون - قراءة بياناتهم فقط" ON public.users
    FOR SELECT
    USING (id = auth.uid());

-- المدير يرى جميع المستخدمين (باستخدام الدالة الآمنة)
CREATE POLICY "المدير - قراءة جميع المستخدمين" ON public.users
    FOR SELECT
    USING (public.is_admin());

-- المدير يعدّل أي مستخدم
CREATE POLICY "المدير - تعديل المستخدمين" ON public.users
    FOR UPDATE
    USING (public.is_admin());

-- ============================================================
-- سياسات RLS المعدلة - الخزائن
-- ============================================================

-- جميع المستخدمين المسجلين يقرؤون الخزائن
CREATE POLICY "الجميع - قراءة الخزائن" ON public.funds
    FOR SELECT
    USING (public.is_authenticated());

-- المدير فقط يعدّل الخزائن
CREATE POLICY "المدير - إدارة الخزائن" ON public.funds
    FOR ALL
    USING (public.is_admin());

-- ============================================================
-- سياسات RLS المعدلة - الحركات المالية
-- ============================================================

-- جميع المستخدمين المسجلين يقرؤون الحركات
CREATE POLICY "الجميع - قراءة الحركات" ON public.fund_transactions
    FOR SELECT
    USING (public.is_authenticated());

-- جميع المستخدمين المسجلين يُضيفون حركات
CREATE POLICY "الجميع - إضافة حركات" ON public.fund_transactions
    FOR INSERT
    WITH CHECK (public.is_authenticated());
