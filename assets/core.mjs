export const TACTICS = {T1:'Owned / operated facility',T2:'Joint venture',T3:'Management contract',T4:'Consulting / advisory',T5:'Strategic partnership',T6:'In-Country Representative',T7:'Remote care / second opinion',T8:'Education / training',T9:'Inbound patient channel',T11:'Insurer Partnership'};
export const COLORS = {T1:'#0072B2',T2:'#D55E00',T3:'#009E73',T4:'#8C564B',T5:'#CC79A7',T6:'#7354B0',T7:'#007F86',T8:'#957000',T9:'#4C5969',T11:'#b06a14'};
export const STATUSES = ['Announced','In development','Operational','Suspended/restructured','Closed/exited','Baseline'];
export const REGIONS = ['GCC','Americas','Asia Pacific','Europe','Middle East (non-GCC)','Africa'];
export function institutionsOf(r) { return r.institutions || r.institution.split(';').map(x=>x.trim()).filter(Boolean); }
export function readState(search='') { const p=new URLSearchParams(search);return {view:p.get('view')==='list'?'list':'map',institution:p.getAll('institution'),tactic:p.get('tactic')||'',region:p.get('region')||'',country:p.get('country')||'',status:p.get('status')||'',footprint:['all','baseline','new'].includes(p.get('footprint'))?p.get('footprint'):'all',q:p.get('q')||'',year:/^\d{4}$/.test(p.get('year')||'')?p.get('year'):'',record:p.get('record')||'',from:p.get('from')||'',to:p.get('to')||''}; }
export function stateQuery(s) { const p=new URLSearchParams();for(const x of s.institution||[])p.append('institution',x);for(const k of ['tactic','region','country','status','q','year','record','from','to'])if(s[k])p.set(k,s[k]);if(s.view==='list')p.set('view','list');if(s.footprint&&s.footprint!=='all')p.set('footprint',s.footprint);return p.toString(); }
export function filterRecords(rows,s) { const q=(s.q||'').trim().toLocaleLowerCase();return rows.filter(r=>(!s.institution?.length||s.institution.some(x=>institutionsOf(r).includes(x)))&&(!s.tactic||r.tactic_primary===s.tactic||(r.tactic_secondary||[]).includes(s.tactic))&&(!s.region||regionMatches(r.region,s.region))&&(!s.country||r.country===s.country)&&(!s.status||r.status===s.status)&&(s.footprint!=='baseline'||r.seed_kind==='baseline')&&(s.footprint!=='new'||r.seed_kind!=='baseline')&&(!s.year||(r.operational_date||'').startsWith(s.year)&&r.status!=='Closed/exited')&&(!q||[r.id,r.institution,r.partner,r.country,r.region,r.city,r.headline,r.analysis,r.status,TACTICS[r.tactic_primary]].join(' ').toLocaleLowerCase().includes(q))); }
export function sortRecords(rows,key='last_verified',direction=-1) { return [...rows].sort((a,b)=>direction*String(a[key]||'').localeCompare(String(b[key]||''))||a.id.localeCompare(b.id)); }
export function escapeHTML(s='') { return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function safeURL(s='') { try{const u=new URL(s);return u.protocol==='https:'?u.href:'#';}catch{return '#';} }
export function csvCell(s='') { s=String(s);if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'; }
export function csvExport(rows) { const keys=['id','institution','partner','country','region','city','tactic_primary','tactic_secondary','status','announcement_date','operational_date','headline','analysis','source_url','source_type','source_date','last_verified','change_log'];return [keys,...rows.map(r=>keys.map(k=>Array.isArray(r[k])?r[k].join('; '):r[k]||''))].map(row=>row.map(csvCell).join(',')).join('\r\n'); }
export function project(lon,lat) { return [(lon+180)*1000/360,(85-lat)*1000/360]; }
export function parseMarkdown(md,baseURL) {
 const inline=t=>escapeHTML(t).replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,url)=>{const decoded=url.replaceAll('&amp;','&');const ok=/^https:\/\//.test(decoded)||(!/^[a-z][a-z0-9+.-]*:/i.test(decoded)&&!decoded.startsWith('//')&&!decoded.includes('\\'));let href=decoded;if(ok&&baseURL){try{href=new URL(decoded,baseURL).href;}catch{return label;}}return ok?`<a href="${escapeHTML(href)}">${label}</a>`:label;}).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
 const lines=md.replace(/^---\n[\s\S]*?\n---\n/,'').split('\n');let out='',list='',code=false,table=false;const close=()=>{if(list){out+=`</${list}>`;list='';}if(table){out+='</tbody></table></div>';table=false;}};
 for(const line of lines){if(line.startsWith('```')){close();out+=code?'</code></pre>':'<pre><code>';code=!code;continue;}if(code){out+=escapeHTML(line)+'\n';continue;}if(!line.trim()){close();continue;}if(/^\|/.test(line)){if(/^\|[\s:|-]+\|\s*$/.test(line))continue;const cells=line.replace(/^\||\|$/g,'').split('|');if(!table){close();out+='<div class="table-wrap"><table><thead><tr>'+cells.map(c=>'<th>'+inline(c.trim())+'</th>').join('')+'</tr></thead><tbody>';table=true;}else out+='<tr>'+cells.map(c=>'<td>'+inline(c.trim())+'</td>').join('')+'</tr>';continue;}if(table)close();const h=line.match(/^(#{1,6})\s+(.*)/);if(h){close();out+=`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`;continue;}const l=line.match(/^\s*(?:([-*])|\d+\.)\s+(.*)/);if(l){const type=l[1]?'ul':'ol';if(list!==type){close();list=type;out+=`<${type}>`;}out+='<li>'+inline(l[2])+'</li>';continue;}close();out+='<p>'+inline(line)+'</p>';}
 close();if(code)out+='</code></pre>';return out;
}

export function filterEditions(editions,records,s) {
 const selected=new Set(filterRecords(records,{...s,q:''}).map(r=>r.id));
 const constrained=Boolean(s.institution?.length||s.tactic||s.region||s.country||s.status||s.year||s.footprint!=='all');
 return editions.filter(ed=>(!s.from||ed.date>=s.from)&&(!s.to||ed.date<=s.to)&&(!s.q||JSON.stringify(ed).toLowerCase().includes(s.q.toLowerCase()))&&(!constrained||(ed.items||[]).some(item=>{
  if(item.record_id)return selected.has(item.record_id);
  if(item.section!=='market_signal'||s.institution?.length||s.status||s.year||s.footprint!=='all')return false;
  return (!s.region||regionMatches(item.region,s.region))&&(!s.country||item.country===s.country)&&(!s.tactic||item.tactic===s.tactic);
 })));
}

// Country summaries always identify the actual institutions, regardless of filters.
export function activityDisplay(r,s,{country=false}={}){
 const single=!country&&s.institution?.length===1;
 return {title:single?r.partner:r.institution,partner:single?'':r.partner,shared:single?institutionsOf(r).filter(n=>n!==s.institution[0]):[]};
}

// Preserve old shared links while the canonical inventory uses the two explicit regions.
export function regionMatches(region, selected) { return region===selected || (selected==='Other' && ['Africa','Middle East (non-GCC)'].includes(region)); }
