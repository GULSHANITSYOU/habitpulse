import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

const password = 'BPzudkB9OO3v4NqI';
const projectRef = 'qumpqsbmvgcvfwzpgtvz';

async function runMigration() {
  const sql = fs.readFileSync(path.resolve('./supabase_schema.sql'), 'utf8');

  console.log(`Connecting directly to Supabase db.${projectRef}.supabase.co:5432...`);
  const client = new Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL database successfully!');

    console.log('Applying database schema and RLS policies...');
    await client.query(sql);
    console.log('✓ Migration applied successfully!');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('user_cloud_sync', 'profiles');
    `);
    console.log('✓ Verified tables in database:', res.rows.map(r => r.table_name));

    await client.end();
    console.log('\nSUCCESS! All tables and security policies are active.');
    return true;
  } catch (err) {
    console.error('Migration failed:', err.message);
    try {
      await client.end();
    } catch (_) {}
    return false;
  }
}

runMigration().then((success) => {
  process.exit(success ? 0 : 1);
});
