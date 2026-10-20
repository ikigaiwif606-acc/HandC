const {mkdirSync,copyFileSync,cpSync,rmSync}=require('node:fs');
const path=require('node:path');
const out=path.join(__dirname,'public');
// Publish an allowlist. Private HTML, calculations and server code are never static files.
rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
for(const name of ['index.html','site.css','wellness.css','business.css','page-controls.js','floor-plan.css','floor-plan.js'])copyFileSync(path.join(__dirname,name),path.join(out,name));
cpSync(path.join(__dirname,'assets'),path.join(out,'assets'),{recursive:true});
console.log('Built public studio files. Business content remains server-only.');
