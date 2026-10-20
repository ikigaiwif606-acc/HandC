'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {scryptSync,randomBytes}=require('node:crypto');
const fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const auth=require('../business-summary/private/auth.cjs');
const {createHandler}=require('../business-summary/api/business.js');
const salt=randomBytes(16).toString('hex'),password='test-only-founders-password',secret=randomBytes(32).toString('base64url');
const hash='scrypt-v1$'+salt+'$'+scryptSync(password,salt,64).toString('hex');
const settings={passwordHash:hash,sessionSecret:secret,secure:true};
async function request(handler,url='/api/business',options={}){
  const req={url,method:options.method||'GET',headers:{host:'studio.example',...(options.headers||{})},query:options.query,body:options.body,socket:{remoteAddress:'test-address'}};
  const res={headers:{},setHeader(name,value){this.headers[name.toLowerCase()]=value;},end(body){this.body=body?.toString()||'';}};
  await handler(req,res);return res;
}
const form=(value=password)=>({method:'POST',headers:{origin:'https://studio.example','content-type':'application/x-www-form-urlencoded'},body:{password:value}});
async function login(handler){const result=await request(handler,'/api/business?action=login',form());assert.equal(result.statusCode,303);return result.headers['set-cookie'].split(';')[0];}

test('signed-out visitors see login, never the business page or financial assets',async()=>{
  const h=createHandler(settings),page=await request(h);
  assert.equal(page.statusCode,303);assert.equal(page.headers.location,'/business/login');
  for(const asset of ['finance-model.js','financials.js','financials.css','business-page.js']){
    const result=await request(h,'/api/business?asset='+asset);assert.equal(result.statusCode,401);assert.doesNotMatch(result.body,/448800|financeKpis|recommendedFunding/);assert.match(result.headers['cache-control'],/no-store/);
  }
  const screen=await request(h,'/api/business?action=login');assert.equal(screen.statusCode,200);assert.match(screen.body,/Business sign in/);assert.doesNotMatch(screen.body,/RM500|RM66|financeApp/);
});
test('password verification issues a secure expiring session and protects the full page',async()=>{
  const h=createHandler(settings),cookie=await login(h);
  const page=await request(h,'/api/business',{headers:{cookie}});
  assert.equal(page.statusCode,200);assert.match(page.body,/id="overview"/);assert.match(page.body,/id="financials"/);assert.match(page.body,/id="improvements"/);
  const js=await request(h,'/api/business?asset=finance-model.js',{headers:{cookie}});assert.equal(js.statusCode,200);assert.match(js.body,/recommendedFunding/);
  const response=await request(createHandler(settings),'/api/business?action=login',form());
  for(const value of ['__Host-handc_business=','HttpOnly','Secure','SameSite=Lax','Max-Age=28800','Path=/'])assert.ok(response.headers['set-cookie'].includes(value));
  assert.match(page.headers['content-security-policy'],/frame-ancestors 'none'/);
  assert.equal(page.headers['referrer-policy'],'same-origin');
});
test('wrong passwords, fabricated cookies and modified session tokens are rejected',async()=>{
  const h=createHandler(settings),bad=await request(h,'/api/business?action=login',form('wrong'));
  assert.equal(bad.statusCode,401);assert.equal(bad.headers['set-cookie'],undefined);assert.match(bad.body,/not correct/);
  const cookie=await login(h),token=cookie.slice(cookie.indexOf('=')+1),[payload,signature]=token.split('.');
  const changed=(signature[0]==='a'?'b':'a')+signature.slice(1);
  for(const value of ['true',payload+'.'+changed,'eyJ2IjoxfQ.fake']){
    assert.equal((await request(h,'/api/business?action=session',{headers:{cookie:auth.COOKIE+'='+value}})).statusCode,401);
  }
});
test('sessions expire and password or signing-key rotation invalidates existing sessions',()=>{
  const time=Date.now(),token=auth.issueSession(hash,secret,time);
  assert.equal(auth.validSession(token,hash,secret,time),true);
  assert.equal(auth.validSession(token,hash,secret,time+auth.SESSION_SECONDS*1000),false);
  assert.equal(auth.validSession(token,hash,secret+'changed',time),false);
  assert.equal(auth.validSession(token,hash.replace('scrypt-v1$','scrypt-v1$aa'),secret,time),false);
  assert.equal(auth.readSession(auth.COOKIE+'='+token+'; '+auth.COOKIE+'='+token),'');
});
test('cross-origin login and logout are refused, and logout clears the cookie',async()=>{
  const h=createHandler(settings),cookie=await login(h);
  for(const action of ['login','logout']){
    const options=form();options.headers.origin='https://other.example';options.headers.cookie=cookie;
    assert.equal((await request(h,'/api/business?action='+action,options)).statusCode,403);
    assert.equal((await request(h,'/api/business?action='+action,{method:'POST',body:{password}})).statusCode,403);
  }
  assert.equal((await request(h,'/api/business?action=logout')).statusCode,405);
  const out=await request(h,'/api/business?action=logout',{method:'POST',headers:{origin:'https://studio.example',cookie}});
  assert.equal(out.statusCode,303);assert.equal(out.headers.location,'/business/login');assert.match(out.headers['set-cookie'],/Max-Age=0/);
  assert.equal((await request(h,'/api/business?action=session')).statusCode,401);
});
test('missing server configuration fails closed; unrecognized assets cannot read server files',async()=>{
  const off=createHandler({passwordHash:'',sessionSecret:''});
  for(const url of ['/api/business','/api/business?asset=financials.js'])assert.equal((await request(off,url)).statusCode,503);
  const h=createHandler(settings),cookie=await login(h);
  for(const asset of ['../auth.cjs','business.html','constructor','__proto__'])assert.equal((await request(h,'/api/business?asset='+encodeURIComponent(asset),{headers:{cookie}})).statusCode,404);
  const rewritten=await request(h,'/business/login',{query:{action:'login'}});assert.match(rewritten.body,/Business sign in/);
});
test('repeated failed logins are throttled and oversized or non-form requests are refused',async()=>{
  const h=createHandler(settings);
  for(let i=0;i<5;i++)assert.equal((await request(h,'/api/business?action=login',form('wrong'))).statusCode,401);
  const blocked=await request(h,'/api/business?action=login',form());assert.equal(blocked.statusCode,429);assert.equal(blocked.headers['retry-after'],'600');
  const other=createHandler(settings),large=form();large.headers['content-length']='5000';assert.equal((await request(other,'/api/business?action=login',large)).statusCode,413);
  const json=form();json.headers['content-type']='application/json';assert.equal((await request(other,'/api/business?action=login',json)).statusCode,415);
});
test('the deployment publishes only studio files and excludes private business sources',()=>{
  const root=path.join(__dirname,'../business-summary');execFileSync(process.execPath,[path.join(root,'build.cjs')]);
  const out=path.join(root,'public');
  for(const name of ['private','api','business.html','login.html','finance-model.js','financials.js','financials.css','README.md','dev-server.cjs'])assert.equal(fs.existsSync(path.join(out,name)),false,name);
  const html=fs.readFileSync(path.join(out,'index.html'),'utf8');
  assert.match(html,/href="\/business"/);assert.doesNotMatch(html,/financeApp|finance-model\.js|financials\.js|RM500|RM448|id="financials"|id="improvements"/);
  assert.equal(fs.existsSync(path.join(out,'assets/raja_uda_wellness_concept_plan_rev02.pdf')),true);
});
