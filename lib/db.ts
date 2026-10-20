import fs from 'fs';import path from 'path';import {Data,iso} from './calc';
export type DB=Data&{users:{u:string;p:string;role:string;name:string;emp?:string}[]};
// Vercel's filesystem is read-only except /tmp (temporary). Use a real database for permanent data.
const FILE=process.env.VERCEL?'/tmp/paypulse-db.json':path.join(process.cwd(),'data','db.json');
function seed():DB{const L:[string,string,string,number][]=[['Aarav Sharma','Engineering','Full Stack Developer',45000],['Priya Verma','HR','HR Executive',38000],['Rohan Mehta','Sales','Sales Lead',42000],['Sneha Patel','Design','UI/UX Designer',40000],['Vikram Singh','Finance','Accountant',36000],['Ananya Gupta','Engineering','QA Engineer',34000]];
 const emp=L.map((x,i)=>({id:'EMP00'+(i+1),name:x[0],email:x[0].split(' ')[0].toLowerCase()+'@company.com',phone:'98270'+(10000+i*1111),dept:x[1],desig:x[2],join:'2024-0'+(i+1)+'-10',status:'Active',basic:x[3],allow:3000,od:200}));
 const att:DB['att']={};let n=7;for(let k=75;k>=1;k--){const d=new Date();d.setDate(d.getDate()-k);if(!d.getDay())continue;att[iso(d)]={};emp.forEach(e=>{n=(n*9301+49297)%233280;const r=n/233280;att[iso(d)][e.id]={s:r<.8?'Present':r<.88?'Absent':r<.94?'Half Day':'WFH',in:'09:15',out:'18:10'}})}
 const nd=(x:number)=>{const d=new Date();d.setDate(d.getDate()+x);return iso(d)};
 return{emp,att,pay:[],leaves:[{id:'L1',emp:'EMP003',type:'Casual',from:nd(3),to:nd(4),days:2,reason:'Family function',status:'Pending'}],
 users:[{u:'admin',p:process.env.ADMIN_PASSWORD||'admin123',role:'admin',name:'Admin'},...(process.env.NODE_ENV!=='production'||process.env.NEXT_PUBLIC_SHOW_DEMO==='1'?[{u:'hr',p:'hr123',role:'hr',name:'HR Manager'},{u:'emp',p:'emp123',role:'employee',name:'Aarav Sharma',emp:'EMP001'}]:[])]}}
let mem:DB|null=null; // fallback when the filesystem is read-only
// Permanent storage on Vercel: add an Upstash Redis integration (sets these env vars). Without it data is temporary.
const RU=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL,RT=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
const redis=async(cmd:any[])=>(await fetch(RU!,{method:'POST',headers:{Authorization:'Bearer '+RT,'Content-Type':'application/json'},body:JSON.stringify(cmd),cache:'no-store'})).json();
export async function load():Promise<DB>{
 if(RU&&RT){const r=await redis(['GET','paypulse_db']);if(r.result)return JSON.parse(r.result);const d=seed();await redis(['SET','paypulse_db',JSON.stringify(d)]);return d}
 try{if(!fs.existsSync(FILE)){fs.mkdirSync(path.dirname(FILE),{recursive:true});fs.writeFileSync(FILE,JSON.stringify(seed()))}return JSON.parse(fs.readFileSync(FILE,'utf8'))}catch{return mem??(mem=seed())}}
export async function save(d:DB){if(RU&&RT){await redis(['SET','paypulse_db',JSON.stringify(d)]);return}mem=d;try{fs.writeFileSync(FILE,JSON.stringify(d,null,1))}catch{}}
