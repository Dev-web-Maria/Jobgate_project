import json, sys
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer, util
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# pour éviter l'erreur cp1252 sur Windows
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

EMB_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
CE_MODEL  = "cross-encoder/ms-marco-MiniLM-L-6-v2"

_emb = None
_ce_tok = None
_ce = None

def _load():
    global _emb, _ce_tok, _ce
    if _emb is None:
        _emb = SentenceTransformer(EMB_MODEL)
    if _ce is None:
        _ce_tok = AutoTokenizer.from_pretrained(CE_MODEL)
        _ce = AutoModelForSequenceClassification.from_pretrained(CE_MODEL)

def _cos(q: str, a: str) -> float:
    _load()
    em = _emb.encode([q, a], convert_to_tensor=True, normalize_embeddings=True)
    return float(util.cos_sim(em[0], em[1]).item())  # [-1..1]

@torch.no_grad()
def _ce_score(q: str, a: str) -> float:
    _load()
    tok = _ce_tok(q, a, truncation=True, max_length=256, return_tensors="pt")
    logits = _ce(**tok).logits
    return float(torch.sigmoid(logits.squeeze()).item() if logits.numel()==1 else torch.softmax(logits, dim=-1)[0,1].item())

def _to10(x: float) -> float:
    y = max(0.0, min(1.0, (x - 0.2) / 0.8))  # seuil un peu sévère
    return round(10*y, 1)

def score_pair(q: str, a: str) -> Dict[str, float]:
    if not a or len(a.strip()) < 3:
        return {"sim": 0.0, "ce": 0.0, "final": 0.0, "out_of_10": 0.0}
    sim = (_cos(q, a) + 1)/2.0
    ce  = _ce_score(q, a)
    final = 0.65*ce + 0.35*sim
    return {"sim": round(sim,3), "ce": round(ce,3), "final": round(final,3), "out_of_10": _to10(final)}

def score_qa(questions: List[Dict[str,Any]], transcript: str) -> Dict[str,Any]:
    # Découpage simple si pas de timestamps : parts égales
    parts = max(1, len(questions))
    step = max(1, len(transcript)//parts)
    items = []
    out = []
    for i, q in enumerate(questions):
        qtext = (q.get("question") or "").strip()
        ans = transcript[i*step:(i+1)*step]
        s = score_pair(qtext, ans)
        items.append({
            "idx": i,
            "question": qtext,
            "answer_preview": ans[:180],
            "scores": s
        })
        out.append(s["out_of_10"])
    avg = round(sum(out)/len(out), 1) if out else 0.0
    return {"avg_out_of_10": avg, "items": items}

if __name__ == "__main__":
    qpath = sys.argv[1]
    tpath = sys.argv[2]
    questions = json.load(open(qpath, "r", encoding="utf-8"))
    transcript = open(tpath, "r", encoding="utf-8").read()
    print(json.dumps(score_qa(questions, transcript), ensure_ascii=False))
