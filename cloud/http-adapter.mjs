// Adapt the existing Node HTTP handler to Neon's web-standard fetch interface.
export default {createServer(handler){return {async fetch(request){
 const headers=Object.fromEntries(request.headers.entries()),url=new URL(request.url);
 const req={method:request.method,url:url.pathname+url.search,headers,socket:{remoteAddress:'request'},async *[Symbol.asyncIterator](){
  if(!request.body)return;const reader=request.body.getReader();try{for(;;){const {done,value}=await reader.read();if(done)break;yield Buffer.from(value);}}finally{reader.releaseLock();}
 }};
 return new Promise((resolve,reject)=>{let status=200;const outgoing=new Headers();const res={setHeader(name,value){outgoing.set(name,String(value));},writeHead(code,values={}){status=code;for(const [name,value]of Object.entries(values))outgoing.set(name,String(value));},end(data){resolve(new Response(status===204?null:data,{status,headers:outgoing}));}};Promise.resolve(handler(req,res)).catch(reject);});
 }};}};
