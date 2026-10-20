import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {filterRecords,filterEditions,readState,stateQuery,parseMarkdown,csvExport,institutionsOf,project} from '../assets/core.mjs';
const root=new URL('../',import.meta.url),json=p=>JSON.parse(readFileSync(new URL(p,root),'utf8'));
const rows=json('data/tracker.json').records,state=patch=>({...readState(),...patch});
test('Vietnam and shared Dana-Farber membership produce exact seeded rows',()=>{
 assert.deepEqual(filterRecords(rows,state({country:'Vietnam'})).map(r=>r.id),['IHB-0042','IHB-0079']);
 const df=filterRecords(rows,state({institution:['Dana-Farber Cancer Institute']}));assert.equal(df.length,5);
 const shared=df.find(r=>r.id==='IHB-0081');assert.deepEqual(institutionsOf(shared),['Mass General Brigham','Dana-Farber Cancer Institute']);
 assert.equal(rows.filter(r=>r.id===shared.id).length,1);
});
test('all five filter dimensions combine without leaking records',()=>{
 const result=filterRecords(rows,state({institution:['UCLA Health'],tactic:'T7',region:'Asia Pacific',country:'China',status:'Baseline',footprint:'baseline'}));
 assert.deepEqual(result.map(r=>r.id),['IHB-0073','IHB-0074','IHB-0075','IHB-0076']);
 assert.equal(filterRecords(rows,state({region:'GCC',tactic:'T3'})).length,0);
 assert.equal(filterRecords(rows,state({country:'Saudi Arabia',year:'2026'})).length,0);
});
test('search and original announcement dates do not invent openings',()=>{
 assert.deepEqual(filterRecords(rows,state({q:'non-binding'})).map(r=>r.id),['IHB-0050']);
 assert.equal(filterRecords(rows,state({year:'2026',country:'Qatar'})).length,0);
 assert.equal(rows.find(r=>r.id==='IHB-0066').announcement_date,'2019-11-13');
 assert.equal(rows.find(r=>r.id==='IHB-0066').latest_event_date,'2026-09-28');
});
test('new activity includes post-launch records as well as launch backfill',()=>{
 const future={...rows[0],id:'IHB-9999',seed_kind:'new',status:'Announced'};
 assert.equal(filterRecords([future],state({footprint:'new'})).length,1);
 assert.equal(filterRecords([future],state({footprint:'baseline'})).length,0);
 assert.deepEqual(filterRecords(rows,state({footprint:'new'})).map(r=>r.id),['IHB-0001','IHB-0008','IHB-0017','IHB-0020','IHB-0050','IHB-0066','IHB-0080','IHB-0085','IHB-0093','IHB-0094','IHB-0095','IHB-0096','IHB-0097','IHB-0098']);
});
test('multi-select and compound filters survive link serialization',()=>{
 const s=state({institution:['Mass General Brigham','Dana-Farber Cancer Institute'],country:'United Arab Emirates',region:'GCC',tactic:'T4',status:'Baseline',footprint:'baseline',q:'BEEAH',record:'IHB-0081'});
 assert.deepEqual(readState(stateQuery(s)),s);assert.deepEqual(filterRecords(rows,s).map(r=>r.id),['IHB-0081']);
});
test('signal-only brief can match country and region without a tracker record',()=>{
 const ed={date:'2026-10-20',headline:'Tender update',record_ids:[],items:[{section:'market_signal',country:'Vietnam',region:'Asia Pacific',tactic:'T3'}]};
 assert.equal(filterEditions([ed],rows,state({country:'Vietnam',region:'Asia Pacific'})).length,1);
 assert.equal(filterEditions([ed],rows,state({institution:['Mayo Clinic']})).length,0);
 assert.equal(filterEditions([ed],rows,state({from:'2026-10-21'})).length,0);
});
test('reader Markdown rebases document links and rejects active payloads',()=>{
 const html=parseMarkdown('<script>alert(1)</script>\n\n[report](SEED-REPORT.md) [bad](javascript:alert(1)) [remote](//evil.example)', 'https://example.test/ihb/METHODOLOGY.md');
 assert.ok(html.includes('https://example.test/ihb/SEED-REPORT.md'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('href="javascript:'));assert.ok(!html.includes('href="//'));
});
test('filtered CSV neutralizes spreadsheet formulas and preserves quoted cells',()=>{
 const csv=csvExport([{id:'IHB-0001',institution:'=HYPERLINK("evil")',headline:'A "quoted", title'}]);
 assert.ok(csv.includes("'="));assert.ok(csv.includes('"A ""quoted"", title"'));
});
test('every seeded record has a map locator and projection stays in the world frame',()=>{
 const p=json('assets/places.json');for(const r of rows){const point=p.cities[`${r.city}|${r.country}`]||p.countries[r.country];assert.ok(point,r.id);const[x,y]=project(...point);assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=1000&&y>=0&&y<=440,r.id);}
});

test('invalid operational-year queries are normalized and valid zero-result years retained',()=>{
 assert.equal(readState('year=banana').year,'');assert.equal(readState('year=20260').year,'');assert.equal(readState('year=2026').year,'2026');
});

test('country overview retains actual ownership under a different institution filter',async()=>{
 const {activityDisplay}=await import('../assets/core.mjs');
 const s=state({institution:['Mayo Clinic'],country:'Vietnam'}),vn=rows.filter(r=>r.country==='Vietnam');
 assert.equal(activityDisplay(vn[0],s,{country:true}).title,'Johns Hopkins Medicine International');
 assert.equal(activityDisplay(vn[1],s,{country:true}).title,'Penn Medicine');
 assert.deepEqual(activityDisplay(vn[0],s,{country:true}).shared,[]);
 const shared=rows.find(r=>r.id==='IHB-0081');
 assert.deepEqual(activityDisplay(shared,state({institution:['Dana-Farber Cancer Institute']})).shared,['Mass General Brigham']);
});
