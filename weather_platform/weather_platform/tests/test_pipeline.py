"""Regression tests.  Run:  python -m unittest discover -s tests -v   (from the project folder)"""
import csv, os, sqlite3, subprocess, sys, tempfile, unittest
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import processing as P

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def pub(text, **kw):
    row = dict(record_id="P1", source="twitter", source_handle="@a", posted_at="2024-07-01T10:00:00+05:30", text=text,
               state="", district="", latitude="", longitude="", followers="500", likes="1", shares="1", has_media="0")
    row.update(kw); r = P.parse_public(row); return r


class Parsing(unittest.TestCase):
    def test_timestamps(self):
        self.assertEqual(P.parse_timestamp("2024-07-01T10:00:00+05:30"), datetime(2024, 7, 1, 4, 30))
        self.assertEqual(P.parse_timestamp("19 Jun 2024 10:16 IST"), datetime(2024, 6, 19, 4, 46))
        self.assertEqual(P.parse_timestamp("01-07-2024 10:00"), datetime(2024, 7, 1, 4, 30))
        self.assertEqual(P.parse_timestamp("1700000000"), datetime(2023, 11, 14, 22, 13, 20))
        self.assertIsNone(P.parse_timestamp("not a date")); self.assertIsNone(P.parse_timestamp("1990-01-01T00:00:00"))

    def test_units(self):
        self.assertAlmostEqual(P.parse_number("112.5 F", "temp"), 44.72, 2)
        self.assertAlmostEqual(P.parse_number("31 kt", "wind"), 57.41, 2)
        self.assertEqual(P.parse_number("12 cm", "rain"), 120.0)
        self.assertIsNone(P.parse_number("n/a", "x")); self.assertIsNone(P.parse_number("abc", "x"))


class Geography(unittest.TestCase):
    def test_hinglish_gaya_is_not_a_city(self):
        self.assertEqual(P.find_place("sadak pe paani bhar gaya"), (None, None))
        self.assertEqual(P.find_place("aaj puri sabzi khayi"), (None, None))
        self.assertEqual(P.find_place("Flood in Gaya today"), ("Bihar", "Gaya"))

    def test_aliases(self):
        self.assertEqual(P.find_place("heavy rain in Bangalore"), ("Karnataka", "Bengaluru"))
        self.assertEqual(P.norm_state("Orissa"), "Odisha")

    def test_bad_coordinates_fall_back_to_centroid(self):
        st, d, lat, lon, prec, flags = P.resolve_geo("Kerala", "Kochi", "0", "0")
        self.assertEqual(prec, "district_centroid"); self.assertIn("bad_coordinates", flags)


class Text(unittest.TestCase):
    def test_language(self):
        self.assertEqual(P.detect_language("Ludhiana near railway station में जमीन पर पाला"), "hi")
        self.assertEqual(P.detect_language("Patna me bahut tez barish, sadak band hai"), "hi-Latn")
        self.assertEqual(P.detect_language("Heavy rain in Patna"), "en")

    def test_hashtags_without_spaces_are_matched(self):
        for tag, hz in [("#HeavyRainfall", "Heavy Rainfall"), ("#DustRaisingWinds", "Dust-Raising Winds"), ("#HotAndHumid", "Hot & Humid")]:
            self.assertEqual(P.classify_hazard(P.clean_text("Situation update " + tag)["text_clean"])[0], hz, tag)

    def test_thunder_and_lightning(self):
        self.assertEqual(P.classify_hazard("Thunder, lightning and rain pounding Hyderabad")[0], "Thunderstorm & Lightning")

    def test_rain_class_from_mm(self):
        self.assertEqual(P.classify_hazard("heavy rainfall in Pune, 130 mm recorded")[0], "Very Heavy Rainfall")


