'use client';
import {useState} from 'react';
import {Data,status,summary,balance,LT,iso,sun,dim} from '@/lib/calc';
type P={d:Data&{user:any};post:(r:string,b?:any)=>Promise<boolean>;go?:(v:string)=>void};
const TODAY=iso(new Date()),YM=TODAY.slice(0,7),ST=['Present','Absent','Half Day','WFH'];
const fmt=(n:number)=>'₹'+Math.round(n).toLocaleString('en-IN');
const Pill=({s}:{s:string})=><span className={'pill '+s.replace(/\s/g,'').toLowerCase()}>{s}</span>;
const Stat=({l,v,hl,on}:{l:string;v:any;hl?:boolean;on?:()=>void})=><div className={'stat'+(hl?' hl':'')+(on?' click':'')} onClick={on} tabIndex={on?0:undefined} onKeyDown={e=>e.key==='Enter'&&on?.()}><small>{l}</small><b>{v}</b></div>;
const T=({h,rows}:{h:string[];rows:any[][]})=><div className="card tw"><table><thead><tr>{h.map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.length?rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>):<tr><td colSpan={h.length}>Nothing to show yet.</td></tr>}</tbody></table></div>;
const isStaff=(d:P['d'])=>d.user.role!=='employee';
const sp=(s:string)=>['Present','Absent','Half Day','WFH','Leave','Unpaid Leave'].includes(s)?<Pill s={s}/>:<Pill s={s||'Not marked'}/>;

export function Dashboard({d,go,post}:P){
 const [k,setK]=useState<string|null>(null),[ne,setNe]=useState<any>(null);
 const staff=isStaff(d),me=d.user.emp||'',act=d.emp.filter(e=>e.status!=='Inactive'),st=(id:string)=>status(d,id,TODAY),pm=d.pay.filter(p=>p.ym===YM);
 const pres=act.filter(e=>['Present','WFH','Half Day'].includes(st(e.id))),abs=act.filter(e=>st(e.id)==='Absent'),lv=(s:string)=>d.leaves.filter(l=>l.status===s).length,s=summary(d,me,YM);
 const allDays=Array.from({length:dim(YM)},(_,i)=>`${YM}-${String(i+1).padStart(2,'0')}`).filter(x=>!sun(x));
 const ar=(es:any[])=>es.map(e=>[e.name,e.dept,sp(st(e.id)),d.att[TODAY]?.[e.id]?.in||'-',d.att[TODAY]?.[e.id]?.out||'-']);
 const lr=(ls:any[])=>ls.map(l=>[d.emp.find(e=>e.id===l.emp)?.name||l.emp,l.type,l.from,l.to,l.days,<Pill s={l.status}/>]);
 let title='',h:string[]=[],rows:any[][]=[],page='';
 if(k==='all'){title='All employees';h=['ID','Name','Department','Status'];rows=d.emp.map(e=>[e.id,e.name,e.dept,<Pill s={e.status}/>]);page='employees'}
 else if(k==='P'||k==='A'){title=(k==='P'?'Present':'Absent')+' today';h=['Employee','Department','Status','Check-in','Check-out'];rows=ar(k==='P'?pres:abs);page='attendance'}
 else if(k==='pend'||k==='appr'||k?.startsWith('lt:')){title=k==='pend'?'Pending leave requests':k==='appr'?'Approved and rejected leaves':k.slice(3)+' leave history';h=['Employee','Type','From','To','Days','Status'];rows=lr(d.leaves.filter(l=>k==='pend'?l.status==='Pending':k==='appr'?l.status!=='Pending':l.type===k.slice(3)));page='leaves'}
 else if(k==='pay'){title='Payroll '+YM;h=['Employee','Payable days','Net salary','Status'];rows=pm.map(p=>[p.name,`${p.payable} / ${p.wd}`,fmt(p.net),<Pill s={p.status}/>]);page='payroll'}
 else if(k?.startsWith('e:')){const m=k.slice(2),w:any={P:['Present','WFH'],A:['Absent',''],H:['Half Day'],L:['Leave','Unpaid Leave']}[m];title='My attendance – '+YM;h=['Date','Status','Check-in','Check-out'];rows=allDays.filter(x=>m==='all'||(x<=TODAY&&w.includes(status(d,me,x)))).map(x=>[x,sp(status(d,me,x)),d.att[x]?.[me]?.in||'-',d.att[x]?.[me]?.out||'-']);page='attendance'}
 return <>
  {staff&&<div className="bar"><button className="btn" onClick={()=>setNe(NEWEMP)}>+ Add employee</button>{d.user.role==='admin'&&<button className="btn ghost" onClick={()=>go?.('users')}>+ Add login user</button>}</div>}
  {staff?<div className="cards"><Stat l="Total employees" v={d.emp.length} on={()=>setK('all')}/><Stat l="Present today" v={pres.length} hl on={()=>setK('P')}/><Stat l="Absent today" v={abs.length} on={()=>setK('A')}/><Stat l="Pending leaves" v={lv('Pending')} on={()=>setK('pend')}/><Stat l="Approved / rejected" v={`${lv('Approved')} / ${lv('Rejected')}`} on={()=>setK('appr')}/><Stat l={'Payroll '+YM} v={pm.length?(pm.every(p=>p.status==='Paid')?'Paid':'Generated'):'Not run'} on={()=>setK('pay')}/></div>
  :<div className="cards"><Stat l="Working days" v={s.wd} on={()=>setK('e:all')}/><Stat l="Present" v={s.P} hl on={()=>setK('e:P')}/><Stat l="Absent" v={s.A} on={()=>setK('e:A')}/><Stat l="Half days" v={s.H} on={()=>setK('e:H')}/><Stat l="Leave days" v={s.L+s.U} on={()=>setK('e:L')}/></div>}
  {ne&&<EmpModal f={ne} setF={setNe} post={post} admin={d.user.role==='admin'}/>}
  {k&&<div id="modal" onClick={e=>e.target===e.currentTarget&&setK(null)}><div className="mbox"><h3>{title}</h3><T h={h} rows={rows}/><div><button className="btn" onClick={()=>{setK(null);go?.(page)}}>Open {page} page</button> <button className="btn ghost" onClick={()=>setK(null)}>Close</button></div></div></div>}</>;
}

