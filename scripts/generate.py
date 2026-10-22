#!/usr/bin/env python3
"""Validate the canonical CSV and reproducibly generate its reader projections."""
from __future__ import annotations
import argparse
import csv
import hashlib
import io
import json
import re
import sys
from collections import Counter
from calendar import monthrange
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import quote, urlparse

ROOT = Path(__file__).resolve().parents[1]
HEADERS = ['Record ID','Institution','Partner/Counterparty','Country','Region','City','Tactic (primary)','Tactic (secondary)','Status','Announcement date','Operational date','Headline summary','So-what (1–2 lines, labeled analysis)','Source URL','Source type','Source date','Last verified','Change log']
FIELDS = ['id','institution','partner','country','region','city','tactic_primary','tactic_secondary','status','announcement_date','operational_date','headline','analysis','source_url','source_type','source_date','last_verified','change_log']
REGIONS = {'GCC','Americas','Asia Pacific','Europe','Middle East (non-GCC)','Africa'}
STATUSES = {'Announced','In development','Operational','Suspended/restructured','Closed/exited','Baseline'}
TACTICS = {'T1':'Owned/operated facility','T2':'Joint venture','T3':'Management contract','T4':'Consulting/advisory','T5':'Strategic affiliation/partnership','T6':'In-Country Representative','T7':'Telemedicine/remote second opinion','T8':'Education/training','T9':'Inbound patient channel','T11':'Insurer Partnership'}
TACTIC_ORDER = ['T1','T2','T3','T11','T4','T6','T5','T8','T7','T9']
GCC = {'Saudi Arabia','United Arab Emirates','UAE','Qatar','Kuwait','Oman','Bahrain'}
AMERICAS = {'Canada','Mexico','Argentina','Bolivia','Brazil','Chile','Colombia','Costa Rica','Cuba','Dominica','Dominican Republic','Ecuador','El Salvador','Guatemala','Haiti','Honduras','Jamaica','Nicaragua','Panama','Paraguay','Peru','Suriname','Uruguay','Venezuela','Belize','Guyana','Bahamas','Barbados','Bermuda','Trinidad and Tobago','Grenada','Antigua and Barbuda','Saint Lucia','Saint Kitts and Nevis','Saint Vincent and the Grenadines','Cayman Islands','Aruba','Curaçao','Puerto Rico'}
EUROPE = {'United Kingdom','UK','Ireland','France','Spain','Portugal','Germany','Italy','Austria','Belgium','Netherlands','Switzerland','Sweden','Norway','Denmark','Finland','Iceland','Poland','Czechia','Czech Republic','Slovakia','Hungary','Romania','Bulgaria','Greece','Turkey','Türkiye','Croatia','Slovenia','Serbia','Montenegro','Bosnia and Herzegovina','North Macedonia','Albania','Kosovo','Estonia','Latvia','Lithuania','Ukraine','Belarus','Moldova','Russia','Malta','Cyprus','Luxembourg','Monaco','Andorra','Liechtenstein','San Marino','Vatican City'}
ASIA = {'India','China','Japan','South Korea','North Korea','Korea','Vietnam','Viet Nam','Thailand','Singapore','Malaysia','Indonesia','Philippines','Cambodia','Laos','Myanmar','Brunei','Timor-Leste','Australia','New Zealand','Bangladesh','Pakistan','Sri Lanka','Nepal','Bhutan','Maldives','Afghanistan','Mongolia','Taiwan','Hong Kong','Macau','Kazakhstan','Uzbekistan','Kyrgyzstan','Tajikistan','Turkmenistan','Fiji','Papua New Guinea','Samoa','Tonga','Solomon Islands','Vanuatu','Palau','Micronesia','Marshall Islands','Kiribati','Nauru','Tuvalu'}
MIDDLE_EAST = {'Lebanon','Jordan','Israel','Palestine','Iraq','Iran','Syria','Yemen','Armenia','Azerbaijan','Georgia'}
AFRICA = {'Egypt','Morocco','Algeria','Tunisia','Libya','Sudan','South Sudan','Ethiopia','Eritrea','Djibouti','Somalia','Kenya','Tanzania','Uganda','Rwanda','Burundi','Democratic Republic of the Congo','Republic of the Congo','Congo','Gabon','Equatorial Guinea','Cameroon','Nigeria','Niger','Chad','Central African Republic','Ghana','Togo','Benin','Burkina Faso','Mali','Senegal','Mauritania','Guinea','Guinea-Bissau','Liberia','Sierra Leone',"Côte d’Ivoire",'Ivory Coast','Gambia','Cape Verde','Cabo Verde','South Africa','Namibia','Botswana','Zimbabwe','Zambia','Malawi','Mozambique','Angola','Lesotho','Eswatini','Madagascar','Mauritius','Seychelles','Comoros','São Tomé and Príncipe'}
COUNTRY_REGIONS = {**dict.fromkeys(GCC,'GCC'),**dict.fromkeys(AMERICAS,'Americas'),**dict.fromkeys(EUROPE,'Europe'),**dict.fromkeys(ASIA,'Asia Pacific'),**dict.fromkeys(MIDDLE_EAST,'Middle East (non-GCC)'),**dict.fromkeys(AFRICA,'Africa')}
LAUNCH_DATE = date(2026,10,20)
BACKFILL_START = date(2025,10,20)
BACKFILL_END = LAUNCH_DATE-timedelta(days=1)
DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
MONTH_RE = re.compile(r'^\d{4}-\d{2}$')
ID_RE = re.compile(r'^IHB-\d{4,}$')

