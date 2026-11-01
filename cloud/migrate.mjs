import pg from 'pg';
import fs from 'node:fs/promises';
if(!process.env.DATABASE_URL_UNPOOLED)throw Error('Direct database connection is required');
const client=new pg.Client({connectionString:process.env.DATABASE_URL_UNPOOLED});
try{await client.connect();await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(72671001)');await client.query(await fs.readFile(new URL('./schema.sql',import.meta.url),'utf8'));await client.query('COMMIT');console.log('Schema applied successfully.');}catch(error){try{await client.query('ROLLBACK');}catch{}console.error('Migration failed:',error.code||error.name);process.exitCode=1;}finally{await client.end();}
