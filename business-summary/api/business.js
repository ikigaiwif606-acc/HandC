'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const auth=require('../private/auth.cjs');
const files={
  'finance-model.js':['finance-model.js','application/javascript; charset=utf-8'],
  'financials.js':['financials.js','application/javascript; charset=utf-8'],
  'financials.css':['financials.css','text/css; charset=utf-8'],
  'business-page.js':['business-page.js','application/javascript; charset=utf-8']
};
function createHandler(options={}){
  const attempts=new Map(),now=options.now||Date.now;
  const privateDir=options.privateDir||path.join(__dirname,'../private');
  const config=()=>({hash:options.passwordHash??process.env.BUSINESS_PASSWORD_HASH,secret:options.sessionSecret??process.env.BUSINESS_SESSION_SECRET,secure:options.secure??(process.env.BUSINESS_LOCAL_DEV!=='1')});
  function send(req,res,status,body='',type='text/html; charset=utf-8'){
    res.statusCode=status;res.setHeader('Content-Type',type);res.end(req.method==='HEAD'?'':body);
  }
  function redirect(req,res,location){res.setHeader('Location',location);send(req,res,303);}
  async function loginPage(req,res,status=200,message=''){
    const html=await fs.readFile(path.join(privateDir,'login.html'),'utf8');
    send(req,res,status,html.replace('{{ERROR}}',message?`<p class="login-error" role="alert">${message}</p>`:''));
  }
  function sameOrigin(req,secure){
    return typeof req.headers.origin==='string'&&req.headers.origin===`${secure?'https':'http'}://${req.headers.host}`;
  }
  async function password(req){
    if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/x-www-form-urlencoded'))throw Object.assign(new Error(),{status:415});
    if(Number(req.headers['content-length']||0)>4096)throw Object.assign(new Error(),{status:413});
    if(req.body&&typeof req.body==='object')return typeof req.body.password==='string'?req.body.password:'';
    if(typeof req.body==='string')return new URLSearchParams(req.body).get('password')||'';
    let body='';for await(const chunk of req){body+=chunk.toString();if(Buffer.byteLength(body)>4096)throw Object.assign(new Error(),{status:413});}
    return new URLSearchParams(body).get('password')||'';
  }
  return async function handler(req,res){
    res.setHeader('Cache-Control','private, no-store, max-age=0');
    res.setHeader('Vercel-CDN-Cache-Control','no-store');
    res.setHeader('CDN-Cache-Control','no-store');
    res.setHeader('Vary','Cookie');
    res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'");
    try{
      const c=config(),url=new URL(req.url,'http://internal');
      const action=req.query?.action??url.searchParams.get('action')??'',asset=req.query?.asset??url.searchParams.get('asset');
      if(!auth.configured(c.hash,c.secret))return await loginPage(req,res,503,'Business access is not configured yet. Please contact a founder.');
      const authenticated=auth.validSession(auth.readSession(req.headers.cookie,c.secure),c.hash,c.secret,now());
      if(req.method==='POST'){
        if(!['login','logout'].includes(action)||asset)return send(req,res,405,'Method not allowed.','text/plain; charset=utf-8');
        if(!sameOrigin(req,c.secure))return send(req,res,403,'Please submit the form from this website.','text/plain; charset=utf-8');
        if(action==='logout'){
          res.setHeader('Set-Cookie',auth.sessionCookie('',c.secure));
          res.setHeader('Clear-Site-Data','"cache"');
          return redirect(req,res,'/business/login');
        }
        const ip=String(req.headers['x-real-ip']||req.socket?.remoteAddress||'unknown');
        const recent=(attempts.get(ip)||[]).filter(t=>now()-t<600000);
        if(recent.length>=5){res.setHeader('Retry-After','600');return await loginPage(req,res,429,'Too many attempts. Please wait 10 minutes and try again.');}
        const value=await password(req);
        if(!await auth.verifyPassword(value,c.hash)){
          recent.push(now());if(attempts.size>10000)attempts.clear();attempts.set(ip,recent);
          return await loginPage(req,res,401,'That password is not correct. Please try again.');
        }
        attempts.delete(ip);
        res.setHeader('Set-Cookie',auth.sessionCookie(auth.issueSession(c.hash,c.secret,now()),c.secure));
        return redirect(req,res,'/business');
      }
      if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD, POST');return send(req,res,405,'Method not allowed.','text/plain; charset=utf-8');}
      if(action==='logout'){res.setHeader('Allow','POST');return send(req,res,405,'Use the sign-out button.','text/plain; charset=utf-8');}
      if(asset){
        if(!authenticated)return send(req,res,401,'Sign in to view this business content.','text/plain; charset=utf-8');
        if(!Object.hasOwn(files,asset))return send(req,res,404,'Not found.','text/plain; charset=utf-8');
        const [file,type]=files[asset];return send(req,res,200,await fs.readFile(path.join(privateDir,file)),type);
      }
      if(action==='session')return send(req,res,authenticated?204:401,'','text/plain; charset=utf-8');
      if(action==='login')return authenticated?redirect(req,res,'/business'):await loginPage(req,res);
      if(action)return send(req,res,404,'Not found.','text/plain; charset=utf-8');
      if(!authenticated)return redirect(req,res,'/business/login');
      return send(req,res,200,await fs.readFile(path.join(privateDir,'business.html')));
    }catch(error){
      const status=[413,415].includes(error.status)?error.status:500;
      send(req,res,status,status===500?'Business access is temporarily unavailable. Please try again.':'Please use the sign-in form.','text/plain; charset=utf-8');
    }
  };
}
module.exports=createHandler();
module.exports.createHandler=createHandler;
