import {fileURLToPath} from 'node:url';
import {defineConfig,loadEnv,type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import {handleChatRequest,type LlmEnv} from './server/chat';

const path=(relative:string)=>fileURLToPath(new URL(relative,import.meta.url));

/** Serve the Vercel-style `/api/chat` function during `npm run dev`.
 *  Vite has no serverless runtime, so this middleware adapts Node's request and
 *  response objects to the Web Request/Response pair used by the handler. */
function assistantApiPlugin(env:LlmEnv):Plugin{
 return {
  name:'human-atlas-assistant-api',
  configureServer(server){
   server.middlewares.use(async(req,res,next)=>{
    if(!/^\/api\/chat(?:\?|$)/.test(req.url??''))return next();
    if(req.method!=='GET'&&req.method!=='POST'&&req.method!=='OPTIONS')return next();
    try{
     const chunks:Buffer[]=[];
     for await(const chunk of req)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk));
     const headers=new Headers();
     for(const [key,value] of Object.entries(req.headers)){
      if(Array.isArray(value))for(const item of value)headers.append(key,item);
      else if(value)headers.set(key,value);
     }
     const abort=new AbortController();
     res.on('close',()=>{if(!res.writableEnded)abort.abort();});
     const body=req.method==='POST'?new Uint8Array(Buffer.concat(chunks)):undefined;
     const request=new Request(`http://${req.headers.host??'localhost'}${req.url??'/api/chat'}`,{method:req.method,headers,body,signal:abort.signal});
     const response=await handleChatRequest(request,env);
     res.statusCode=response.status;
     response.headers.forEach((value,key)=>res.setHeader(key,value));
     if(!response.body){res.end();return;}
     res.flushHeaders();
     const reader=response.body.getReader();
     res.on('close',()=>{if(!res.writableEnded)reader.cancel().catch(()=>{});});
     while(true){
      const {done,value}=await reader.read();
      if(done)break;
      res.write(Buffer.from(value));
     }
     res.end();
    }catch(error){
     console.error('[assistant] dev API failed',error);
     if(!res.headersSent){
      res.statusCode=500;
      res.setHeader('content-type','application/json; charset=utf-8');
      res.end(JSON.stringify({error:{code:'server_error',message:'The assistant endpoint failed.'}}));
     }else res.end();
    }
   });
  },
 };
}

export default defineConfig(({mode})=>{
 const env={...process.env,...loadEnv(mode,process.cwd(),'')} as LlmEnv;
 return {root:path('./web'),envDir:path('./'),publicDir:path('./public'),plugins:[react(),assistantApiPlugin(env)],resolve:{alias:{'@':path('./')}},css:{postcss:{plugins:[tailwindcss()]}},server:{watch:{usePolling:true}},build:{outDir:path('./dist'),emptyOutDir:true}};
});
