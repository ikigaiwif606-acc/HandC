'use strict';
const {createHmac,createHash,timingSafeEqual,randomBytes,scrypt}=require('node:crypto');
const {promisify}=require('node:util');
const derive=promisify(scrypt);
const SESSION_SECONDS=8*60*60;
const COOKIE='__Host-handc_business';
const LOCAL_COOKIE='handc_business_local';
function equal(a,b){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
function configured(hash,secret){return /^scrypt-v1\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(hash||'')&&typeof secret==='string'&&secret.length>=32;}
async function verifyPassword(password,hash){
  if(typeof password!=='string'||password.length>256||!password.length)return false;
  const [,salt,expected]=hash.split('$');
  return equal(await derive(password,salt,64),Buffer.from(expected,'hex'));
}
function version(hash){return createHash('sha256').update(hash).digest('hex').slice(0,32);}
function sign(payload,secret){return createHmac('sha256',secret).update('handc-business-v1.'+payload).digest('base64url');}
function issueSession(hash,secret,now=Date.now()){
  const issued=Math.floor(now/1000);
  const payload=Buffer.from(JSON.stringify({v:1,issued,expires:issued+SESSION_SECONDS,credential:version(hash),nonce:randomBytes(16).toString('hex')})).toString('base64url');
  return payload+'.'+sign(payload,secret);
}
function validSession(token,hash,secret,now=Date.now()){
  if(typeof token!=='string'||token.length>1024||!/^[-\w]+\.[-\w]+$/.test(token))return false;
  const [payload,signature]=token.split('.');
  if(!equal(signature,sign(payload,secret)))return false;
  try{
    const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8')),seconds=Math.floor(now/1000);
    return data.v===1&&data.credential===version(hash)&&Number.isInteger(data.issued)&&Number.isInteger(data.expires)&&data.issued<=seconds+60&&data.expires>seconds&&data.expires-data.issued===SESSION_SECONDS;
  }catch(_){return false;}
}
function readSession(header,secure=true){
  const name=secure?COOKIE:LOCAL_COOKIE;
  const cookies=String(header||'').split(';').map(s=>s.trim());
  const matches=cookies.filter(s=>s.startsWith(name+'='));
  return matches.length===1?matches[0].slice(name.length+1):'';
}
function sessionCookie(token,secure=true){return `${secure?COOKIE:LOCAL_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token?SESSION_SECONDS:0}${secure?'; Secure':''}`;}
module.exports={COOKIE,SESSION_SECONDS,configured,verifyPassword,issueSession,validSession,readSession,sessionCookie};
