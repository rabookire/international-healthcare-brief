import csv
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest

SCRIPT=Path(__file__).resolve().parents[1]/'scripts/generate.py'
spec=importlib.util.spec_from_file_location('generate',SCRIPT)
g=importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)
INSTITUTIONS=['Cleveland Clinic','Mayo Clinic','Johns Hopkins Medicine International','MD Anderson Cancer Center','Memorial Sloan Kettering','Mass General Brigham','Houston Methodist','UPMC',"Boston Children's Hospital","Cincinnati Children's","Children's Hospital of Philadelphia","Texas Children's Hospital",'Stanford Medicine','UCLA Health','NewYork-Presbyterian','NYU Langone Health','Cedars-Sinai','Penn Medicine','Dana-Farber Cancer Institute']

def row(**updates):
    values=['IHB-0001','Cleveland Clinic','Example hospital partner','United Arab Emirates','GCC','Abu Dhabi','T3','T8','Unknown','','','A sourced example agreement','Analysis: A management agreement can create an operating presence.','https://official.example/news/agreement','Primary','','2026-10-20','2026-10-20: Added sourced baseline.']
    data=dict(zip(g.HEADERS,values))
    data.update(updates)
    return data

def csv_text(rows):
    out=io.StringIO();writer=csv.DictWriter(out,fieldnames=g.HEADERS);writer.writeheader();writer.writerows(rows);return out.getvalue()

