import {createConnection} from 'node:net';
const alreadyRunning=await new Promise(resolve=>{const socket=createConnection({host:process.env.HOST||'127.0.0.1',port:Number(process.env.PORT||3000)});socket.setTimeout(1000);socket.once('connect',()=>{socket.destroy();resolve(true)});socket.once('error',()=>{socket.destroy();resolve(false)});socket.once('timeout',()=>{socket.destroy();resolve(false)});});
if(alreadyRunning){console.log('Сервер уже запущен. Администратор: http://127.0.0.1:4173/admin.html');process.exit(0);}
// Credentials are read from .env and never printed.
let pollingDisabled=!process.env.BOT_TOKEN?.trim();
if(pollingDisabled)console.log('BOT_TOKEN не заполнен. Сервер сайта запустится без Telegram-бота.');
else try{
 const base=`https://api.telegram.org/bot${process.env.BOT_TOKEN.trim()}/`;
 const me=await(await fetch(base+'getMe',{signal:AbortSignal.timeout(5000)})).json();
 if(!me.ok){pollingDisabled=true;console.log('Telegram не принял токен. Сервер сайта запустится, но токен бота нужно проверить в backend/.env.');}
 else{
  const hook=await(await fetch(base+'getWebhookInfo',{signal:AbortSignal.timeout(5000)})).json();
  if(!hook.ok)throw Error('connection');
  if(hook.result.url){pollingDisabled=true;console.log('У бота подключён webhook другого сервера. Локальный опрос Telegram отключён; сервер сайта запускается.');}
  else console.log(`Telegram отвечает: @${me.result.username}. Откройте бота и отправьте /start.`);
 }
}catch{
 console.log('Соединение с Telegram пока недоступно. Сервер сайта запустится; бот будет повторять попытки соединения. Токен менять из-за сбоя сети не нужно.');
}
process.env.BOT_POLLING_DISABLED=pollingDisabled?'true':'false';
console.log('Администратор: http://127.0.0.1:4173/admin.html\nАдрес API: http://127.0.0.1:3000\nОставьте окно открытым. Для остановки — Ctrl+C.');
await import('./server.mjs');
