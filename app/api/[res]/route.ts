import {NextRequest,NextResponse} from 'next/server';
import {load,save} from '@/lib/db';import {calc,ldays,balance,LT,iso} from '@/lib/calc';import {sign,unsign,hash,check} from '@/lib/auth';
const me=(r:NextRequest)=>unsign(r.cookies.get('pp')?.value);
const setSession=(o:NextResponse,x:any)=>o.cookies.set('pp',sign({u:x.u,role:x.role,name:x.name,emp:x.emp}),{httpOnly:true,path:'/',sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:60*60*24*7});
const bad=(error:string,status=400)=>NextResponse.json({error},{status});
const ok=(msg?:string)=>NextResponse.json({ok:1,msg});
// GET /api/data -> everything the signed-in user is allowed to see
async function getData(r:NextRequest){const u=me(r);if(!u)return bad('Not signed in',401);const {users,...x}=await load();
 if(u.role==='employee'){x.emp=x.emp.filter(e=>e.id===u.emp);x.leaves=x.leaves.filter(l=>l.emp===u.emp);x.pay=x.pay.filter(p=>p.emp===u.emp);x.att=Object.fromEntries(Object.entries(x.att).map(([k,v])=>[k,v[u.emp]?{[u.emp]:v[u.emp]}:{}]))}
 return NextResponse.json({user:u,...x,users:u.role==='admin'?users.map(({p,...r})=>r):undefined})}
async function handle(r:NextRequest,{params}:{params:{res:string}}){
 const b=await r.json().catch(()=>({})),res=params.res,db=await load();
 if(res==='login'){const uu=String(b.u||'').trim(),x=db.users.find(k=>k.u===uu||k.u===uu.toLowerCase());if(!x||!check(String(b.p||''),x.p))return bad('Wrong email/username or password',401);const o=ok();setSession(o,x);return o}
 if(res==='signup'){const name=String(b.name||'').trim(),email=String(b.email||'').trim().toLowerCase(),pw=String(b.p||'');
  if(name.length<2)return bad('Please enter your full name');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return bad('Please enter a valid email');if(pw.length<6)return bad('Password must be at least 6 characters');
  if(db.users.some(k=>k.u===email)||db.emp.some(e=>e.email.toLowerCase()===email))return bad('An account with this email already exists');
  const id='EMP'+String(Math.max(0,...db.emp.map(e=>+e.id.slice(3)||0))+1).padStart(3,'0');
  db.emp.push({id,name,email,phone:'',dept:'Unassigned',desig:'Employee',join:iso(new Date()),status:'Active',basic:0,allow:0,od:0});
  const x={u:email,p:hash(pw),role:'employee',name,emp:id};db.users.push(x);await save(db);const o=ok('Welcome, '+name+'!');setSession(o,x);return o}
 if(res==='logout'){const o=ok();o.cookies.delete('pp');return o}
 const u=me(r);if(!u)return bad('Not signed in',401);const staff=u.role!=='employee',YM=iso(new Date()).slice(0,7);
 if(res==='leave'){
  if(b.action==='apply'){const emp=staff?b.emp:u.emp;if(!b.from||!b.to||b.to<b.from)return bad('End date cannot be before start date');const days=ldays(b.from,b.to);if(!days)return bad('Those dates are weekly offs only');
   if(db.leaves.some(l=>l.emp===emp&&l.status!=='Rejected'&&l.from<=b.to&&b.from<=l.to))return bad('Dates overlap with another leave request');
   if(LT[b.type].paid&&balance(db,emp,b.from.slice(0,4))[b.type]+days>LT[b.type].n)return bad('Not enough '+b.type+' leave balance');
   db.leaves.push({id:'L'+Date.now(),emp,type:b.type,from:b.from,to:b.to,days,reason:b.reason||'',status:'Pending'});await save(db);return ok('Leave request submitted')}
  const l=db.leaves.find(x=>x.id===b.id);if(!l)return bad('Not found',404);
  if(b.action==='withdraw'&&(staff||l.emp===u.emp)&&l.status==='Pending'){db.leaves=db.leaves.filter(x=>x.id!==b.id);await save(db);return ok('Request withdrawn')}
  if(b.action==='decide'&&staff){l.status=b.s;await save(db);return ok('Leave '+b.s.toLowerCase())}
  return bad('Not allowed',403)}
 if(!staff)return bad('Not allowed',403);
 if(res==='user'){if(u.role!=='admin')return bad('Only admin can manage users',403);
  if(b.action==='add'){if(!b.u||!b.p||b.p.length<6)return bad('Username and a 6+ character password are required');if(db.users.some(x=>x.u===b.u))return bad('That username is taken');if(b.role==='employee'&&!b.emp)return bad('Link an employee to this user');db.users.push({u:b.u,p:hash(b.p),role:b.role,name:b.name,emp:b.emp||undefined});await save(db);return ok('User created')}
  if(b.action==='del'&&b.u!==u.u){db.users=db.users.filter(x=>x.u!==b.u);await save(db);return ok('User removed')}return bad('Not allowed',403)}
 if(res==='emp'){const {lu,lp,...e}=b;if(!e.name||!e.email)return bad('Name and email are required');if(lu&&db.users.some(x=>x.u===lu))return bad('That login username is taken');
  if(e.id){Object.assign(db.emp.find(x=>x.id===e.id)||{},e)}else{e.id='EMP'+String(db.emp.length+1).padStart(3,'0');db.emp.push(e);if(u.role==='admin'&&lu&&lp)db.users.push({u:lu,p:hash(lp),role:'employee',name:e.name,emp:e.id})}
  await save(db);return ok('Employee saved')}
 if(res==='att'){db.att[b.date]??={};const a=(db.att[b.date][b.id]??={s:''});a[b.k]=b.v;await save(db);return ok()}
 if(res==='pay'){
  if(b.action==='gen'){if(b.ym>YM)return bad('Cannot run payroll for a future month');let n=0;db.emp.filter(e=>e.status!=='Inactive').forEach(e=>{const old=db.pay.find(p=>p.ym===b.ym&&p.emp===e.id);if(old?.status==='Paid')return;const c=calc(db,e,b.ym),rec={id:b.ym+'-'+e.id,ym:b.ym,emp:e.id,name:e.name,...c,status:'Generated'};if(old){rec.adj=old.adj;rec.net=Math.max(0,c.earned-c.ded+old.adj);db.pay[db.pay.indexOf(old)]=rec}else db.pay.push(rec);n++});await save(db);return ok('Payroll generated for '+n+' employees')}
  const p=db.pay.find(x=>x.id===b.id);if(!p)return bad('Not found',404);
  if(b.action==='paid'){p.status='Paid';await save(db);return ok('Marked as paid')}
  if(b.action==='adjust'){p.adj=+b.adj||0;p.net=Math.max(0,p.earned-p.ded+p.adj);await save(db);return ok('Adjustment saved')}}
 return bad('Unknown action',404)}

export async function GET(r:NextRequest){try{return await getData(r)}catch(e:any){return bad('Server error: '+(e?.message||e),500)}}
export async function POST(r:NextRequest,c:{params:{res:string}}){try{return await handle(r,c)}catch(e:any){return bad('Server error: '+(e?.message||e),500)}}