class EditorialBoundaries(unittest.TestCase):
    def valid(self,rows=None,evidence=None):
        return g.validate_records(csv_text(rows or [row()]),INSTITUTIONS,evidence)

    def test_country_region_mismatch_rejected(self):
        with self.assertRaisesRegex(g.DataError,'country/region'): self.valid([row(Region='Europe')])

    def test_unknown_institution_rejected(self):
        with self.assertRaisesRegex(g.DataError,'unregistered'): self.valid([row(Institution='Foreign operator')])

    def test_shared_deal_is_one_record_with_two_memberships(self):
        records=self.valid([row(Institution='Mass General Brigham; Dana-Farber Cancer Institute')])
        self.assertEqual(len(records),1)
        self.assertEqual(records[0]['institutions'],['Mass General Brigham','Dana-Farber Cancer Institute'])

    def test_date_does_not_make_announced_facility_operational(self):
        with self.assertRaisesRegex(g.DataError,'not operational'):
            self.valid([row(Status='Announced',**{'Announcement date':'2026-09-01','Operational date':'2026-10-01'})])

    def test_future_or_malformed_dates_rejected(self):
        for bad in ('2026-10-21','2026-02-30','10/20/2026'):
            with self.subTest(bad=bad),self.assertRaises(g.DataError): self.valid([row(**{'Last verified':bad})])

    def test_direct_source_and_analysis_required(self):
        for changed in ({'Source URL':'https://official.example/'},{'So-what (1–2 lines, labeled analysis)':'A factual assertion without label'},{'Source URL':'http://official.example/news/a'}):
            with self.subTest(changed=changed),self.assertRaises(g.DataError): self.valid([row(**changed)])

    def test_duplicate_id_and_deal_rejected(self):
        for second in (row(),row(**{'Record ID':'IHB-0002'})):
            with self.subTest(second=second['Record ID']),self.assertRaises(g.DataError): self.valid([row(),second])

    def test_primary_tactic_uses_tiebreak_order(self):
        with self.assertRaisesRegex(g.DataError,'tiebreak'): self.valid([row(**{'Tactic (primary)':'T5','Tactic (secondary)':'T3'})])

    def test_major_secondary_requires_two_source_domains(self):
        secondary=row(**{'Source type':'Secondary'})
        with self.assertRaisesRegex(g.DataError,'two independent'): self.valid([secondary])
        evidence={'IHB-0001':{'seed_kind':'baseline','sources':[{'url':'https://reputable-a.example/news/a','type':'Secondary'},{'url':'https://reputable-b.example/news/b','type':'Secondary'}]}}
        self.assertEqual(len(self.valid([secondary],evidence)),1)

    def test_linkedin_archive_is_mandatory(self):
        linkedin=row(**{'Source type':'Official LinkedIn','Source URL':'https://www.linkedin.com/posts/company-factual-post'})
        with self.assertRaisesRegex(g.DataError,'archive'): self.valid([linkedin])
        ev={'IHB-0001':{'seed_kind':'baseline','linkedin_archive':{'full_text':'The institution named a partner and country.','post_date':'2026-09-01','official_verified':True}}}
        self.assertEqual(len(self.valid([linkedin],ev)),1)

    def test_update_to_old_deal_retains_original_dates(self):
        old=row(Status='Operational',**{'Announcement date':'2019-11-13','Operational date':'2020-01-01'})
        ev={'IHB-0001':{'seed_kind':'backfill','latest_event_date':'2026-09-28'}}
        result=self.valid([old],ev)[0]
        self.assertEqual(result['announcement_date'],'2019-11-13')
        self.assertEqual(result['latest_event_date'],'2026-09-28')

    def test_backfill_window_cannot_be_invented(self):
        old=row(Status='Operational',**{'Announcement date':'2019-11-13'})
        with self.assertRaisesRegex(g.DataError,'12-month'):
            self.valid([old],{'IHB-0001':{'seed_kind':'backfill'}})

    def test_historical_backfill_accepts_both_inclusive_boundaries(self):
        for event_date in ('2025-10-20','2026-10-19'):
            with self.subTest(event_date=event_date):
                result=self.valid([row(Status='Announced',**{'Announcement date':event_date})],{'IHB-0001':{'seed_kind':'backfill'}})[0]
                self.assertEqual(result['latest_event_date'],event_date)
                self.assertEqual(result['source_type'],'Primary')

    def test_historical_backfill_rejects_day_before_start(self):
        with self.assertRaisesRegex(g.DataError,'12-month'):
            self.valid([row(Status='Announced',**{'Announcement date':'2025-10-19'})],{'IHB-0001':{'seed_kind':'backfill'}})

    def test_historical_backfill_rejects_launch_day_and_future(self):
        for event_date,reason in (('2026-10-20','12-month'),('2026-10-21','future')):
            with self.subTest(event_date=event_date),self.assertRaisesRegex(g.DataError,reason):
                self.valid([row(Status='Announced',**{'Announcement date':event_date})],{'IHB-0001':{'seed_kind':'backfill'}})

    def test_month_precision_preserves_blank_days_and_secondary_evidence(self):
        sourced=row(Status='Announced',**{'Tactic (primary)':'T5','Tactic (secondary)':'','Source type':'Secondary','Source date':'2026-02-18'})
        ev={'IHB-0001':{'seed_kind':'backfill','event_date_month':'2026-01'}}
        result=self.valid([sourced],ev)[0]
        self.assertEqual(result['announcement_date'],'')
        self.assertEqual(result['operational_date'],'')
        self.assertEqual(result['latest_event_date'],'')
        self.assertEqual(result['latest_event_month'],'2026-01')
        self.assertEqual(result['event_date_label'],'2026-01 (day not disclosed)')
        self.assertEqual(result['source_date'],'2026-02-18')
        self.assertEqual(result['source_type'],'Secondary')

    def test_month_precision_rejects_months_crossing_backfill_boundaries(self):
        for month in ('2025-10','2026-10'):
            with self.subTest(month=month),self.assertRaisesRegex(g.DataError,'entirely'):
                self.valid([row(Status='Announced')],{'IHB-0001':{'seed_kind':'backfill','event_date_month':month}})

    def test_month_precision_rejects_invalid_month_and_conflicting_day(self):
        for month in ('2026-00','2026-13','2026-1','2026-01-01'):
            with self.subTest(month=month),self.assertRaises(g.DataError):
                self.valid([row(Status='Announced')],{'IHB-0001':{'seed_kind':'backfill','event_date_month':month}})
        with self.assertRaisesRegex(g.DataError,'requires blank'):
            self.valid([row(Status='Announced',**{'Announcement date':'2026-01-15'})],{'IHB-0001':{'seed_kind':'backfill','event_date_month':'2026-01'}})

    def test_sourced_event_history_is_preserved_and_invalid_links_rejected(self):
        history=[{'date':'2025-11-01','summary':'A sourced historical milestone.','source_url':'https://official.example/news/milestone'},{'date':'2026-01','summary':'A sourced month-only update.','source_url':'https://official.example/news/update'}]
        result=self.valid(evidence={'IHB-0001':{'seed_kind':'baseline','events':history}})[0]
        self.assertEqual(result['events'],history)
        for invalid in ({'date':'2026-11-01','summary':'Future event.','source_url':'https://official.example/news/future'},{'date':'2026-01-01','summary':'No direct evidence.','source_url':'https://official.example/'}):
            with self.subTest(invalid=invalid),self.assertRaises(g.DataError):
                self.valid(evidence={'IHB-0001':{'seed_kind':'baseline','events':[invalid]}})

    def test_planned_baseline_remains_explicit(self):
        ev={'IHB-0001':{'seed_kind':'baseline','verified_status':'Announced','scope_note':'Planned project, no opening established.'}}
        r=self.valid([row(Status='Announced')],evidence=ev)[0]
        self.assertEqual(r['status'],'Announced')
        self.assertEqual(r['seed_kind'],'baseline')
        self.assertEqual(r['verified_status'],'Announced')
        self.assertEqual(r['operational_date'],'')

    def test_baseline_is_not_a_lifecycle_and_unknown_is_not_operational(self):
        with self.assertRaisesRegex(g.DataError,'invalid status'):
            self.valid([row(Status='Baseline')])
        self.assertEqual(self.valid()[0]['status'],'Unknown')

    def test_active_advice_does_not_open_a_planned_facility(self):
        ev={'IHB-0001':{'seed_kind':'baseline','facility_status':'Planned','status_note':'Advisory engagement active; hospital planned.'}}
        advice=row(Status='Operational',**{'Tactic (primary)':'T4','Tactic (secondary)':''})
        result=self.valid([advice],ev)[0]
        self.assertEqual(result['facility_status'],'Planned')
        with self.assertRaisesRegex(g.DataError,'conflicts'):
            self.valid([row(Status='Operational',**{'Tactic (primary)':'T1','Tactic (secondary)':''})],ev)

    def test_research_taxonomy_and_region_split_are_validated(self):
        research=row(Country='Nigeria',Region='Africa',**{'Tactic (primary)':'T10','Tactic (secondary)':''})
        self.assertEqual(self.valid([research])[0]['tactic_primary'],'T10')
        self.assertEqual(self.valid([row(Country='Jordan',Region='Middle East (non-GCC)')])[0]['region'],'Middle East (non-GCC)')
        self.assertEqual(self.valid([row(Country='Armenia',Region='Middle East (non-GCC)')])[0]['region'],'Middle East (non-GCC)')
        self.assertEqual(self.valid([row(**{'Tactic (primary)':'T11','Tactic (secondary)':'T4'})])[0]['tactic_primary'],'T11')
        with self.assertRaisesRegex(g.DataError,'tiebreak'):
            self.valid([row(**{'Tactic (primary)':'T4','Tactic (secondary)':'T11'})])
        with self.assertRaisesRegex(g.DataError,'country/region'):
            self.valid([row(Country='Jordan',Region='Other')])

