/** Stateless, UTF-8 safe birthday links. The #fragment is not sent in HTTP requests.
 * It is not encrypted: everyone who receives a link can read its greeting.
 */
export type Greeting = Readonly<{name:string;wish:string}>;

export const DEFAULT_GREETING: Greeting = {
  name:'你',
  wish:'愿所有美好的事情，都在下一页等你。',
};

const PREFIX='#gift=';
const MAX_TOKEN_LENGTH=640;

export function greetingFromHash(hash:string):Greeting|null {
  if(!hash.startsWith(PREFIX))return null;
  const token=hash.slice(PREFIX.length);
  if(!token||token.length>MAX_TOKEN_LENGTH||!/^[A-Za-z0-9_-]+$/.test(token))
    return null;
  try {
    const base64=token.replace(/-/g,'+').replace(/_/g,'/');
    if(base64.length%4===1)return null;
    const binary=atob(base64.padEnd(Math.ceil(base64.length/4)*4,'='));
    const bytes=Uint8Array.from(binary.split('').map(char=>char.charCodeAt(0)));
    const raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)) as unknown;
    if(raw===null||typeof raw!=='object'||Array.isArray(raw))return null;
    const payload=raw as Record<string,unknown>;
    if(payload.v!==1||typeof payload.n!=='string'||typeof payload.w!=='string')
      return null;
    const name=payload.n.trim(),wish=payload.w.trim();
    if(!name||!wish||name.length>12||wish.length>60)return null;
    return {name,wish};
  }catch{
    return null; // Corrupt, invalid UTF-8 and future formats safely use defaults.
  }
}

export function makeShareLink(
  greeting:Greeting,
  pageLocation:Pick<Location,'origin'|'pathname'>
):string {
  // Deliberately omit ?scene, ?pose and ?from: the recipient opens the cover.
  const name=greeting.name.trim()||DEFAULT_GREETING.name;
  const wish=greeting.wish.trim()||DEFAULT_GREETING.wish;
  const utf8=new TextEncoder().encode(JSON.stringify({v:1,n:name,w:wish}));
  const binary=Array.from(utf8,byte=>String.fromCharCode(byte)).join('');
  const token=btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return `${pageLocation.origin}${pageLocation.pathname}${PREFIX}${token}`;
}
