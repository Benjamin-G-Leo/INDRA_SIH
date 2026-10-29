"""The dashboard export must follow the schema the dashboard validates (dashboard_prototype_2/lib/data-source.ts)."""
import os, sqlite3, subprocess, sys, tempfile, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import export_dashboard as X


class ExportTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        db = os.path.join(cls.tmp.name, "t.db")
        r = subprocess.run([sys.executable, os.path.join(ROOT, "ingest.py"), "--reset", "--db", f"sqlite:///{db}"], capture_output=True, text=True, cwd=ROOT)
        assert r.returncode == 0, r.stderr
        cls.ds = X.build(sqlite3.connect(db), max_incidents=25, use_model=False)

    @classmethod
    def tearDownClass(cls): cls.tmp.cleanup()

    def test_schema_and_counts(self):
        d = self.ds
        self.assertEqual(d["schemaVersion"], "1.0.0")
        self.assertTrue(0 < len(d["incidents"]) <= 25)
        ids = [i["incidentId"] for i in d["incidents"]]
        self.assertEqual(len(ids), len(set(ids)))

    def test_alerts_reference_incidents_and_have_official_severity(self):
        d = self.ds; ids = {i["incidentId"] for i in d["incidents"]}
        for a in d["alerts"]:
            self.assertIn(a["incidentId"], ids)
            self.assertIn(a["severity"], ("critical", "high", "moderate"))

    def test_everything_is_marked_synthetic(self):
        d = self.ds
        for rec in d["incidents"] + d["alerts"] + d["sourceRecords"]: self.assertTrue(rec["isSynthetic"])

    def test_supporting_posts_are_exported_and_confidence_in_range(self):
        d = self.ds; posts = {r["sourceRecordId"] for r in d["sourceRecords"] if r["kind"] == "public"}
        for i in d["incidents"]:
            self.assertEqual(i["sourceCount"], len(i["supportingSourceIds"]))
            self.assertTrue(set(i["supportingSourceIds"]) <= posts)
            self.assertTrue(0 <= i["confidence"] <= 100)
            self.assertTrue(-90 <= i["latitude"] <= 90 and 60 <= i["longitude"] <= 100)


if __name__ == "__main__":
    unittest.main()
