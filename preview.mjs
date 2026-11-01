import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(path.resolve(root)+path.sep)){res.writeHead(403);return res.end();}
 const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Файл не найден.');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Сайт уже запущен: http://127.0.0.1:4173/':'Не удалось запустить сайт.');process.exitCode=error.code==='EADDRINUSE'?0:1;});
server.listen(4173,'127.0.0.1',()=>console.log('Фаэтон КМВ: http://127.0.0.1:4173/\nАдминистратор: http://127.0.0.1:4173/admin.html\nОставьте это окно открытым. Для остановки нажмите Ctrl+C.'));