class DataError(ValueError):
    pass

def read_json(path, fallback):
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else fallback

def slug(name):
    return re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-')

def iso(value, label, required=False):
    if not value:
        if required: raise DataError(f'{label}: date is required')
        return
    if not DATE_RE.fullmatch(value): raise DataError(f'{label}: use YYYY-MM-DD')
    try: date.fromisoformat(value)
    except ValueError as e: raise DataError(f'{label}: invalid calendar date') from e

def month_bounds(value, label):
    """Return the known month interval without asserting an event day."""
    if not isinstance(value,str) or not MONTH_RE.fullmatch(value):
        raise DataError(f'{label}: use YYYY-MM for a sourced month')
    try:
        year,month = map(int,value.split('-'))
        return date(year,month,1),date(year,month,monthrange(year,month)[1])
    except (ValueError,OverflowError) as e:
        raise DataError(f'{label}: invalid calendar month') from e

def direct_url(value, label):
    u = urlparse(value)
    if u.scheme != 'https' or not u.netloc or u.username or u.password or not u.path.strip('/'):
        raise DataError(f'{label}: expected a direct HTTPS source page, not a homepage')
    if u.netloc.lower() in {'wikipedia.org','www.wikipedia.org','en.wikipedia.org'}:
        raise DataError(f'{label}: prohibited source')

