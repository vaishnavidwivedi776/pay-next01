'use client';
import {useCallback,useEffect,useState} from 'react';
import {Dashboard,Employees,Attendance,Reports,Leaves,Payroll,Users} from '@/components/Views';
const NAV:Record<string,string[]>={admin:['dashboard','employees','attendance','reports','leaves','payroll','users'],hr:['dashboard','employees','attendance','reports','leaves','payroll'],employee:['dashboard','attendance','leaves','payroll']};
const VIEWS:Record<string,any>={dashboard:Dashboard,employees:Employees,attendance:Attendance,reports:Reports,leaves:Leaves,payroll:Payroll,users:Users};
const LABEL:Record<string,string>={dashboard:'Dashboard',employees:'Employees',attendance:'Attendance',reports:'Reports',leaves:'Leaves',payroll:'Payroll',users:'Users & roles'};
const SHOW_DEMO=process.env.NODE_ENV!=='production'||process.env.NEXT_PUBLIC_SHOW_DEMO==='1';
export default function Page(){
 const [d,setD]=useState<any>(undefined),[view,setView]=useState('dashboard'),[msg,setMsg]=useState(''),[u,setU]=useState(''),[p,setP]=useState(''),[name,setName]=useState(''),[mode,setMode]=useState('in');
 const load=useCallback(async()=>{const r=await fetch('/api/data');setD(r.ok?await r.json():null)},[]);
 useEffect(()=>{load()},[load]);
 const toast=(m:string)=>{setMsg(m);setTimeout(()=>setMsg(''),2600)};
 const post=async(res:string,body:any={})=>{const r=await fetch('/api/'+res,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok){toast(j.error||'Something went wrong');return false}await load();if(j.msg)toast(j.msg);return true};
 const Toast=<div id="toast" className={msg?'show':''}>{msg}</div>;
 if(d===undefined)return null;
 if(!d){const up=mode==='up';return(<><section id="login"><div className="lhero"><h1>Every day counted.<br/>Every rupee right.</h1><p>One place for your team's attendance, leaves and monthly payroll.</p></div>
  <form className="lbox" onSubmit={e=>{e.preventDefault();post(up?'signup':'login',up?{name,email:u,p}:{u,p})}}><h2>{up?'Create your account':'Sign in'}</h2>
  {up&&<label>Full name<input name="name" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required/></label>}
  <label>{up?'Email':'Email or username'}<input name="username" type={up?'email':'text'} autoComplete={up?'email':'username'} value={u} onChange={e=>setU(e.target.value)} required/></label>
  <label>Password{up&&' (min 6 characters)'}<input name="password" type="password" minLength={up?6:undefined} autoComplete={up?'new-password':'current-password'} value={p} onChange={e=>setP(e.target.value)} required/></label>
  <button className="btn wide">{up?'Sign up':'Sign in'}</button>
  <small>{up?'Already have an account? ':'New here? '}<a className="lk" onClick={()=>setMode(up?'in':'up')}>{up?'Sign in':'Create an account'}</a></small>
  {!up&&SHOW_DEMO&&<div className="demo"><small>Try a demo account</small>
  {[['Admin','admin','admin123'],['HR manager','hr','hr123'],['Employee','emp','emp123']].map(x=><button type="button" key={x[1]} className="btn ghost sm" onClick={()=>{setU(x[1]);setP(x[2])}}>{x[0]}</button>)}</div>}</form></section>{Toast}</>)}
 const V=VIEWS[view];
 return(<div id="app"><aside id="side"><div className="brand"><span>◈</span> PayPulse</div>
  {NAV[d.user.role].map(k=><a key={k} className={k===view?'on':''} onClick={()=>setView(k)}>{LABEL[k]}</a>)}
  <div className="sfoot"><a onClick={()=>post('logout')}>Sign out</a></div></aside>
  <div className="wrap"><header className="top"><h1>{LABEL[view]}</h1><div id="who"><b>{d.user.name}</b><small>{d.user.role}</small></div></header><main><V d={d} post={post} go={setView}/></main></div>{Toast}</div>);
}