class ReproducibleProjections(unittest.TestCase):
    def setup_root(self,path):
        for directory in ('data','briefs','institutions'): (path/directory).mkdir()
        (path/'data/institutions.json').write_text(json.dumps(INSTITUTIONS))
        (path/'data/tracker.csv').write_text(csv_text([row(Institution='Mass General Brigham; Dana-Farber Cancer Institute')]))
        (path/'data/evidence.json').write_text(json.dumps({'IHB-0001':{'seed_kind':'baseline','scope_note':'Sourced baseline example.'}}))

    def test_generation_idempotency_profiles_and_empty_archive(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);self.setup_root(root)
            first,counts=g.build(root)
            for p,content in first.items(): p.parent.mkdir(parents=True,exist_ok=True);p.write_text(content)
            second,counts2=g.build(root)
            self.assertEqual(first,second)
            self.assertEqual(counts,counts2)
            tracker=json.loads(first[root/'data/tracker.json'])
            self.assertEqual(tracker['backfill_start'],'2025-10-20')
            self.assertEqual(tracker['backfill_end'],'2026-10-19')
            self.assertEqual(tracker['launch_date'],'2026-10-20')
            self.assertEqual(counts['records'],1)
            self.assertEqual(counts['institutions_with_records'],2)
            self.assertEqual(json.loads(first[root/'data/briefs.json']),{'editions':[]})
            for name in ('Mass General Brigham','Dana-Farber Cancer Institute'):
                self.assertIn('IHB-0001',first[root/'institutions'/f'{g.slug(name)}.md'])
            self.assertEqual(len(list((root/'institutions').glob('*.md'))),19)
            self.assertFalse((root/'briefs/2026-10-20.md').exists())

    def test_edition_cannot_override_tracker_geography(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);self.setup_root(root)
            (root/'briefs/2026-10-20.md').write_text('# 2026-10-20\nIHB-0001\n## Market Signals\n## Tracker changes\nIHB-0001\n')
            (root/'briefs/2026-10-20.json').write_text(json.dumps({'date':'2026-10-20','headline':'Example','items':[{'record_id':'IHB-0001','country':'Vietnam','summary':['A.','B.','C.'],'analysis':['A.','B.'],'source_urls':['https://official.example/news/agreement']}]}))
            with self.assertRaisesRegex(g.DataError,'differs from tracker'): g.build(root)

    def test_empty_edition_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);self.setup_root(root)
            (root/'briefs/2026-10-20.md').write_text('# 2026-10-20\n## Market Signals\n## Tracker changes\n')
            (root/'briefs/2026-10-20.json').write_text(json.dumps({'date':'2026-10-20','headline':'Example','items':[]}))
            with self.assertRaisesRegex(g.DataError,'empty editions'): g.build(root)

if __name__=='__main__': unittest.main()