def validate_records(csv_text, institutions, evidence=None, as_of='2026-10-20'):
    evidence = evidence or {}
    iso(as_of,'as_of',True)
    reader = csv.DictReader(io.StringIO(csv_text))
    if reader.fieldnames != HEADERS: raise DataError('CSV headers do not match the documented 19-column schema')
    records, seen, deals = [], set(), set()
    for row_num,row in enumerate(reader,2):
        if None in row: raise DataError(f'CSV row {row_num}: extra cells')
        r = {key:(row[header] or '').strip() for header,key in zip(HEADERS,FIELDS)}
        label = r['id'] or f'row {row_num}'
        if not ID_RE.fullmatch(r['id']): raise DataError(f'{label}: invalid Record ID')
        if r['id'] in seen: raise DataError(f'{label}: duplicate Record ID')
        seen.add(r['id'])
        if not r['institution']: raise DataError(f'{label}: institution is required')
        names = [x.strip() for x in r['institution'].split(';') if x.strip()]
        if len(set(names)) != len(names) or any(x not in institutions for x in names): raise DataError(f'{label}: unregistered tracked institution; add approved US Tier 2 institutions to data/tier2-institutions.json')
        r['institutions'] = names
        if not r['partner'] or not r['headline'] or not r['change_log']: raise DataError(f'{label}: partner, headline and change log are required')
        if r['country'] not in COUNTRY_REGIONS: raise DataError(f'{label}: country requires an explicit region mapping: {r["country"]}')
        if r['region'] != COUNTRY_REGIONS[r['country']]: raise DataError(f'{label}: country/region mismatch')
        if r['status'] not in STATUSES: raise DataError(f'{label}: invalid status')
        if r['tactic_primary'] not in TACTICS: raise DataError(f'{label}: invalid primary tactic')
        secondary = [x.strip() for x in r['tactic_secondary'].split(';') if x.strip()]
        if len(set(secondary)) != len(secondary) or any(x not in TACTICS or x==r['tactic_primary'] for x in secondary): raise DataError(f'{label}: invalid secondary tactics')
        if any(TACTIC_ORDER.index(x) < TACTIC_ORDER.index(r['tactic_primary']) for x in secondary): raise DataError(f'{label}: primary tactic violates the bundled tactic tiebreak order')
        r['tactic_secondary'] = secondary
        for key in ('announcement_date','operational_date','source_date','last_verified'):
            iso(r[key],f'{label} {key}',key=='last_verified')
            if r[key] and r[key] > as_of: raise DataError(f'{label}: future {key}')
        if r['announcement_date'] and r['operational_date'] and r['operational_date'] < r['announcement_date']:
            raise DataError(f'{label}: operational date precedes announcement; document historical renewals as the same original deal')
        if r['status'] in {'Announced','In development'} and r['operational_date']:
            raise DataError(f'{label}: not operational but has an operational date')
        if not r['analysis'].startswith('Analysis: '): raise DataError(f'{label}: so-what must start with Analysis: ')
        direct_url(r['source_url'],label)
        if r['source_type'] not in {'Primary','Secondary','Official LinkedIn'}: raise DataError(f'{label}: invalid source type')
        ev = evidence.get(r['id'],{})
        seed_kind = ev.get('seed_kind','baseline' if r['status']=='Baseline' else 'backfill')
        if seed_kind not in {'baseline','backfill','new'}: raise DataError(f'{label}: invalid seed kind')
        if r['status']=='Baseline' and seed_kind!='baseline': raise DataError(f'{label}: Baseline status requires baseline seed kind')
        if r['source_type']=='Official LinkedIn':
            archive = ev.get('linkedin_archive',{})
            if not archive.get('full_text') or not archive.get('post_date') or archive.get('official_verified') is not True:
                raise DataError(f'{label}: verified company page and dated full-text LinkedIn archive required')
        major = r['tactic_primary'] in {'T1','T2','T3'} or r['status']=='Closed/exited'
        if r['source_type']=='Secondary' and major:
            sources = ev.get('sources',[])
            hosts = {urlparse(s.get('url','')).hostname for s in sources if s.get('type')=='Secondary'}
            hosts.discard(None)
            if len(hosts)<2: raise DataError(f'{label}: major item needs primary or two independent reputable sources')
        event_date = ev.get('latest_event_date') or r['announcement_date']
        event_month = ev.get('event_date_month') or ''
        iso(event_date,f'{label} latest_event_date')
        if event_date and event_date > as_of: raise DataError(f'{label}: future latest event')
        if event_month:
            if event_date: raise DataError(f'{label}: event_date_month requires blank latest_event_date and announcement_date; preserve the sourced precision')
            month_start,month_end = month_bounds(event_month,f'{label} event_date_month')
            if month_start > date.fromisoformat(as_of): raise DataError(f'{label}: future event month')
        if seed_kind=='backfill':
            if event_date:
                inside = BACKFILL_START <= date.fromisoformat(event_date) < LAUNCH_DATE
            elif event_month:
                inside = BACKFILL_START <= month_start and month_end < LAUNCH_DATE
            else:
                raise DataError(f'{label}: backfill needs an announcement date, evidenced latest_event_date or event_date_month')
            if not inside: raise DataError(f'{label}: backfill latest event is outside the 12-month historical backfill window; a known month must fit entirely inside it')
        r['latest_event_date'] = event_date
        r['latest_event_month'] = event_month
        r['event_date_label'] = event_date or (f'{event_month} (day not disclosed)' if event_month else '')
        events = ev.get('events',[])
        if not isinstance(events,list): raise DataError(f'{label}: events must be an array')
        r['events'] = []
        for event in events:
            if not isinstance(event,dict) or not isinstance(event.get('summary'),str) or not event['summary'].strip():
                raise DataError(f'{label}: each historical event needs a sourced summary')
            history_date = event.get('date','')
            if isinstance(history_date,str) and MONTH_RE.fullmatch(history_date):
                history_start,_ = month_bounds(history_date,f'{label} historical event month')
                if history_start > date.fromisoformat(as_of): raise DataError(f'{label}: future historical event month')
            else:
                if not isinstance(history_date,str): raise DataError(f'{label}: historical event date must be ISO day or month')
                iso(history_date,f'{label} historical event date',True)
                if history_date > as_of: raise DataError(f'{label}: future historical event')
            direct_url(event.get('source_url',''),f'{label} historical event')
            r['events'].append({'date':history_date,'summary':event['summary'].strip(),'source_url':event['source_url']})
        dedup = (';'.join(sorted(x.casefold() for x in r['institutions'])),) + tuple(r[k].casefold() for k in ('partner','country','tactic_primary'))
        if dedup in deals: raise DataError(f'{label}: potential duplicate deal; update existing record or distinguish the facility/partner')
        deals.add(dedup)
        r['seed_kind']=seed_kind
        r['source_note']=ev.get('source_note',ev.get('evidence',''))
        r['scope_note']=ev.get('scope_note','')
        r['verified_status']=ev.get('verified_status','')
        records.append(r)
    return sorted(records,key=lambda r:int(r['id'].split('-')[1]))

