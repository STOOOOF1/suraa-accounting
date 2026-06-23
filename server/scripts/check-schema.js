const { Client } = require('pg');

async function main() {
  const pgClient = new Client({
    connectionString: 'postgresql://postgres:Sofraa%40%401446@db.ntdzgmzgslyocwjnnjvg.supabase.co:5432/postgres'
  });
  await pgClient.connect();

  // فحص هيكل auth.users
  const { rows: userCols } = await pgClient.query(`
    SELECT column_name, data_type, is_generated 
    FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users'
    ORDER BY ordinal_position
  `);
  console.log('=== أعمدة auth.users ===');
  userCols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})${c.is_generated === 'ALWAYS' ? ' [مُوَلَّد]' : ''}`));

  // فحص هيكل auth.identities
  const { rows: idCols } = await pgClient.query(`
    SELECT column_name, data_type, is_generated
    FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'identities'
    ORDER BY ordinal_position
  `);
  console.log('\n=== أعمدة auth.identities ===');
  idCols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})${c.is_generated === 'ALWAYS' ? ' [مُوَلَّد]' : ''}`));

  await pgClient.end();
}

main().catch(e => console.error('❌', e.message));