class Filters(unittest.TestCase):
    def test_spam(self):
        self.assertGreaterEqual(P.spam_score(pub("Heavy rain offer! Buy raincoats at 70% OFF, click bit.ly/abc123")), P.SPAM_THRESHOLD)
        self.assertLess(P.spam_score(pub("Flood in Patna, free food and shelter at the school, call 1070")), P.SPAM_THRESHOLD)

    def _verdict(self, text):
        r = pub(text); h, s, c, ev = P.classify_hazard(r["text_clean"]); return P.relevance(r, ev)[1]

    def test_relevance(self):
        self.assertEqual(self._verdict("Cyclone is the name of my new playlist, go stream it"), "irrelevant")
        self.assertEqual(self._verdict("Just watched the movie Flood, a storm of emotions"), "irrelevant")
        self.assertEqual(self._verdict("Dust raising winds across Bikaner near the main market, dusty haze"), "relevant")
        self.assertEqual(self._verdict("Cricket stopped, players off due to thunderstorm and lightning at Mumbai"), "relevant")

    def test_near_duplicate_needs_same_numbers(self):
        a = pub("Heavy rainfall in Pune since morning, 110 mm recorded, waterlogging", record_id="A")
        b = pub("Heavy rainfall in Pune since morning, 101 mm recorded, waterlogging", record_id="B", source_handle="@b", posted_at="2024-07-01T10:30:00+05:30")
        c = pub("Heavy rainfall in Pune since morning, 110 mm recorded, waterlogging urgent", record_id="C", source_handle="@c", posted_at="2024-07-01T10:40:00+05:30")
        for r in (a, b, c): r["hazard_rule"] = None
        kept, dups = P.dedupe_public([a, b, c])
        self.assertEqual({d[0]["record_id"] for d in dups}, {"C"}); self.assertEqual(len(kept), 2)


class Ingest(unittest.TestCase):
    def run_ingest(self, tmp, db, *extra):
        return subprocess.run([sys.executable, os.path.join(ROOT, "ingest.py"), "--imd", f"{tmp}/imd.csv", "--public", f"{tmp}/pub.csv",
                               "--db", f"sqlite:///{db}", *extra], capture_output=True, text=True, cwd=ROOT)

    def write(self, path, header, rows):
        with open(path, "w", newline="", encoding="utf-8") as f: w = csv.writer(f); w.writerow(header); w.writerows(rows)

    def test_missing_ids_and_conflicts_do_not_crash(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = f"{tmp}/t.db"
            self.write(f"{tmp}/imd.csv", ["source", "state", "district", "hazard_type", "valid_at"], [["IMD", "Kerala", "Kochi", "Heavy Rain", "2024-07-01T10:00:00+05:30"]])
            self.write(f"{tmp}/pub.csv", ["record_id", "source", "text", "posted_at"],
                       [["P1", "twitter", "Heavy rain in Kochi, roads waterlogged", "2024-07-01T10:00:00+05:30"],
                        ["P1", "twitter", "Heavy rain in Kochi, roads badly waterlogged now", "2024-07-01T11:00:00+05:30"]])
            r = self.run_ingest(tmp, db, "--reset"); self.assertEqual(r.returncode, 0, r.stderr)
            c = sqlite3.connect(db)
            self.assertEqual(c.execute("select count(*) from public_clean").fetchone()[0], 1)
            reasons = {x[0] for x in c.execute("select reason from rejected_records")}
            self.assertEqual(reasons, {"missing_record_id", "record_id_conflict"})

    def test_corrected_record_on_rerun(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = f"{tmp}/t.db"; hdr = ["record_id", "source", "state", "district", "hazard_type", "valid_at", "rainfall_mm_24h"]
            self.write(f"{tmp}/pub.csv", ["record_id", "text", "posted_at"], [])
            self.write(f"{tmp}/imd.csv", hdr, [["I1", "IMD", "Kerala", "Kochi", "Heavy Rain", "2024-07-01T10:00:00+05:30", "80"]])
            self.assertEqual(self.run_ingest(tmp, db, "--reset").returncode, 0)
            self.write(f"{tmp}/imd.csv", hdr, [["I1", "IMD", "Kerala", "Kochi", "Heavy Rain", "2024-07-01T10:00:00+05:30", "85"]])
            r = self.run_ingest(tmp, db); self.assertEqual(r.returncode, 0, r.stderr)
            c = sqlite3.connect(db)
            self.assertEqual(c.execute("select count(*), min(rainfall_mm_24h) from imd_clean").fetchone(), (1, 80.0))
            self.assertEqual(c.execute("select reason from rejected_records").fetchone()[0], "record_id_conflict")

    def test_header_only_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.write(f"{tmp}/imd.csv", ["record_id"], []); self.write(f"{tmp}/pub.csv", ["record_id", "text"], [])
            self.assertEqual(self.run_ingest(tmp, f"{tmp}/t.db", "--reset").returncode, 0)


if __name__ == "__main__":
    unittest.main()