def md(value):
    return str(value).replace('|','\\|').replace('\n','<br>')

def footprint_table(records):
    lines=['| Record | Institution | Country | Region | Tactic | Status | Source |','| --- | --- | --- | --- | --- | --- | --- |']
    for r in records:
        lines.append(f'| {r["id"]} | {md(r["institution"])} | {md(r["country"])} | {r["region"]} | {r["tactic_primary"]} {TACTICS[r["tactic_primary"]]} | {r["status"]} | [Source]({r["source_url"]}) |')
    return '\n'.join(lines) if records else 'No records yet meet the public sourcing standard for this inventory. This does not establish that the institution has no international activity.'

def generate_profile(institution, records, coverage, as_of):
    active=[r for r in records if r['status'] not in {'Closed/exited','Suspended/restructured'}]
    verified=max((r['last_verified'] for r in records),default='Not yet verified')
    lines=[f'# {institution}','',f'Last verified: {verified}. Inventory as of {as_of}.','',
           f'[Interactive profile](./index.html?institution={quote(institution)}) · [Map slice](../map/?institution={quote(institution)}) · [All institutions](../institutions/)','',
           'Independent publication. Public sources only. Analysis is labeled. Not investment or business advice.','',
           '## Footprint inventory','', 'Baseline identifies a pre-existing arrangement at seeding; it is not an operating-status claim. A baseline arrangement may still be planned. Read the source-scope notes below. Suspended and exited arrangements remain in the historical timeline.','',footprint_table(active),'',
           '## Chronological timeline','']
    if records:
        for r in sorted(records,key=lambda x:(x['latest_event_date'] or x.get('latest_event_month','') or x['announcement_date'] or x['operational_date'] or '0000',x['id']),reverse=True):
            when=r.get('event_date_label','') or r['latest_event_date'] or r['announcement_date'] or r['operational_date'] or 'Date not disclosed'
            lines += [f'### {when} — {r["headline"]}','',f'{r["id"]} · {r["country"]} · {r["status"]} · {r["tactic_primary"]} {TACTICS[r["tactic_primary"]]}','',r['analysis'],'',f'[Source]({r["source_url"]}) ({r["source_type"]}; source date: {r["source_date"] or "Not displayed"}; verified {r["last_verified"]}).','',f'Change log: {r["change_log"]}','']
            if r['scope_note']: lines += [f'Source scope: {r["scope_note"]}','']
    else: lines += ['No sourced records published yet.','']
    lines += ['## Coverage notes','',str(coverage.get('scope_checked','Initial research coverage is not yet documented.')),'',str(coverage.get('backfill_status','12-month historical backfill verification pending.')),'']
    unresolved=coverage.get('unresolved',[])
    if isinstance(unresolved,str): unresolved=[unresolved] if unresolved else []
    if unresolved: lines += ['Open sourcing gaps:','']+['- '+str(x) for x in unresolved]+['']
    return '\n'.join(lines).rstrip()+'\n'