const NEWEMP={status:'Active',basic:30000,allow:2000,od:0,join:TODAY};
function EmpModal({f,setF,post,admin}:{f:any;setF:(x:any)=>void;post:P['post'];admin:boolean}){
 const F:[string,string,string][]=[['name','Full name','text'],['email','Email','email'],['phone','Phone','tel'],['dept','Department','text'],['desig','Designation','text'],['join','Joining date','date'],['basic','Basic salary (₹ per month)','number'],['allow','Allowances (₹)','number'],['od','Other deductions (₹)','number']];
 return <div id="modal"><form className="mbox grid2" onSubmit={async ev=>{ev.preventDefault();if(await post('emp',f))setF(null)}}>
  <h3 className="full">{f.id?'Edit '+f.id:'Add employee'}</h3>
  {F.map(([k,l,t])=><label key={k}>{l}<input type={t} required={!['allow','od'].includes(k)} min={t==='number'?0:undefined} max={k==='join'?TODAY:undefined} value={f[k]??''} onChange={e=>setF({...f,[k]:t==='number'?+e.target.value:e.target.value})}/></label>)}
  <label>Status<select value={f.status} onChange={e=>setF({...f,status:e.target.value})}>{['Active','Inactive','On Leave'].map(s=><option key={s}>{s}</option>)}</select></label>
  {!f.id&&admin&&<><div className="full"><small>Optional – give this person a login so they can sign in as Employee</small></div>
   <label>Login username<input value={f.lu??''} onChange={e=>setF({...f,lu:e.target.value})}/></label><label>Login password (min 6 characters)<input type="password" minLength={6} value={f.lp??''} onChange={e=>setF({...f,lp:e.target.value})}/></label></>}
  <div className="full"><button className="btn">Save employee</button> <button type="button" className="btn ghost" onClick={()=>setF(null)}>Cancel</button></div></form></div>;
}
export function Employees({d,post}:P){
 const [q,setQ]=useState(''),[f,setF]=useState<any>(null);
 const rows=d.emp.filter(e=>(e.name+e.id+e.dept).toLowerCase().includes(q.toLowerCase()));
 return <>
  <div className="bar"><label>Search<input value={q} placeholder="Name, ID, department" onChange={e=>setQ(e.target.value)}/></label><button className="btn" onClick={()=>setF(NEWEMP)}>+ Add employee</button></div>
  <T h={['ID','Employee','Department','Designation','Joined','Status','Basic','']} rows={rows.map(e=>[e.id,<><b>{e.name}</b><br/><small>{e.email}</small></>,e.dept,e.desig,e.join,<Pill s={e.status}/>,fmt(e.basic),<button className="btn sm ghost" onClick={()=>setF(e)}>Edit</button>])}/>
  {f&&<EmpModal f={f} setF={setF} post={post} admin={d.user.role==='admin'}/>}</>;
}
export function Users({d,post}:P){
 const [f,setF]=useState<any>({role:'hr',emp:''}),us:any[]=(d as any).users||[];
 return <><div className="card pad"><h3>Add login user</h3><form className="grid2" onSubmit={async e=>{e.preventDefault();if(await post('user',{action:'add',...f}))setF({role:'hr',emp:''})}}>
  {[['name','Display name','text'],['u','Username','text'],['p','Password (min 6 characters)','password']].map(([k,l,t])=><label key={k}>{l}<input type={t} required minLength={k==='p'?6:undefined} value={f[k]??''} onChange={e=>setF({...f,[k]:e.target.value})}/></label>)}
  <label>Role<select value={f.role} onChange={e=>setF({...f,role:e.target.value})}>{['hr','employee','admin'].map(r=><option key={r}>{r}</option>)}</select></label>
  <label>Linked employee (for employee role)<select value={f.emp} onChange={e=>setF({...f,emp:e.target.value})}><option value="">None</option>{d.emp.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
  <div className="full"><button className="btn">Create user</button></div></form></div>
  <T h={['Name','Username','Role','Employee','']} rows={us.map(x=>[x.name,x.u,x.role,x.emp||'-',x.u===d.user.u?null:<button className="btn sm red" onClick={()=>post('user',{action:'del',u:x.u})}>Remove</button>])}/></>;
}
export function Attendance({d,post}:P){
 const [date,setDate]=useState(TODAY),[ym,setYm]=useState(YM);
 if(!isStaff(d)){const id=d.user.emp,s=summary(d,id,ym),days=Array.from({length:dim(ym)},(_,i)=>`${ym}-${String(i+1).padStart(2,'0')}`);
  return <><div className="bar"><label>Month<input type="month" value={ym} max={YM} onChange={e=>setYm(e.target.value)}/></label></div>
   <div className="cards"><Stat l="Working days" v={s.wd}/><Stat l="Present" v={s.P} hl/><Stat l="Absent" v={s.A}/><Stat l="Half days" v={s.H}/><Stat l="Leave days" v={s.L+s.U}/></div>
   <T h={['Date','Status','Check-in','Check-out']} rows={days.map(k=>[k,sun(k)?<Pill s="Weekly off"/>:sp(status(d,id,k)),d.att[k]?.[id]?.in||'-',d.att[k]?.[id]?.out||'-'])}/></>}
 const set=(id:string,k:string,v:string)=>post('att',{date,id,k,v});
 return <><div className="bar"><label>Date<input type="date" value={date} max={TODAY} onChange={e=>setDate(e.target.value)}/></label><button className="btn" onClick={()=>d.emp.filter(e=>e.status==='Active').forEach(e=>{set(e.id,'s','Present');set(e.id,'in','09:30');set(e.id,'out','18:00')})}>Mark all present</button><small>{sun(date)?'Sunday is a weekly off.':'Changes save as you make them.'}</small></div>
  <T h={['ID','Employee','Status','Check-in','Check-out']} rows={d.emp.filter(e=>e.status!=='Inactive').map(e=>{const a=d.att[date]?.[e.id];return[e.id,e.name,
   <select key={date+e.id+a?.s} defaultValue={a?.s||''} onChange={x=>set(e.id,'s',x.target.value)}><option value="">Not marked</option>{ST.map(s=><option key={s}>{s}</option>)}</select>,
   <input key={'i'+date+e.id+a?.in} type="time" defaultValue={a?.in||''} onChange={x=>set(e.id,'in',x.target.value)}/>,<input key={'o'+date+e.id+a?.out} type="time" defaultValue={a?.out||''} onChange={x=>set(e.id,'out',x.target.value)}/>]})}/></>;
}

export function Reports({d}:P){
 const [t,setT]=useState('daily'),[date,setDate]=useState(TODAY),[ym,setYm]=useState(YM),[id,setId]=useState(d.emp[0]?.id);
 return <><div className="bar"><label>Report<select value={t} onChange={e=>setT(e.target.value)}><option value="daily">Daily attendance</option><option value="monthly">Monthly summary</option><option value="emp">Employee history</option></select></label>
  {t==='daily'?<label>Date<input type="date" max={TODAY} value={date} onChange={e=>setDate(e.target.value)}/></label>:<label>Month<input type="month" max={YM} value={ym} onChange={e=>setYm(e.target.value)}/></label>}
  {t==='emp'&&<label>Employee<select value={id} onChange={e=>setId(e.target.value)}>{d.emp.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>}</div>
  {t==='daily'&&<T h={['ID','Name','Department','Status','Check-in','Check-out']} rows={d.emp.map(e=>[e.id,e.name,e.dept,sp(status(d,e.id,date)),d.att[date]?.[e.id]?.in||'-',d.att[date]?.[e.id]?.out||'-'])}/>}
  {t==='monthly'&&<T h={['ID','Name','Working days','Present','Absent','Half days','Paid leave','Unpaid leave']} rows={d.emp.map(e=>{const s=summary(d,e.id,ym);return[e.id,e.name,s.wd,s.P,s.A,s.H,s.L,s.U]})}/>}
  {t==='emp'&&<T h={['Date','Status','Check-in','Check-out']} rows={Array.from({length:dim(ym)},(_,i)=>`${ym}-${String(i+1).padStart(2,'0')}`).map(k=>[k,sun(k)?<Pill s="Weekly off"/>:sp(status(d,id,k)),d.att[k]?.[id]?.in||'-',d.att[k]?.[id]?.out||'-'])}/>}</>;
}

export function Leaves({d,post}:P){
 const staff=isStaff(d),[f,setF]=useState<any>({type:'Casual',emp:d.emp[0]?.id}),eid=staff?f.emp:d.user.emp,b=balance(d,eid,YM.slice(0,4));
 return <><div className="cards">{['Casual','Sick','Earned'].map(t=><Stat key={t} l={t+' leave left'} v={`${LT[t].n-b[t]} / ${LT[t].n}`}/>)}</div>
  <div className="card pad"><h3>Apply for leave</h3><form className="grid2" onSubmit={async e=>{e.preventDefault();await post('leave',{action:'apply',...f})}}>
   {staff&&<label>Employee<select value={f.emp} onChange={e=>setF({...f,emp:e.target.value})}>{d.emp.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>}
   <label>Leave type<select value={f.type} onChange={e=>setF({...f,type:e.target.value})}>{Object.keys(LT).map(t=><option key={t}>{t}</option>)}</select></label>
   <label>Start date<input type="date" required onChange={e=>setF({...f,from:e.target.value})}/></label><label>End date<input type="date" required onChange={e=>setF({...f,to:e.target.value})}/></label>
   <label className="full">Reason<input required onChange={e=>setF({...f,reason:e.target.value})}/></label><div className="full"><button className="btn">Submit request</button></div></form></div>
  <T h={['Employee','Type','From','To','Days','Reason','Status','']} rows={[...d.leaves].reverse().map(l=>[d.emp.find(e=>e.id===l.emp)?.name||l.emp,l.type,l.from,l.to,l.days,l.reason,<Pill s={l.status}/>,
   l.status==='Pending'?(staff?<><button className="btn sm" onClick={()=>post('leave',{action:'decide',id:l.id,s:'Approved'})}>Approve</button> <button className="btn sm red" onClick={()=>post('leave',{action:'decide',id:l.id,s:'Rejected'})}>Reject</button></>:<button className="btn sm red" onClick={()=>post('leave',{action:'withdraw',id:l.id})}>Withdraw</button>):null])}/></>;
}

export function Payroll({d,post}:P){
 const staff=isStaff(d),[ym,setYm]=useState(YM),[s,setS]=useState<any>(null),rec=d.pay.filter(p=>p.ym===ym),sum=(k:string)=>rec.reduce((a:number,p:any)=>a+p[k],0),months=[...new Set(d.pay.map(p=>p.ym))].sort().reverse();
 const row=(a:string,b:any)=><><span>{a}</span><b>{b}</b></>;
 return <><div className="bar"><label>Payroll month<input type="month" value={ym} onChange={e=>setYm(e.target.value)}/></label>{staff&&<><button className="btn" onClick={()=>post('pay',{action:'gen',ym})}>Generate payroll</button><small>Finalize attendance and approve leaves first.</small></>}</div>
  <div className="cards"><Stat l="Employees" v={rec.length}/><Stat l="Gross earnings" v={fmt(sum('earned'))}/><Stat l="Deductions" v={fmt(sum('ded'))}/><Stat l="Net payable" v={fmt(sum('net'))} hl/></div>
  <T h={['Employee','Payable days','Gross','Deductions','Net salary','Status','']} rows={rec.map(p=>[p.name,`${p.payable} / ${p.wd}`,fmt(p.earned),fmt(p.ded),<b>{fmt(p.net)}</b>,<Pill s={p.status}/>,<button className="btn sm ghost" onClick={()=>setS(p)}>Details</button>])}/>
  <h3>Payroll history</h3><T h={['Month','Records','Net paid out']} rows={months.map(m=>[m,d.pay.filter(p=>p.ym===m).length,fmt(d.pay.filter(p=>p.ym===m).reduce((a,p)=>a+p.net,0))])}/>
  {s&&<div id="modal" onClick={e=>e.target===e.currentTarget&&setS(null)}><div className="mbox"><h3>{s.name} – {s.ym}</h3><div className="kv">
   {row('Working days',s.wd)}{row('Present / half / paid leave / unpaid leave / absent',`${s.P} / ${s.H} / ${s.L} / ${s.U} / ${s.A}`)}{row('Payable days',s.payable)}{row('Basic',fmt(s.basic))}{row('HRA (40% of basic)',fmt(s.hra))}{row('Allowances',fmt(s.allow))}{row('Earned for payable days',fmt(s.earned))}{row('Provident fund (12% of basic)','− '+fmt(s.pf))}{row('Tax (5% above ₹50,000)','− '+fmt(s.tax))}{row('Other deductions','− '+fmt(s.od))}{row('Adjustment',fmt(s.adj))}{row('Net payable',fmt(s.net))}</div>
   <div><button className="btn ghost" onClick={()=>window.print()}>Print</button> {staff&&s.status!=='Paid'&&<><button className="btn ghost" onClick={async()=>{const v=prompt('Adjustment in ₹ (positive = bonus, negative = extra deduction)','0');if(v!==null&&await post('pay',{action:'adjust',id:s.id,adj:v}))setS(null)}}>Add adjustment</button> <button className="btn" onClick={async()=>{if(await post('pay',{action:'paid',id:s.id}))setS(null)}}>Mark as paid</button></>} <button className="btn ghost" onClick={()=>setS(null)}>Close</button></div></div></div>}</>;
}
