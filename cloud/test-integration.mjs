import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
process.env.ADMIN_TOKEN=randomBytes(32).toString('hex');process.env.DATA_KEY=randomBytes(32).toString('base64');process.env.TELEGRAM_WEBHOOK_SECRET=randomBytes(24).toString('hex');process.env.FRONTEND_ORIGIN='http://127.0.0.1:4173';process.env.BOT_TOKEN='fake-test-token';process.env.ADMIN_CHAT_ID='test-manager';
const out=[];globalThis.fetch=async(url,options)=>{assert.match(String(url),/^https:\/\/api.telegram.org\//);out.push(JSON.parse(options.body));return Response.json({ok:true,result:{username:'FakeTestBot'}});};
const {default:app}=await import('./generated/server.mjs');const {pool}=await import('./database.mjs');
const origin=process.env.FRONTEND_ORIGIN,chat='qa-'+randomBytes(6).toString('hex'),ids=[],updates=[];
const request=(path,{method='GET',body,auth,headers={}}={})=>app.fetch(new Request('https://qa.example'+path,{method,headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(auth?{Authorization:'Bearer '+auth}:{}),...headers},body:body?JSON.stringify(body):undefined}));
async function webhook(text){const update_id=1000000000+Math.floor(Math.random()*1000000000);updates.push(update_id);const r=await request('/telegram/webhook',{method:'POST',headers:{'x-telegram-bot-api-secret-token':process.env.TELEGRAM_WEBHOOK_SECRET},body:{update_id,message:{chat:{id:chat,type:'private'},text}}});assert.equal(r.status,200,await r.text());return update_id;}
try{
 assert.equal((await request('/health')).status,200);assert.equal((await request('/admin/bookings')).status,401);
 const start=new Date(Date.now()+86400000*2),end=new Date(+start+86400000*3);
 let r=await request('/api/bookings',{method:'POST',body:{car_id:'sx4',start:start.toISOString(),end:end.toISOString(),route:'jily',equipment:'seat'}});assert.equal(r.status,201,await r.clone().text());const booking=await r.json();ids.push(booking.token);assert.equal(booking.quote.total,14900);
 r=await request('/admin/session',{method:'POST',body:{key:process.env.ADMIN_TOKEN}});assert.equal(r.status,200,await r.clone().text());const session=(await r.json()).session_token;assert.equal((await request('/admin/bookings',{auth:session})).status,200);
 assert.equal((await request('/telegram/webhook',{method:'POST',body:{update_id:1}})).status,401);
 await webhook('/start '+booking.token);assert.match(out.at(-1).text,/Ваша заявка принята/);await webhook('✅ Связаться в Telegram');assert.ok(out.some(p=>p.chat_id==='test-manager'));
 await webhook('✉ Написать менеджеру');await webhook('Учебный вопрос');assert.match(out.at(-1).text,/передано менеджеру/);
 const {createBotDialog}=await import('./generated/bot-dialog.mjs'),{db,withConnection}=await import('./database.mjs');await withConnection(async()=>{const handle=await createBotDialog({db,adminChat:'',send:async(_,p)=>out.push(p)});await handle({chat:{id:chat},text:'✉ Написать менеджеру'});await handle({chat:{id:chat},text:'Вопрос без привязки менеджера'});});assert.match(out.at(-1).text,/Сообщение принято/);
 r=await request('/admin/messages?id='+booking.token,{auth:session});assert.equal(r.status,200);assert.equal((await r.json()).length,2);
 r=await request('/admin/contract/'+booking.token,{auth:session});assert.equal(r.status,200);const contract=await r.text();assert.equal((contract.match(/<section>/g)||[]).length,2);assert.match(contract,/УЧЕБНЫЙ/);
 r=await request('/admin/reply',{method:'POST',auth:session,body:{id:booking.token,text:'Учебный ответ'}});assert.equal(r.status,200);assert.ok(out.some(p=>p.text.includes('Учебный ответ')));
 r=await request('/admin/confirm',{method:'POST',auth:session,body:{id:booking.token}});assert.equal(r.status,200,await r.text());assert.ok(out.some(p=>p.text.includes('подтверждена менеджером')));
 const before=out.length;await request('/telegram/webhook',{method:'POST',headers:{'x-telegram-bot-api-secret-token':process.env.TELEGRAM_WEBHOOK_SECRET},body:{update_id:updates.at(-1),message:{chat:{id:chat,type:'private'},text:'Не дублировать'}}});assert.equal(out.length,before);
 r=await request('/admin/report.xlsx',{auth:session});assert.equal(r.status,200);assert.equal(Buffer.from(await r.arrayBuffer()).subarray(0,2).toString(),'PK');
 assert.equal((await request('/api/customer/fake',{method:'POST',body:{}})).status,503);
 await request('/admin/logout',{method:'POST',auth:session});assert.equal((await request('/admin/bookings',{auth:session})).status,401);
 console.log('PASS: live Neon Postgres, pricing, sessions, webhook secret, accepted booking, contact, manager round-trip, duplicate update, Excel and disabled documents.');
}finally{for(const id of ids){await pool.query('DELETE FROM booking_contacts WHERE booking_id=$1',[id]);await pool.query('DELETE FROM bookings WHERE id=$1',[id]);}await pool.query('DELETE FROM bot_sessions WHERE chat=$1',[chat]);for(const id of updates)await pool.query('DELETE FROM telegram_updates WHERE id=$1',[id]);await pool.end();}
