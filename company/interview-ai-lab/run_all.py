# run_all.py — pipeline complet optimisé 5–10min
import os, sys, json, math, argparse, subprocess

# ------------------------------------------------------------
# Utilitaires sous-processus (inchangé)
# ------------------------------------------------------------
def run_py(args):
    """
    Lance un script Python enfant en capturant stdout/stderr.
    Usage: run_py(["scripts/XXX.py", arg1, arg2, ...])  -> retourne stdout.strip()
    """
    try:
        res = subprocess.run([sys.executable] + args, capture_output=True, text=True, check=True)
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        print("=== ERREUR sous-processus ===", file=sys.stderr)
        print("STDOUT:\n", e.stdout, file=sys.stderr)
        print("STDERR:\n", e.stderr, file=sys.stderr)
        raise

def _clamp(x, lo, hi): 
    try:
        return max(lo, min(hi, float(x)))
    except Exception:
        return lo

# ------------------------------------------------------------
# Scoring historique (ton existant) — conservé tel quel ici.
# On pourra préférer scripts/scoring.compute_scores s'il existe.
# ------------------------------------------------------------
WEIGHTS = {"verbal": 40.0, "paraverbal": 20.0, "nonverbal": 40.0}

def _score_wpm(wpm):
    if wpm is None: return 0.0
    if wpm <= 80 or wpm >= 200: return 0.0
    if wpm <= 120: return 12.0 * (wpm - 80) / 40.0
    if wpm <= 160: return 12.0
    return 12.0 * (200.0 - wpm) / 40.0

def _score_silence(silence_sec, duration_sec):
    if not duration_sec or silence_sec is None: return 0.0
    r = silence_sec / max(1e-6, duration_sec)
    if r <= 0.1: return 5.0
    if r >= 0.5: return 0.0
    return 5.0 * (0.5 - r) / 0.4

def _score_fillers(n_fillers, duration_sec):
    if duration_sec is None or n_fillers is None or duration_sec <= 0: return 0.0
    per_min = n_fillers / (duration_sec / 60.0)
    if per_min <= 1.0: return 3.0
    if per_min >= 8.0: return 0.0
    return 3.0 * (8.0 - per_min) / 7.0

def _score_eye_contact(ratio): 
    return 20.0 * _clamp((ratio or 0.0), 0.0, 1.0)

def _score_nods(nods, duration_sec):
    if duration_sec is None or duration_sec <= 0 or nods is None: return 0.0
    npm = nods / (duration_sec / 60.0)
    if npm <= 0: return 0.0
    if npm <= 2: return 5.0 * (npm / 2.0)
    if npm <= 8: return 5.0 + 5.0 * ((npm - 2.0) / 6.0)
    if npm <= 16: return 10.0 - 5.0 * ((npm - 8.0) / 8.0)
    if npm <= 24: return 5.0 - 5.0 * ((npm - 16.0) / 8.0)
    return 0.0

def _score_emotion_variability(dist: dict, max_points: float = 10.0):
    if not dist: return 0.0
    p = [max(1e-9, float(v)) for v in dist.values()]
    s = sum(p)
    if s <= 0: return 0.0
    p = [x / s for x in p]
    H = -sum(x * math.log(x) for x in p)
    Hmax = math.log(len(p))
    return _clamp(max_points * (H / Hmax), 0.0, max_points)

def _baseline_verbal_from_length(text: str):
    if not text: return 0.0
    wc = max(0, len([w for w in text.split() if w.strip()]))
    if wc <= 50: return 0.0
    if wc >= 250: return 40.0
    return 40.0 * (wc - 50) / 200.0

def compute_scores_local(report: dict) -> dict:
    """
    >>> Ton scoring historique (inchangé) <<<
    """
    speech = report.get("speech", {}) or {}
    nonv   = report.get("nonverbal", {}) or {}
    duration = speech.get("duration_sec")

    paraverbal = _clamp(
        _score_wpm(speech.get("wpm")) +
        _score_silence(speech.get("silence_sec"), duration) +
        _score_fillers(speech.get("fillers"), duration),
        0.0, WEIGHTS["paraverbal"]
    )

    nonverbal = _score_eye_contact(nonv.get("eye_contact_ratio")) + _score_nods(nonv.get("nods"), duration)

    # mini-score émotion optionnel (entropie)
    if os.getenv("EMOTIONS_IN_SCORE", "0").lower() in ("1","true","yes"):
        emo_dist = (nonv.get("emotions") or {}).get("distribution", {})
        nonverbal += _score_emotion_variability(emo_dist, max_points=10.0)
    nonverbal = _clamp(nonverbal, 0.0, WEIGHTS["nonverbal"])

    qa = report.get("qa") or {}
    if "verbal_from_qa" in qa:
        verbal = qa["verbal_from_qa"]
    else:
        verbal = _baseline_verbal_from_length(report.get("transcript", "") or "")
    verbal = _clamp(verbal, 0.0, WEIGHTS["verbal"])

    total = round(verbal + paraverbal + nonverbal, 1)
    return {"verbal": round(verbal,1), "paraverbal": round(paraverbal,1), "nonverbal": round(nonverbal,1), "total": total}

# ------------------------------------------------------------
# NOUVEAU : si scripts/scoring.py existe, on l'utilise (pénalités + garde-fous).
# Sinon on retombe sur compute_scores_local.
# ------------------------------------------------------------
def _pick_scoring():
    try:
        from scripts.scoring import compute_scores as compute_scores_v2  # pénalités + quality flags
        return compute_scores_v2
    except Exception:
        return compute_scores_local

