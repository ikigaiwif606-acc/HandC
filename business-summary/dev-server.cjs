'use strict';
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const {createHandler}=require('./api/business');
const accessPath=path.join(process.env.HOME,'.config/handc-business-summary/access.json');
async function start(){
  let access;
  if(process.argv.includes('--test-login')){
    const crypto=require('node:crypto'),salt=crypto.randomBytes(16).toString('hex');
    access={passwordHash:'scrypt-v1$'+salt+'$'+crypto.scryptSync('Preview-Only-Routine-2026!',salt,64).toString('hex'),sessionSecret:crypto.randomBytes(32).toString('base64url')};
  }else access=JSON.parse(await fs.readFile(accessPath,'utf8'));
  const business=createHandler({passwordHash:access.passwordHash,sessionSecret:access.sessionSecret,secure:false});
  const staticDir=path.join(__dirname,'public');
  const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png','.pdf':'application/pdf','.svg':'image/svg+xml'};
  const server=http.createServer(async(req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/api/business'||url.pathname==='/business'||url.pathname==='/business/'||url.pathname.startsWith('/business/')){
      if(url.pathname.startsWith('/business/assets/'))url.searchParams.set('asset',url.pathname.slice('/business/assets/'.length));
      else if(url.pathname.startsWith('/business/'))url.searchParams.set('action',url.pathname.slice('/business/'.length));
      req.url='/api/business'+url.search;return business(req,res);
    }
    try{
      if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
      const name=decodeURIComponent(url.pathname)==='/'?'/index.html':decodeURIComponent(url.pathname);
      const file=path.resolve(staticDir,'.'+name);
      if(!file.startsWith(staticDir+path.sep)){res.writeHead(404);return res.end();}
      const data=await fs.readFile(file);res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(req.method==='HEAD'?'':data);
    }catch(_){res.writeHead(404);res.end('Not found.');}
  });
  server.listen(4174,'127.0.0.1',()=>console.log('Studio preview: http://127.0.0.1:4174/ · Business: /business'));
}
start().catch(()=>{console.error('Create the local Business access configuration before starting the preview.');process.exitCode=1;});
