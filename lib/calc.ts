export type Emp={id:string;name:string;email:string;phone:string;dept:string;desig:string;join:string;status:string;basic:number;allow:number;od:number};
export type Att={s:string;in?:string;out?:string};
export type Leave={id:string;emp:string;type:string;from:string;to:string;days:number;reason:string;status:string};
export type Pay={id:string;ym:string;emp:string;name:string;wd:number;P:number;A:number;H:number;L:number;U:number;payable:number;basic:number;hra:number;allow:number;gross:number;earned:number;pf:number;tax:number;od:number;ded:number;adj:number;net:number;status:string};
export type Data={emp:Emp[];att:Record<string,Record<string,Att>>;leaves:Leave[];pay:Pay[]};
// Leave policy – change here to match the client's rules
export const LT:Record<string,{n:number;paid:boolean}>={Casual:{n:12,paid:true},Sick:{n:10,paid:true},Earned:{n:15,paid:true},Unpaid:{n:99,paid:false}};
const pad=(n:number)=>String(n).padStart(2,'0');
export const iso=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const sun=(d:string)=>new Date(d+'T00:00').getDay()===0;
export const dim=(ym:string)=>new Date(+ym.slice(0,4),+ym.slice(5),0).getDate();
export function status(D:Data,id:string,d:string){const a=D.att[d]?.[id];if(a?.s)return a.s;const l=D.leaves.find(x=>x.emp===id&&x.status==='Approved'&&x.from<=d&&d<=x.to);return l?(LT[l.type].paid?'Leave':'Unpaid Leave'):''}
export function summary(D:Data,id:string,ym:string){const r={wd:0,P:0,A:0,H:0,L:0,U:0};for(let i=1;i<=dim(ym);i++){const d=`${ym}-${pad(i)}`;if(sun(d))continue;r.wd++;const s=status(D,id,d);if(s==='Present'||s==='WFH')r.P++;else if(s==='Half Day')r.H++;else if(s==='Leave')r.L++;else if(s==='Unpaid Leave')r.U++;else r.A++}return r}
export function ldays(a:string,b:string){let n=0;for(let x=new Date(a+'T00:00');iso(x)<=b;x.setDate(x.getDate()+1))if(x.getDay())n++;return n}
export function balance(D:Data,id:string,year:string){const b:Record<string,number>={Casual:0,Sick:0,Earned:0,Unpaid:0};D.leaves.filter(l=>l.emp===id&&l.status!=='Rejected'&&l.from.slice(0,4)===year).forEach(l=>b[l.type]+=l.days);return b}
// Payroll rules (sample): HRA 40% of basic, PF 12% of basic, 5% tax above 50,000
export function calc(D:Data,e:Emp,ym:string){const s=summary(D,e.id,ym),payable=s.P+s.H*.5+s.L,ratio=s.wd?Math.min(payable/s.wd,1):0,basic=+e.basic,hra=basic*.4,allow=+e.allow,gross=basic+hra+allow,earned=gross*ratio,pf=basic*.12*ratio,tax=earned>50000?earned*.05:0,od=+e.od,ded=pf+tax+od;return{...s,payable,basic,hra,allow,gross,earned,pf,tax,od,ded,adj:0,net:Math.max(0,earned-ded)}}
