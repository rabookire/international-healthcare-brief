"""Publishing must preserve every reader route and all map dependencies."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('package_site',ROOT/'scripts/package_site.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class PublicPackage(unittest.TestCase):
    def test_required_reader_assets_are_staged(self):
        required=['index.html','map/index.html','methodology/index.html','data/index.html','briefs/index.html','institutions/index.html','markets/index.html','compare/index.html','coverage/index.html','updates/index.html','assets/app.mjs','assets/core.mjs','assets/research.mjs','assets/record-view.mjs','assets/pages.mjs','assets/styles.css','assets/world.geojson','assets/places.json','assets/favicon.svg','data/tracker.json','data/institutions.json','data/evidence.json','data/coverage.json','data/briefs.json','METHODOLOGY.md','assets/map-camera.mjs','assets/icons/search.svg','assets/icons/LICENSE.txt']
        with tempfile.TemporaryDirectory() as d:
            r=Path(d)
            for name in required:
                target=r/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_text('test')
            (r/'tests').mkdir();(r/'tests/private.txt').write_text('not public')
            (r/'assets/.private').write_text('not public')
            (r/'design-qa.md').write_text('engineering history')
            (r/'RUNBOOK.md').write_text('engineering runbook')
            out=module.package(r)
            for name in required:self.assertTrue((out/name).is_file(),name)
            self.assertFalse((out/'tests').exists())
            self.assertFalse((out/'assets/.private').exists())
            self.assertFalse((out/'design-qa.md').exists())
            self.assertFalse((out/'RUNBOOK.md').exists())
            self.assertTrue((out/'.nojekyll').is_file())
