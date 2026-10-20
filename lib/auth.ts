import crypto from 'crypto';
// Set AUTH_SECRET in Vercel env (any long random text). Cookies are signed with it so nobody can fake a login.
const SECRET=process.env.AUTH_SECRET||'dev-only-secret-set-AUTH_SECRET';
const sig=(s:string)=>crypto.createHmac('sha256',SECRET).update(s).digest('base64url');
export const sign=(o:any)=>{const b=Buffer.from(JSON.stringify(o)).toString('base64url');return b+'.'+sig(b)};
export function unsign(t?:string){if(!t)return null;const [b,s]=t.split('.');if(!b||!s||s!==sig(b))return null;try{return JSON.parse(Buffer.from(b,'base64url').toString())}catch{return null}}
export function hash(p:string){const salt=crypto.randomBytes(16).toString('hex');return salt+':'+crypto.scryptSync(p,salt,32).toString('hex')}
export function check(p:string,st:string){if(!st.includes(':'))return p===st;const [salt,h]=st.split(':'),x=crypto.scryptSync(p,salt,32).toString('hex');return x.length===h.length&&crypto.timingSafeEqual(Buffer.from(x),Buffer.from(h))}
