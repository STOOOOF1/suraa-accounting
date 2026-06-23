const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const projectRef = supabaseUrl?.match(/https:\/\/(.+)\.supabase\.co/)?.[1];

function getPgClient() {
  const { Client } = require('pg');
  return new Client({
    host: `${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
      sslmode: 'require',
    },
    connectionTimeoutMillis: 8000,
    keepAlive: false,
  });
}

/**
 * تشغيل ملف الترحيل (migration)
 */
const runMigration = async (req, res) => {
  try {
    const { name } = req.params;
    const filePath = path.join(__dirname, '..', 'migrations', `${name}.sql`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'ملف الترحيل غير موجود.', path: filePath });
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    // المحاولة: استخدام Direct pg connection
    if (process.env.SUPABASE_DB_PASSWORD) {
      try {
        const client = getPgClient();
        await client.connect();
        console.log('PG connected, running migration...');
        await client.query(sql);
        await client.end();
        console.log('Migration complete via direct pg');
        return res.json({ message: 'تم تشغيل الترحيل بنجاح.' });
      } catch (pgError) {
        console.log('Direct pg failed:', pgError.message);
      }
    }

    // المحاولة الثانية: استخدام Supabase Management API
    const pat = process.env.SUPABASE_PAT;
    if (pat && projectRef) {
      try {
        const response = await fetch(
          `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${pat}`,
            },
            body: JSON.stringify({ query: sql }),
          }
        );
        if (response.ok) {
          return res.json({ message: 'تم تشغيل الترحيل بنجاح عبر Management API.' });
        }
        const errData = await response.json();
        return res.status(400).json({
          message: 'فشل تشغيل الترحيل عبر Management API',
          error: errData,
        });
      } catch (apiError) {
        console.log('Management API failed:', apiError.message);
      }
    }

    return res.status(400).json({
      message: 'تعذر تشغيل الترحيل. يجب أن يتصل السيرفر بقاعدة البيانات مباشرة.',
      hint: 'تأكد من أن SUPABASE_DB_PASSWORD صحيح في server/.env. القيمة الحالية: ' +
        (process.env.SUPABASE_DB_PASSWORD ? 'موجودة' : 'فارغة') +
        '. أو استخدم SUPABASE_PAT (Personal Access Token من https://supabase.com/dashboard/account/tokens)',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * التحقق من حالة الترحيلات
 */
const getStatus = async (req, res) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    let columnExists = false;
    let bucketExists = false;

    // التحقق من وجود عمود attachment_url
    const { error } = await supabase
      .from('fund_transactions')
      .select('attachment_url')
      .limit(1);

    if (!error || !error.message?.toLowerCase().includes('attachment_url')) {
      columnExists = true;
    }

    // التحقق من وجود bucket
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      bucketExists = buckets?.some(b => b.name === 'attachments');
    } catch (e) {
      // ignore
    }

    res.json({ attachment_column: columnExists, storage_bucket: bucketExists });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { runMigration, getStatus };
