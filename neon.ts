import {defineConfig} from '@neon/config/v1';
const required=['BOT_TOKEN','ADMIN_TOKEN','DATA_KEY','TELEGRAM_WEBHOOK_SECRET','FRONTEND_ORIGIN','PUBLIC_SITE_URL'];
const env=Object.fromEntries(required.map(key=>{if(!process.env[key])throw new Error('Missing deployment secret/config: '+key);return [key,process.env[key]!];}));
if(process.env.ADMIN_CHAT_ID)env.ADMIN_CHAT_ID=process.env.ADMIN_CHAT_ID;
export default defineConfig({functions:{faetonapi:{name:'Фаэтон КМВ — учебный API',source:'cloud/generated/server.mjs',env}}});
