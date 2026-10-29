"""The hazard text model.  Lives in its own module so a saved model can be loaded from any script (pickle stores the class path)."""
from scipy.sparse import hstack
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression


class HazardModel:
    def __init__(self):
        self.word = TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True, lowercase=True)
        self.char = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), min_df=3, sublinear_tf=True, lowercase=True)
        self.clf = LogisticRegression(C=8, max_iter=2000, class_weight="balanced")

    def _x(self, texts, fit=False):
        f = (lambda v: v.fit_transform(texts)) if fit else (lambda v: v.transform(texts))
        return hstack([f(self.word), f(self.char)]).tocsr()

    def fit(self, texts, labels): self.clf.fit(self._x(texts, fit=True), labels); return self

    def predict(self, texts):
        if not texts: return []
        proba = self.clf.predict_proba(self._x(texts))
        idx = proba.argmax(axis=1)
        return [(str(self.clf.classes_[i]), round(float(p[i]), 3)) for i, p in zip(idx, proba)]
