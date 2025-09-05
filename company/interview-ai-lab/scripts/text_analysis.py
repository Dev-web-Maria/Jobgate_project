# scripts/text_analysis.py
import os, sys, json

# Forcer Transformers à ignorer TensorFlow/Keras (on tourne en PyTorch)
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["USE_TORCH"] = "1"

# 🔐 Forcer la sortie standard en UTF-8 (corrige UnicodeEncodeError sous Windows)
try:
    sys.stdout.reconfigure(encoding="utf-8")  # Python 3.7+
except Exception:
    pass

from transformers import pipeline

# Modèles légers CPU
SENT_MODEL = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
SUM_MODEL  = "sshleifer/distilbart-cnn-12-6"

def _read_text(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception:
        return ""

def _dynamic_lengths(n_chars: int) -> tuple[int, int]:
    """
    Détermine (max_length, min_length) pour le résumeur selon la taille du texte.
    Empêche le warning: "max_length 120 mais input_length 8".
    """
    if n_chars < 120:         # très court -> pas de résumé
        return (0, 0)
    # heuristiques simples
    max_len = min(180, max(40, n_chars // 15))
    min_len = min(60, max(20, n_chars // 40))
    if min_len >= max_len:
        min_len = max_len // 2
    return (max_len, min_len)

def analyze_text(text_path: str) -> dict:
    text = _read_text(text_path)
    if not text:
        return {"sentiment": {}, "summary": ""}

    sent_pipe = pipeline(
        "sentiment-analysis",
        model=SENT_MODEL,
        framework="pt",
        device=-1,
        truncation=True,
    )
    sum_pipe = pipeline(
        "summarization",
        model=SUM_MODEL,
        framework="pt",
        device=-1,
    )

    # Sentiment sur un extrait raisonnable
    sample_for_sent = text[:2000]

    # Résumé : dynamique selon la longueur
    max_len, min_len = _dynamic_lengths(len(text))
    if max_len == 0:  # texte trop court pour résumer proprement
        summary_text = text
    else:
        sample_for_sum = text[:3000]
        summary = sum_pipe(
            sample_for_sum,
            max_length=max_len,
            min_length=min_len,
            do_sample=False,
        )
        summary_text = summary[0]["summary_text"] if summary else ""

    try:
        sentiment = sent_pipe(sample_for_sent)[0]
    except Exception as e:
        sentiment = {"error": f"sentiment_failed: {e}"}

    return {"sentiment": sentiment, "summary": summary_text}

if __name__ == "__main__":
    p = sys.argv[1]
    print(json.dumps(analyze_text(p), ensure_ascii=False))
