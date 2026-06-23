-- ============================================================
-- نظام سفراء المحاسبي - الهجرة الأولية لقاعدة البيانات
-- جمعية سفراء التعليمية
-- تاريخ الإنشاء: 2024
-- ============================================================
-- تنبيه: هذا الملف مرجعي. قم بتشغيل الأوامر في
-- Supabase SQL Editor بعد إنشاء المشروع.
-- ============================================================

-- ============================================================
-- 1. جدول المستخدمين (ملحق بجدول auth.users في Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'data_entry' CHECK (role IN ('admin', 'data_entry')),
    is_active BOOLEAN DEFAULT TRUE,
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. دالة لإنشاء سجل مستخدم تلقائياً
--    عند إنشاء حساب جديد في auth.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
        'data_entry'
    );
    RETURN NEW;
END;
$$;

-- ============================================================
-- 3. المحفز (Trigger) للربط التلقائي
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4. جدول الخزائن / الصناديق
-- ============================================================
CREATE TABLE IF NOT EXISTS public.funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('main', 'restricted')),
    description TEXT,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. جدول حركات الخزائن (للإطار المستقبلي - Sprint 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fund_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID NOT NULL REFERENCES public.funds(id) ON DELETE RESTRICT,
    type VARCHAR(10) NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    reference_no VARCHAR(50),
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. الفهارس (Indexes) لتحسين أداء الاستعلامات
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_fund_transactions_fund_id ON public.fund_transactions(fund_id);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON public.fund_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_type ON public.fund_transactions(type);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- ============================================================
-- 7. دوال الأمان (لتجنب التكرار اللانهائي في RLS)
-- ============================================================

-- دالة للتحقق من أن المستخدم مدير (تعمل بتجاوز RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;

-- دالة للتحقق من أن المستخدم مسجل دخول
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT auth.role() = 'authenticated';
$$;

-- ============================================================
-- 8. تفعيل أمان مستوى الصف (Row Level Security)
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. سياسات RLS - المستخدمين
-- ============================================================

-- المستخدم العادي يرى فقط بياناته
CREATE POLICY "read_own" ON public.users
    FOR SELECT
    USING (id = auth.uid());

-- المدير يرى جميع المستخدمين
CREATE POLICY "admin_read_all" ON public.users
    FOR SELECT
    USING (public.is_admin());

-- المدير يعدّل أي مستخدم
CREATE POLICY "admin_update" ON public.users
    FOR UPDATE
    USING (public.is_admin());

-- ============================================================
-- 10. سياسات RLS - الخزائن
-- ============================================================

-- جميع المستخدمين المسجلين يقرؤون الخزائن
CREATE POLICY "auth_select_funds" ON public.funds
    FOR SELECT
    USING (public.is_authenticated());

-- المدير فقط يعدّل الخزائن
CREATE POLICY "admin_all_funds" ON public.funds
    FOR ALL
    USING (public.is_admin());

-- ============================================================
-- 11. سياسات RLS - الحركات المالية
-- ============================================================

-- جميع المستخدمين المسجلين يقرؤون الحركات
CREATE POLICY "auth_select_tx" ON public.fund_transactions
    FOR SELECT
    USING (public.is_authenticated());

-- جميع المستخدمين المسجلين يُضيفون حركات
CREATE POLICY "auth_insert_tx" ON public.fund_transactions
    FOR INSERT
    WITH CHECK (public.is_authenticated());

-- ============================================================
-- 12. البيانات الابتدائية (Seeds)
-- ============================================================

-- الخزينة الرئيسية للجمعية
INSERT INTO public.funds (name, type, description)
SELECT 'الخزينة الرئيسية', 'main', 'الصندوق العام لجمعية سفراء التعليمية - جميع الإيرادات والمصروفات العامة'
WHERE NOT EXISTS (SELECT 1 FROM public.funds WHERE name = 'الخزينة الرئيسية');

-- خزينة مقيدة: برنامج الأيتام
INSERT INTO public.funds (name, type, description)
SELECT 'برنامج الأيتام', 'restricted', 'مخصص لدعم ورعاية الأيتام المسجلين في الجمعية'
WHERE NOT EXISTS (SELECT 1 FROM public.funds WHERE name = 'برنامج الأيتام');

-- خزينة مقيدة: برنامج الطلاب المتفوقين
INSERT INTO public.funds (name, type, description)
SELECT 'برنامج الطلاب المتفوقين', 'restricted', 'مخصص لتكريم ودعم الطلاب المتفوقين دراسياً'
WHERE NOT EXISTS (SELECT 1 FROM public.funds WHERE name = 'برنامج الطلاب المتفوقين');
