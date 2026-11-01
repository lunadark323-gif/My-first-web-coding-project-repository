import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createBotDialog,parseDate} from '../backend/bot-dialog.mjs';
test('validates calendar dates',()=>{assert.equal(parseDate('31.02.2030'),null);assert.equal(parseDate('02.01.2030'),'2030-01-02');});
test('full Telegram rental flow, options, persistence and duplicate prevention',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE bookings(id TEXT PRIMARY KEY,payload TEXT,expires INTEGER,chat TEXT,status TEXT DEFAULT \'pending\')');const sent=[];const now=()=>Date.parse('2030-01-01T07:00:00Z');const handle=createBotDialog({db,now,send:async(method,p)=>sent.push(p)});const msg=text=>handle({chat:{id:123},text});
 for(const text of ['/start','🚙 Выбрать автомобиль','Эконом','Город и КМВ','Suzuki SX4 1.6 GLX','02.01.2030','10:00','05.01.2030','10:00','Аэропорт Минеральные Воды','Джилы-Су','Детское автокресло'])await msg(text);
 assert.match(sent.at(-1).text,/14\s?900/);assert.match(sent.at(-1).text,/6\s?000/);assert.equal(db.prepare('SELECT count(*) AS n FROM bookings').get().n,0);
 await msg('✅ Сохранить заявку');const saved=db.prepare('SELECT * FROM bookings').get();assert.equal(saved.chat,'123');assert.equal(JSON.parse(saved.payload).total,14900);await msg('✅ Сохранить заявку');assert.equal(db.prepare('SELECT count(*) AS n FROM bookings').get().n,1);await msg('📋 Мои заявки');assert.match(sent.at(-1).text,/Suzuki/);assert.equal(await msg('/id'),false);db.close();
});
test('sessions survive restart and incompatible filters offer cars',async()=>{const db=new DatabaseSync(':memory:');const sent=[];const config={db,send:async(_,p)=>sent.push(p)};let handle=createBotDialog(config);const m=text=>({chat:{id:5},text});await handle(m('🚙 Выбрать автомобиль'));handle=createBotDialog(config);await handle(m('Эконом'));await handle(m('Деловая поездка'));assert.ok(sent.at(-1).reply_markup.keyboard.some(r=>r[0]==='Suzuki SX4 1.6 GLX'));db.close();});
test('custom pickup and return times accept exact minutes',async()=>{
 const db=new DatabaseSync(':memory:');const sent=[];const handle=createBotDialog({db,now:()=>Date.parse('2030-01-01T07:00:00Z'),send:async(_,p)=>sent.push(p)});const msg=text=>handle({chat:{id:9},text});
 for(const text of ['🚙 Выбрать автомобиль','Эконом','Любая задача','Suzuki SX4 1.6 GLX','02.01.2030'])await msg(text);
 assert.ok(sent.at(-1).reply_markup.keyboard.some(r=>r[0]==='🕒 Своя подача'));await msg('🕒 Своя подача');assert.match(sent.at(-1).text,/точное время подачи/);await msg('9:35');await msg('05.01.2030');await msg('🕒 Своё время возврата');await msg('14.20');const s=JSON.parse(db.prepare('SELECT payload FROM bot_sessions WHERE chat=?').get('9').payload);assert.equal(s.startTime,'09:35');assert.equal(s.endTime,'14:20');assert.equal(s.step,'pickup');db.close();
});
test('website booking handoff links only the intended chat',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE bookings(id TEXT PRIMARY KEY,payload TEXT,expires INTEGER,chat TEXT,status TEXT DEFAULT \'pending\')');const sent=[];const now=()=>Date.parse('2030-01-01T07:00:00Z'),id='a'.repeat(40),payload={car:'Suzuki SX4',start:'2030-01-02T06:35:00Z',end:'2030-01-05T11:20:00Z',pickup:'Пятигорск',total:12000,deposit:6000};db.prepare('INSERT INTO bookings(id,payload,expires) VALUES(?,?,?)').run(id,JSON.stringify(payload),now()+86400000);const handle=createBotDialog({db,now,send:async(_,p)=>sent.push(p)});
 await handle({chat:{id:11},text:'/start '+id});assert.match(sent.at(-1).text,/Получил вашу заявку с сайта/);assert.match(sent.at(-1).text,/09:35/);assert.equal(db.prepare('SELECT chat FROM bookings').get().chat,'11');await handle({chat:{id:12},text:'/start '+id});assert.match(sent.at(-1).text,/Ссылка недействительна/);assert.equal(db.prepare('SELECT chat FROM bookings').get().chat,'11');db.close();
});

test('accepted booking, contact, manager reply and client reply form a complete loop',async()=>{
 const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE bookings(id TEXT PRIMARY KEY,payload TEXT,expires INTEGER,chat TEXT,status TEXT DEFAULT 'pending')");const sent=[],id='b'.repeat(40),now=()=>Date.parse('2030-01-01');db.prepare('INSERT INTO bookings VALUES(?,?,?,?,?)').run(id,JSON.stringify({car:'Toyota',start:'2030-01-02',end:'2030-01-05',total:100,deposit:200}),now()+86400000,null,'pending');const h=createBotDialog({db,now,adminChat:'99',send:async(_,p)=>sent.push(p)});const msg=(chat,text)=>h({chat:{id:chat},text});
 await msg(11,'/start '+id);assert.match(sent.at(-1).text,/Ваша заявка принята/);await msg(11,'✅ Связаться в Telegram');assert.equal(db.prepare('SELECT contact FROM booking_contacts').get().contact,'Связь в Telegram');assert.equal(sent.at(-1).chat_id,'99');
 await msg(12,'/reply '+id.slice(0,10)+' чужой ответ');assert.ok(!sent.at(-1).text.includes('Сообщение менеджера'));
 await msg(99,'/reply '+id.slice(0,10)+' Заявку проверили');assert.ok(sent.some(p=>p.chat_id==='11'&&p.text.includes('Заявку проверили')));
 await msg(11,'✉ Написать менеджеру');await msg(11,'Можно получить в аэропорту?');assert.ok(sent.some(p=>p.chat_id==='99'&&p.text.includes('Можно получить в аэропорту?')));assert.match(sent.at(-1).text,/передано менеджеру/);db.close();
});