def load_editions(root, records):
    by_id={r['id']:r for r in records}
    editions=[]
    for p in sorted((root/'briefs').glob('????-??-??.md'),reverse=True):
        iso(p.stem,p.name,True)
        side=p.with_suffix('.json')
        if not side.exists(): raise DataError(f'{p.name}: same-name JSON metadata is required for a filterable, auditable archive')
        meta=read_json(side,{})
        if meta.get('date')!=p.stem or not meta.get('headline'): raise DataError(f'{p.name}: metadata date/headline mismatch')
        body=p.read_text(encoding='utf-8')
        if '## Tracker changes' not in body: raise DataError(f'{p.name}: missing Tracker changes section')
        if '## Market Signals' not in body: raise DataError(f'{p.name}: missing Market Signals section')
        if date.fromisoformat(p.stem).weekday()==4 and not meta.get('weekly_synthesis'): raise DataError(f'{p.name}: Friday edition requires a weekly synthesis')
        items=meta.get('items',[])
        if not items: raise DataError(f'{p.name}: empty editions must not be published')
        ids=[]
        for item in items:
            rid=item.get('record_id')
            if rid:
                if rid not in by_id or rid not in body: raise DataError(f'{p.name}: unknown or unlisted Record ID {rid}')
                rr=by_id[rid]
                for k in ('country','region'):
                    if item.get(k,rr[k])!=rr[k]: raise DataError(f'{p.name}: {rid} {k} differs from tracker')
                    item[k]=rr[k]
                item['institution']=rr['institution']
                item['institutions']=rr['institutions']
                item['tactic']=rr['tactic_primary']
                ids.append(rid)
            elif item.get('section')!='market_signal': raise DataError(f'{p.name}: institution item needs a Record ID')
            if len(item.get('summary',[])) not in {3,4,5}: raise DataError(f'{p.name}: item summary needs 3–5 sentence entries')
            if len(item.get('analysis',[]))!=2: raise DataError(f'{p.name}: analysis needs exactly two lines')
            if not item.get('source_urls'): raise DataError(f'{p.name}: item needs a source')
            for u in item['source_urls']: direct_url(u,p.name)
        editions.append({**meta,'url':f'briefs/{p.name}','record_ids':sorted(set(ids)),'institutions':sorted({n for x in items for n in x.get('institutions',[x.get('institution','')])}-{''}),'countries':sorted({x.get('country','') for x in items}-{''}),'regions':sorted({x.get('region','') for x in items}-{''}),'tactics':sorted({x.get('tactic','') for x in items}-{''}),'markdown':body})
    return editions

