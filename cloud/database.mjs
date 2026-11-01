import pg from 'pg';
import {AsyncLocalStorage} from 'node:async_hooks';
import {attachDatabasePool} from '@neon/functions';
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:15000});
attachDatabasePool(pool);
const scope=new AsyncLocalStorage();
export function translate(sql){
 if(sql==='INSERT OR REPLACE INTO booking_contacts VALUES(?,?)')sql='INSERT INTO booking_contacts(booking_id,contact) VALUES(?,?) ON CONFLICT(booking_id) DO UPDATE SET contact=excluded.contact';
 let n=0;return sql.replace(/\?/g,()=>'$'+(++n)).replace(/\browid\b/g,'created_seq');
}
const query=(sql,args=[])=>scope.getStore().query(translate(sql),args);
export const db={
 // Schema changes are versioned in schema.sql, applied explicitly before deployment.
 async exec(sql){if(/^CREATE TABLE/i.test(sql))return;return query(sql.replace('BEGIN IMMEDIATE','BEGIN'));},
 prepare(sql){return {async get(...args){return (await query(sql,args)).rows[0];},async all(...args){return (await query(sql,args)).rows;},async run(...args){const r=await query(sql,args);return {changes:r.rowCount};}};},
};
export async function withConnection(task){const client=await pool.connect();try{return await scope.run(client,task);}finally{try{await client.query('ROLLBACK');}catch{}client.release();}}
export async function transaction(task){await query('BEGIN');try{const result=await task();await query('COMMIT');return result;}catch(error){await query('ROLLBACK');throw error;}}
export {pool};
