"""
Train the hazard text classifier on public_clean and compare it with the rule tagger.

  pip install scikit-learn joblib
  python ingest.py --reset                  # fills weather_platform.db (once)
  python train_classifier.py                # trains, prints a report, saves models/hazard_clf.joblib

Model: TF-IDF (word 1-2 grams + character 2-5 grams, so typos and Hinglish still match) -> logistic regression.
Trained on rows with data_split = 'train', tuned on 'val', scored once on 'test'.
tests/hand_labeled.csv is a small set written by hand (not by the generator) - the most honest score here.

Use it elsewhere:
  from train_classifier import load_model, predict
  predict(load_model(), ["Heavy rain in Pune, roads waterlogged"])   # -> [("Heavy Rainfall", 0.93)]
"""
import argparse, csv, os, sqlite3
from collections import Counter

import joblib
from sklearn.metrics import accuracy_score, classification_report, f1_score

import processing as P
from hazard_model import HazardModel

MODEL_PATH = os.path.join("models", "hazard_clf.joblib")
HAND_PATH = os.path.join("tests", "hand_labeled.csv")


def load_model(path=MODEL_PATH):
    # joblib = pickle: only load model files you trained yourself (never one downloaded from someone else)
    return joblib.load(path)


def predict(model, raw_texts):
    """Raw post text -> [(hazard, probability)].  Applies the same cleaning as the pipeline."""
    return model.predict([P.clean_text(t)["text_clean"] for t in raw_texts])


def load_split(db, split):
    q = "SELECT text_clean, hazard_label, hazard_rule FROM public_clean WHERE data_split=? AND hazard_label IS NOT NULL AND hazard_label<>''"
    return db.execute(q, (split,)).fetchall()


def load_hand(path=HAND_PATH):
    with open(path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    texts = [P.clean_text(r["text"])["text_clean"] for r in rows]
    return texts, [r["label"] for r in rows], [P.classify_hazard(t)[0] for t in texts]


def score(name, y, ml, rule):
    """Accuracy / macro-F1 of: rules alone (uncovered = wrong), model alone, hybrid (rule if it fired, else model)."""
    hybrid = [r if r else m for r, m in zip(rule, ml)]
    covered = [i for i, r in enumerate(rule) if r]
    print(f"\n{name}  (n={len(y)}, rules fire on {len(covered) / len(y):.0%})")
    for label, pred in (("rules only", [r or "?" for r in rule]), ("model only", ml), ("hybrid   ", hybrid)):
        print(f"  {label}  accuracy {accuracy_score(y, pred):.3f}   macro-F1 {f1_score(y, pred, average='macro', zero_division=0):.3f}")
    miss = [i for i, r in enumerate(rule) if not r]
    if miss: print(f"  on the {len(miss)} posts the rules could not tag: model accuracy {sum(ml[i] == y[i] for i in miss) / len(miss):.3f}")
    return hybrid


def main(a):
    db = sqlite3.connect(a.db)
    sets = {s: load_split(db, s) for s in ("train", "val", "test")}
    print({s: len(r) for s, r in sets.items()}, "labelled public posts")
    tr = sets["train"]
    if not tr: raise SystemExit("no labelled training rows - run  python ingest.py --reset  first")
    model = HazardModel().fit([r[0] for r in tr], [r[1] for r in tr])

    for split in ("val", "test"):
        rows = sets[split]
        texts, y, rule = [r[0] for r in rows], [r[1] for r in rows], [r[2] for r in rows]
        score(f"{split} split (synthetic)", y, [p for p, _ in model.predict(texts)], rule)

    if os.path.exists(HAND_PATH):
        texts, y, rule = load_hand()
        ml = [p for p, _ in model.predict(texts)]
        score("HAND-WRITTEN set (honest score)", y, ml, rule)
        wrong = [(t, a_, b) for t, a_, b in zip(texts, y, ml) if a_ != b]
        print(f"\n  model mistakes on hand set ({len(wrong)}):")
        for t, true, pred in wrong[:15]: print(f"    true={true:<24} pred={pred:<24} {t[:70]}")
        conf = Counter((a_, b) for _, a_, b in wrong).most_common(5)
        if conf: print("  most common mix-ups:", conf)
        if a.report: print("\n" + classification_report(y, ml, zero_division=0))

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print("\nsaved ->", MODEL_PATH)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="weather_platform.db")
    ap.add_argument("--report", action="store_true", help="per-hazard precision/recall on the hand set")
    main(ap.parse_args())