def build(root=ROOT,as_of='2026-10-20'):
    institutions=read_json(root/'data/institutions.json',[])
    if len(institutions)!=19 or len(set(institutions))!=19 or 'Dana-Farber Cancer Institute' not in institutions: raise DataError('Tier 1 must contain 19 unique names including Dana-Farber Cancer Institute')
    raw=(root/'data/tracker.csv').read_text(encoding='utf-8-sig')
    evidence=read_json(root/'data/evidence.json',{})
    records=validate_records(raw,institutions+read_json(root/'data/tier2-institutions.json',[]),evidence,as_of)
    coverage_list=read_json(root/'data/coverage.json',[])
    coverage={x['institution']:x for x in coverage_list}
    editions=load_editions(root,records)
    counts={'records':len(records),'baseline':sum(r['seed_kind']=='baseline' for r in records),'backfill':sum(r['seed_kind']=='backfill' for r in records),'new':sum(r['seed_kind']=='new' for r in records),'countries':len({r['country'] for r in records}),'tier_1_institutions':len(institutions),'institutions_with_records':len({n for r in records for n in r['institutions']})}
    payload={'generated_as_of':as_of,'launch_date':LAUNCH_DATE.isoformat(),'backfill_start':BACKFILL_START.isoformat(),'backfill_end':BACKFILL_END.isoformat(),'source':'data/tracker.csv','source_sha256':hashlib.sha256(raw.encode()).hexdigest(),'counts':counts,'tactics':TACTICS,'statuses':sorted(STATUSES),'regions':['GCC','Americas','Asia Pacific','Europe','Middle East (non-GCC)','Africa'],'records':records}
    outputs={root/'data/tracker.json':json.dumps(payload,ensure_ascii=False,indent=2)+'\n',root/'data/briefs.json':json.dumps({'editions':editions},ensure_ascii=False,indent=2)+'\n'}
    outputs[root/'data/tracker.md']='# Permanent deal tracker\n\n[Sortable, filterable tracker](./index.html) · [Interactive map](../map/) · [CSV](./tracker.csv)\n\n'+f'{len(records)} sourced records. Generated from tracker.csv; inventory as of {as_of}.\n\n'+footprint_table(records)+'\n\nAnalysis is labeled in each record. For complete dates, source types and change logs, use the interactive tracker or CSV.\n'
    for institution in institutions:
        outputs[root/'institutions'/f'{slug(institution)}.md']=generate_profile(institution,[r for r in records if institution in r['institutions']],coverage.get(institution,{}),as_of)
    index=['# Brief archive','','[Search and filter editions](./index.html) · [Tracker](../data/) · [Map](../map/)','']
    if editions:
        index += ['| Date | Headline | Institutions | Records |','| --- | --- | --- | --- |']
        for e in editions: index.append(f'| [{e["date"]}](./{e["date"]}.md) | {md(e["headline"])} | {md(", ".join(e["institutions"]))} | {", ".join(e["record_ids"])} |')
    else: index += ['No editions published yet. Historical seeding populates the tracker, not backdated briefs. An edition is published only after a completed editorial scan finds material news in its coverage window.']
    outputs[root/'briefs/INDEX.md']='\n'.join(index)+'\n'
    report=['# Seed report','',f'Inventory date: {as_of}. Historical backfill window: {BACKFILL_START.isoformat()} through {BACKFILL_END.isoformat()} inclusive (12 months before launch).','',f'**{counts["baseline"]} baseline records · {counts["backfill"]} backfill records · {counts["records"]} total records · {counts["countries"]} countries · 19 Tier 1 institutions.**','',
            'This is an initial verified public-source inventory. Coverage gaps below remain open; missing records are not evidence that an institution has no international footprint. A research pass is not a certification that every historical deal or every event in the backfill window has been found.','',
            '| Institution | Baseline | Backfill | Other/new | Coverage and open gaps |','| --- | ---: | ---: | ---: | --- |']
    for name in institutions:
        rr=[r for r in records if name in r['institutions']]
        c=Counter(r['seed_kind'] for r in rr)
        info=coverage.get(name,{})
        unresolved=info.get('unresolved',[])
        if isinstance(unresolved,str): unresolved=[unresolved] if unresolved else []
        note=' '.join([str(info.get('scope_checked','Research coverage not documented.')),str(info.get('backfill_status','12-month historical scan not documented.'))]+[str(x) for x in unresolved])
        report.append(f'| [{name}](institutions/{slug(name)}.md) | {c["baseline"]} | {c["backfill"]} | {c["new"]} | {md(note)} |')
    report += ['','## Source limitations','','- Undated official pages retain a blank source date; last verified is the date checked, not the publication date.','- A baseline marker identifies a pre-existing arrangement; it does not establish that a planned facility is operational. Read each record’s source-scope note.','- Historical candidate events that cannot meet the sourcing standard remain excluded or on hold.','- Baseline records are visually muted and can be filtered independently from new activity.','- Backfill records retain original announcement dates. Updates to older deals carry an evidenced latest-event date and never create duplicate records or backdated editions.','', '## Reproduce counts','','Run `python3 scripts/generate.py --check` to verify that all committed projections match the CSV. Source admissibility and factual entailment still require editorial review; structural validation does not establish them.','']
    outputs[root/'SEED-REPORT.md']='\n'.join(report)
    return outputs,counts

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check',action='store_true',help='Fail if generated outputs differ; do not write')
    parser.add_argument('--as-of',default=read_json(ROOT/'data/release.json',{}).get('as_of','2026-10-20'),help='Editorial inventory date, YYYY-MM-DD (explicit and reproducible)')
    args=parser.parse_args()
    try: outputs,counts=build(as_of=args.as_of)
    except (DataError,FileNotFoundError,json.JSONDecodeError) as e:
        print(f'Validation failed: {e}',file=sys.stderr); return 1
    stale=[]
    for path,content in outputs.items():
        if not path.exists() or path.read_text(encoding='utf-8')!=content:
            stale.append(str(path.relative_to(ROOT)))
            if not args.check:
                path.parent.mkdir(parents=True,exist_ok=True);path.write_text(content,encoding='utf-8')
    if args.check and stale:
        print('Stale generated outputs: '+', '.join(stale),file=sys.stderr);return 1
    print(('Verified' if args.check else 'Generated')+f' {len(outputs)} projections; '+json.dumps(counts))
    return 0

if __name__=='__main__':
    raise SystemExit(main())
