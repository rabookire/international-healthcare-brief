import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readState,stateQuery,filterRecords,REGIONS,TACTICS} from '../assets/core.mjs';
import {recentDevelopments,renderProfile,profileTypes} from '../assets/profile.mjs';
const data=JSON.parse(readFileSync(new URL('../data/tracker.json',import.meta.url)));
const rows=data.records;
const state=patch=>({...readState(),...patch});

test('insurer relationships are distinct while the consulting service remains discoverable',()=>{
 assert.deepEqual(filterRecords(rows,state({tactic:'T11'})).map(r=>r.id),['IHB-0017','IHB-0038','IHB-0093']);
 assert.ok(filterRecords(rows,state({tactic:'T4'})).some(r=>r.id==='IHB-0038'));
 assert.equal(filterRecords(rows,state({tactic:'T5'})).some(r=>r.id==='IHB-0017'||r.id==='IHB-0093'),false);
 assert.equal(TACTICS.T11,data.tactics.T11);
});
test('explicit regions partition the legacy Other view and survive shared links',()=>{
 const africa=filterRecords(rows,state({region:'Africa'}));
 const middleEast=filterRecords(rows,state({region:'Middle East (non-GCC)'}));
 assert.deepEqual(africa.map(r=>r.country).sort(),['Egypt','Nigeria']);
 assert.deepEqual(middleEast.map(r=>r.country).sort(),['Jordan','Lebanon']);
 assert.deepEqual(filterRecords(rows,state({region:'Other'})).map(r=>r.id).sort(),[...africa,...middleEast].map(r=>r.id).sort());
 assert.deepEqual(REGIONS,data.regions);
 const s=state({institution:['Cleveland Clinic'],region:'Americas',tactic:'T11',view:'list'});
 assert.deepEqual(readState(stateQuery(s)),s);
 assert.deepEqual(filterRecords(rows,s).map(r=>r.id),['IHB-0017']);
});
test('profile updates use sourced dates, honor filters, and never date an undated baseline',()=>{
 const clinic=filterRecords(rows,state({institution:['Cleveland Clinic']}));
 assert.deepEqual(recentDevelopments(clinic).map(r=>r.id),['IHB-0017','IHB-0093','IHB-0008']);
 assert.deepEqual(recentDevelopments(filterRecords(clinic,state({tactic:'T6'}))).map(r=>r.id),['IHB-0008']);
 assert.equal(recentDevelopments(clinic.filter(r=>r.seed_kind==='baseline')).length,0);
});
test('zero results offer recovery while list mode preserves source-backed detail access',()=>{
 const clinic=filterRecords(rows,state({institution:['Cleveland Clinic']}));
 const render=(s,visible)=>renderProfile({selected:'Cleveland Clinic',rows:clinic,visible,state:s,note:null,fmt:x=>x,url:p=>p,icon:()=>''});
 const empty=render(state({region:'Africa',tactic:'T11'}),[]);
 assert.match(empty,/No activity matches these filters/);
 assert.match(empty,/data-profile-reset/);
 assert.doesNotMatch(empty,/<svg id="world-map"/);
 const s=state({view:'list',tactic:'T11'}),insurers=filterRecords(clinic,s),list=render(s,insurers);
 assert.match(list,/data-record="IHB-0017"/);
 assert.match(list,/data-record="IHB-0093"/);
 assert.match(list,/newsroom.clevelandclinic.org/);
 assert.doesNotMatch(list,/data-record="IHB-0008"/);
});

test('activity dropdown includes secondary tactics without inventing primary map symbols',()=>{
 const upmc=filterRecords(rows,state({institution:['UPMC']}));
 assert.ok(profileTypes(upmc,'',true).includes('T2'));
 assert.equal(profileTypes(upmc).includes('T2'),false);
 assert.ok(filterRecords(upmc,state({tactic:'T2'})).length>0);
 const mayo=filterRecords(rows,state({institution:['Mayo Clinic']}));
 assert.ok(profileTypes(mayo,'',true).includes('T7'));
});
