const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Sofraa%40%401446@db.ntdzgmzgslyocwjnnjvg.supabase.co:5432/postgres'
  });
  await client.connect();

  // حذف كل السياسات الحالية
  const policies = await client.query(
    `SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'`
  );
  for (const p of policies.rows) {
    await client.query(`DROP POLICY IF EXISTS "${p.policyname}" ON public.${p.tablename} CASCADE`);
  }
  console.log('🗑️ تم حذف جميع السياسات القديمة');

  // إنشاء دوال الأمان
  await client.query(`
    CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
      SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
    $$;
    CREATE OR REPLACE FUNCTION public.is_authenticated() RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
      SELECT auth.role() = 'authenticated';
    $$;
  `);
  console.log('✅ دوال الأمان');

  // إنشاء السياسات الجديدة
  await client.query(`CREATE POLICY "read_own" ON public.users FOR SELECT USING (id = auth.uid())`);
  await client.query(`CREATE POLICY "admin_read_all" ON public.users FOR SELECT USING (public.is_admin())`);
  await client.query(`CREATE POLICY "admin_update" ON public.users FOR UPDATE USING (public.is_admin())`);
  await client.query(`CREATE POLICY "auth_select_funds" ON public.funds FOR SELECT USING (public.is_authenticated())`);
  await client.query(`CREATE POLICY "admin_all_funds" ON public.funds FOR ALL USING (public.is_admin())`);
  await client.query(`CREATE POLICY "auth_select_tx" ON public.fund_transactions FOR SELECT USING (public.is_authenticated())`);
  await client.query(`CREATE POLICY "auth_insert_tx" ON public.fund_transactions FOR INSERT WITH CHECK (public.is_authenticated())`);
  console.log('✅ السياسات الجديدة');

  // تفعيل RLS (إذا لم يكن مفعلاً)
  await client.query(`ALTER TABLE public.users ENABLE ROW LEVEL SECURITY`);
  await client.query(`ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY`);
  await client.query(`ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY`);

  await client.end();
  console.log('\n✅ تم إصلاح RLS بالكامل');
}

main().catch(e => console.error('❌', e.message));