compute_scores = _pick_scoring()

# ------------------------------------------------------------
# Main pipeline
# ------------------------------------------------------------
def main(video, sample_fps=2, smooth_win=3, emo_max_timeline=1000, emo_max_width=960,
         stt_model="Systran/faster-whisper-base", stt_compute="int8", stt_beam=1, stt_lang=None,
         questions_path=None):
    os.makedirs("outputs", exist_ok=True)

    # Stabilité OpenMP sous Windows
    os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
    os.environ.setdefault("OMP_NUM_THREADS", "1")
    os.environ.setdefault("PYTHONIOENCODING", "UTF-8")  # pour éviter les UnicodeEncodeError sur Windows

    # 1) Audio
    audio_path = "outputs/sample.wav"
    run_py(["scripts/extract_audio.py", video, audio_path])

    # 2) Transcription (rapide)
    transcript_path = "outputs/transcript.txt"
    run_py([
        "scripts/transcribe.py", audio_path, transcript_path,
        "--model", stt_model, "--device", "cpu",
        "--compute", stt_compute, "--beam", str(stt_beam)
    ] + (["--lang", stt_lang] if stt_lang else []))

    # 3) Paraverbal
    speech_json = run_py(["scripts/speech_metrics.py", audio_path, transcript_path])
    speech = json.loads(speech_json) if speech_json else {}

    # 4) Texte (sentiment/résumé)
    text_json = run_py(["scripts/text_analysis.py", transcript_path])
    text_metrics = json.loads(text_json) if text_json else {}

    # 5) Non-verbal : émotions (rapide) + gaze/nods
    emotions_json = run_py([
        "scripts/face_emotions_onnx.py", video,
        "--sample-fps", str(sample_fps),
        "--smooth-win", str(smooth_win),
        "--max-timeline", str(emo_max_timeline),
        "--max-width", str(emo_max_width),
    ])
    emotions = json.loads(emotions_json) if emotions_json else {}

    gaze_out = run_py(["scripts/gaze_nods.py", video])
    try:
        # gaze_nods.py peut renvoyer un dict formaté Python; on tente JSON d'abord
        gaze = json.loads(gaze_out)
    except Exception:
        # fallback sur eval si nécessaire (comportement historique)
        gaze = eval(gaze_out)

    # --- Construction report (comme avant)
    with open(transcript_path, "r", encoding="utf-8") as fh:
        transcript_txt = fh.read()

    report = {
        "transcript": transcript_txt,
        "speech": speech,
        "text": text_metrics,
        "nonverbal": {**gaze, "emotions": emotions},
    }

    # --------------------------------------------------------
    # NOUVEAU (optionnel) : pertinence Question ↔ Réponse
    # Si --questions est fourni ET scripts/qa_relevance.py existe,
    # on calcule un score et on le mappe vers la composante "verbal".
    # --------------------------------------------------------
    qa_scores = None
    if questions_path and os.path.exists(questions_path):
        qa_script = os.path.join("scripts", "qa_relevance.py")
        if os.path.exists(qa_script):
            try:
                qa_json = run_py([qa_script, questions_path, transcript_path])
                qa_scores = json.loads(qa_json) if qa_json else {}
                # Exemple : moyenne /10 projetée vers la part "verbal" (0..40)
                verbal_from_qa = (float(qa_scores.get("avg_out_of_10", 0.0)) / 10.0) * WEIGHTS["verbal"]
                report["qa"] = {
                    "verbal_from_qa": round(verbal_from_qa, 1),
                    "scores": qa_scores
                }
            except Exception as e:
                report["qa_error"] = str(e)

    # 6) Scoring final (utilise V2 si dispo, sinon local)
    report["scores"] = compute_scores(report)

    # 7) Sortie JSON
    out_path = "outputs/report.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(out_path)

# ------------------------------------------------------------
# CLI
# ------------------------------------------------------------
if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True, help="Chemin vers la vidéo")
    # Émotions
    ap.add_argument("--sample-fps", type=int, default=int(os.getenv("EMO_SAMPLE_FPS","2")))
    ap.add_argument("--smooth-win", type=int, default=int(os.getenv("EMO_SMOOTH_WIN","3")))
    ap.add_argument("--emo-max-timeline", type=int, default=int(os.getenv("EMO_MAX_TIMELINE","1000")))
    ap.add_argument("--emo-max-width", type=int, default=int(os.getenv("EMO_MAX_WIDTH","960")))
    # STT
    ap.add_argument("--stt-model", default=os.getenv("STT_MODEL","Systran/faster-whisper-base"))
    ap.add_argument("--stt-compute", default=os.getenv("STT_COMPUTE","int8"))
    ap.add_argument("--stt-beam", type=int, default=int(os.getenv("STT_BEAM","1")))
    ap.add_argument("--stt-lang", default=os.getenv("STT_LANG", None))
    # NOUVEAU : questions (optionnel)
    ap.add_argument("--questions", default=None, help="Chemin JSON des questions (optionnel)")

    args = ap.parse_args()

    main(
        args.video, args.sample_fps, args.smooth_win, args.emo_max_timeline, args.emo_max_width,
        args.stt_model, args.stt_compute, args.stt_beam, args.stt_lang,
        questions_path=args.questions
    )
