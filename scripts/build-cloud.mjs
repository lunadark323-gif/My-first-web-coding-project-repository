import fs from 'node:fs/promises';
import {parse} from 'acorn';
const root=new URL('../',import.meta.url),read=name=>fs.readFile(new URL(name,root),'utf8'),write=(name,text)=>fs.writeFile(new URL(name,root),text);
await fs.mkdir(new URL('cloud/generated/',root),{recursive:true});
function asynchronous(source,names=[]){
 const tree=parse(source,{ecmaVersion:'latest',sourceType:'module'}),edits=[];
 function walk(node,ancestors=[]){if(!node||typeof node!=='object')return;
  const fn=['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(node.type)?node:ancestors.findLast(n=>['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(n.type));
  if(node.type==='CallExpression'){
   const c=node.callee,dbCall=c?.type==='MemberExpression'&&((c.object?.name==='db'&&c.property.name==='exec')||(c.object?.type==='CallExpression'&&c.object.callee?.object?.name==='db'&&['get','run','all'].includes(c.property.name)));
   if(dbCall||(c.type==='Identifier'&&names.includes(c.name))){edits.push([node.start,'(await '],[node.end,')']);if(fn&&!fn.async&&!fn.marked){edits.push([fn.start,'async ']);fn.marked=true;}}
  }
  for(const [key,value]of Object.entries(node)){if(key==='marked')continue;if(Array.isArray(value))for(const child of value)walk(child,[...ancestors,node]);else if(value&&typeof value==='object')walk(value,[...ancestors,node]);}
 }
 walk(tree);for(const [at,text]of edits.sort((a,b)=>b[0]-a[0]))source=source.slice(0,at)+text+source.slice(at);return source;
}
let bot=await read('backend/bot-dialog.mjs');bot=asynchronous(bot,['save']);
bot=bot.replace("if(!adminChat){await say(chat,'Уведомления менеджеру пока не настроены. Владелец должен заполнить ADMIN_CHAT_ID на сервере.');return true;}","await db.prepare('INSERT INTO booking_messages(booking_id,author,body) VALUES(?,?,?)').run(cs.booking,'client',text.slice(0,3000));if(!adminChat){await save(chat,{booking:cs.booking});await say(chat,'Сообщение принято. Менеджер увидит его в админке и ответит сюда.',[...menu,'✉ Написать менеджеру']);return true;}");
bot=bot.replace("else if(s.step==='summary'", "else if(s.step==='summary'");
bot=bot.replace("from './pricing.mjs'","from './pricing.mjs'");
await write('cloud/generated/bot-dialog.mjs',bot);
let pricing=await read('backend/pricing.mjs');pricing=pricing.replace("import {readFileSync} from 'node:fs';",'');pricing=pricing.replace(/export const catalog=JSON.parse\(readFileSync\(.*?\);/,`export const catalog=${await read('dist/catalog.json')};`);
await write('cloud/generated/pricing.mjs',pricing);await write('cloud/generated/domain.mjs',await read('backend/domain.mjs'));
let server=await read('backend/server.mjs');server=server.replace("import http from 'node:http';","import http from '../http-adapter.mjs';\nimport {db,withConnection,transaction} from '../database.mjs';");server=server.replace("import {DatabaseSync} from 'node:sqlite';",'');
server=server.replace(/const env=process.env,dir=.*?\r?\nconst db=.*?\r?\n/s,'const env=process.env;\n');
// This cloud deployment is a teaching demo; the real-document form is disabled.
server=server.replace(/enabled=env.COLLECTION_ENABLED===.*?;\r?\n/,'enabled=false;\n');
const cut=server.indexOf('server.listen(');const telegram=server.indexOf('async function telegram(',cut);server=server.slice(0,cut)+server.slice(telegram);
const poll=server.indexOf('async function poll()');server=server.slice(0,poll);
server=server.replace(/const handleDialog=createBotDialog\([\s\S]*$/,'');
server=asynchronous(server,['authorized','createBotDialog']);
// Only this row mapper queries the database. Resolve it before serializing JSON.
server=server.replace('send(200,rows.map(async r=>','send(200,await Promise.all(rows.map(async r=>').replace('contact:null};}));','contact:null};})));');
// Close the Promise.all added above at the exact end of the booking row mapper.
server=server.replace("phone:'Связь через Telegram'}:null};}));}","phone:'Связь через Telegram'}:null};})));}");
server=server.replace("return send(200,{ok:true,expires_in:28800});","return send(200,{ok:true,expires_in:28800,session_token:value});");
// Bearer sessions also work when browsers block cross-site cookies.
server=server.replace("const value=adminCookie(req);","const value=(req.headers.authorization||'').replace(/^Bearer /,'')||adminCookie(req);");
server=server.replace("hash(adminCookie(req))","hash((req.headers.authorization||'').replace(/^Bearer /,'')||adminCookie(req))");
server=server.replace("telegram_linked:!!r.chat,client:","telegram_linked:!!r.chat,demo_contract:!!r.chat,message_count:(await db.prepare('SELECT count(*)::int AS n FROM booking_messages WHERE booking_id=?').get(r.id)).n,client:");
server=server.replace("if(req.method==='POST'&&u.pathname==='/admin/reply')", "if(req.method==='GET'&&u.pathname==='/admin/messages'){const id=u.searchParams.get('id');return send(200,await db.prepare('SELECT author,body,created_at FROM booking_messages WHERE booking_id=? ORDER BY id').all(id));}\nif(req.method==='POST'&&u.pathname==='/admin/reply')");
server=server.replace("return send(200,{ok:true});}catch{return send(502,{error:'Telegram пока не доставил сообщение.","await db.prepare('INSERT INTO booking_messages(booking_id,author,body) VALUES(?,?,?)').run(id,'manager',text.trim());return send(200,{ok:true});}catch{return send(502,{error:'Telegram пока не доставил сообщение.");
server=server.replace("if(!row?.encrypted||key.length!==32)return send(404,{error:'Нет данных клиента'});const q=JSON.parse(row.payload),c=decrypt(row.encrypted);", "if(!row?.chat)return send(404,{error:'Клиент ещё не открыл заявку в боте'});const q=JSON.parse(row.payload),c={name:'Учебный клиент',phone:'Telegram',birth_date:'не используется',passport:'не используется',issuer:'не используется',passport_date:'не используется',address:'не используется',license:'не используется',license_date:'не используется',license_expiry:'не используется'};");
server=server.replace('ПРОЕКТ договора аренды ТС без экипажа','УЧЕБНЫЙ ПРОЕКТ договора аренды ТС без экипажа');
server=server.replace("SELECT * FROM bookings WHERE id=? AND status='review'","SELECT * FROM bookings WHERE id=? AND status IN ('pending','review') AND chat IS NOT NULL");
server=server.replace("(await db.exec('COMMIT'));return send(200,{ok:true});", "(await db.exec('COMMIT'));try{await telegram('sendMessage',{chat_id:row.chat,text:'Учебная заявка № '+id.slice(0,10)+' подтверждена менеджером. Это демонстрация, оплачивать аренду не нужно.'});}catch{}return send(200,{ok:true});");
const insert=`
if(u.pathname==='/telegram/webhook'&&req.method==='POST'){
 if(!env.TELEGRAM_WEBHOOK_SECRET||!safeEqual(req.headers['x-telegram-bot-api-secret-token'],env.TELEGRAM_WEBHOOK_SECRET))return send(401,{error:'Unauthorized'});
 const update=await body(req);if(!Number.isSafeInteger(update.update_id))return send(400,{error:'Invalid update'});
 await transaction(async()=>{const chat=String(update.message?.chat?.id||update.update_id);await db.prepare('SELECT pg_advisory_xact_lock(hashtextextended(?,0))').get(chat);const prior=await db.prepare('SELECT 1 FROM telegram_updates WHERE id=?').get(update.update_id);if(prior)return;
 const m=update.message;if(m?.chat?.type==='private'&&typeof m.text==='string'){if(m.text==='/id')await telegram('sendMessage',{chat_id:m.chat.id,text:'Ваш chat_id: '+m.chat.id});else if(m.text==='/privacy')await telegram('sendMessage',{chat_id:m.chat.id,text:'Учебная демонстрация. Настоящие документы и оплату не отправляйте.'});else await handleDialog({...m,text:m.text==='/status'?'📋 Мои заявки':m.text});}
 await db.prepare('INSERT INTO telegram_updates(id) VALUES(?) ON CONFLICT DO NOTHING').run(update.update_id);});return send(200,{ok:true});
}
`;
server=server.replace("if(limited(req))",insert+"if(limited(req))");
server+=`\nfunction safeEqual(a,b){const x=Buffer.from(a||''),y=Buffer.from(b||'');return !!b&&x.length===y.length&&timingSafeEqual(x,y);}\nconst handleDialog=await withConnection(()=>createBotDialog({db,adminChat:env.ADMIN_CHAT_ID,send:telegram,photo:env.PUBLIC_SITE_URL?.startsWith('https://')?async(chat,car)=>telegram('sendPhoto',{chat_id:chat,photo:new URL(car.image,env.PUBLIC_SITE_URL.endsWith('/')?env.PUBLIC_SITE_URL:env.PUBLIC_SITE_URL+'/').href,caption:car.name+' · ИИ-иллюстрация модели'}):undefined}));\nexport default {fetch:request=>withConnection(()=>server.fetch(request))};\n`;
// No schema operations at import: deployment runs cloud/schema.sql explicitly.
server=server.replace(/\(await db.exec\('CREATE TABLE IF NOT EXISTS admin_sessions[^\n]+\n/,'');
await write('cloud/generated/server.mjs',server);
parse(server,{ecmaVersion:'latest',sourceType:'module'});parse(bot,{ecmaVersion:'latest',sourceType:'module'});parse(pricing,{ecmaVersion:'latest',sourceType:'module'});
console.log('Cloud handlers generated from the tested local backend.');
