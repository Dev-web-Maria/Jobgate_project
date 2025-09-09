import React, { useState, useRef, useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000/api/entretiens";

const MAX_RESPONSE_TIME = 60;
const READ_SECONDS = 30;
const ffmpeg = new FFmpeg();

// Animations
const fadeIn = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}`;
const pulse = keyframes`
  0%{transform:scale(1);box-shadow:0 0 0 0 rgba(74,111,165,.7)}
  50%{transform:scale(1.02)}
  70%{box-shadow:0 0 0 16px rgba(74,111,165,0)}
  100%{transform:scale(1);box-shadow:0 0 0 0 rgba(74,111,165,0)}
`;
const spin = keyframes`to{transform:rotate(360deg)}`;

// Top/Progress
const Container = styled.div`font-family:'Inter',system-ui,sans-serif;background:#f3f6fb;min-height:100vh;color:#1f2a44;`;
const Welcome = styled.div`max-width:1100px;margin:0 auto;padding:18px 16px 0;font-size:1.35rem;font-weight:700;color:#004085;`;
const ProgressBarContainer = styled.div`width:100%;padding:0 16px 18px;`;
const ProgressBarWrapper = styled.div`max-width:1100px;margin:0 auto;display:flex;gap:18px;align-items:center;`;
const ProgressBarBg = styled.div`flex:1;height:7px;background:#f1f5f9;border-radius:6px;overflow:hidden;`;
const ProgressBarFill = styled.div`
  height:100%;width:${p=>p.$progress}%;background:linear-gradient(90deg,#004085 60%,#007bff 100%);
  border-radius:6px;transition:width .4s ease;
`;
const ProgressBarText = styled.div`font-size:15px;color:#888;font-weight:600;min-width:70px;`;
const ProgressBarLabel = styled.div`font-size:15px;color:#888;font-weight:600;min-width:180px;text-align:right;`;

// Layout
const Wrapper = styled.div`max-width:1100px;margin:0 auto;padding:0 16px 24px;`;
const MainLayout = styled.div`display:flex;gap:32px;align-items:flex-start;animation:${fadeIn} .35s ease both;@media(max-width:1024px){flex-direction:column;}`;
const LeftColumn = styled.div`width:410px;min-width:320px;display:flex;flex-direction:column;gap:28px;`;
const RightColumn = styled.div`flex:1;display:flex;flex-direction:column;`;

// Cards gauche
const Card = styled.div`background:#fff;border-radius:12px;border:1.5px solid #b6d4fa;box-shadow:0 2px 8px #007bff11;padding:22px 22px 18px;`;
const CardQuestion = styled(Card)``;
const CardTitleRow = styled.div`display:flex;gap:8px;align-items:center;color:#004085;font-weight:700;font-size:1.18rem;margin-bottom:6px;`;
const CardQuestionDetails = styled.div`font-size:1.08rem;color:#222;margin-top:18px;margin-bottom:22px;font-weight:500;line-height:1.5;`;
const CardQuestionMeta = styled.div`display:flex;gap:18px;font-size:13px;color:#888;align-items:center;`;
const CardMetaSpan = styled.span`color:${p=>p.$orange ? "#f59e0b" : p.$blue ? "#007bff" : "#004085"};font-weight:700;`;

const CardTimer = styled(Card)`text-align:center;`;
const CardTimerTitle = styled.div`color:#004085;font-weight:700;font-size:1.13rem;margin-bottom:12px;`;
const CardTimerValue = styled.div`
  font-size:2.2rem;font-weight:700;color:${p=>p.$phase==="prep"?"#f59e0b":"#007bff"};
  margin-bottom:2px;letter-spacing:1px;display:inline-block;
`;
const CardTimerProgressBar = styled.div`height:7px;background:#e3e8ee;border-radius:6px;margin:12px 0 8px;overflow:hidden;`;
const CardTimerProgressFill = styled.div`
  height:100%;width:${p=>p.$progress}%;
  background:${p=>p.$phase==="prep"?"linear-gradient(90deg,#f5bb0c 60%,#f59e0b 100%)":"linear-gradient(90deg,#004085 60%,#007bff 100%)"};
  border-radius:6px;transition:width 1s linear;
`;
const CardTimerDesc = styled.div`color:#888;font-size:15px;margin-top:8px;`;

// Caméra + CTA
const VideoContainer = styled(Card)`
  min-height: 420px;
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
`;
const VideoBox = styled.div`
  position: relative;
  flex: 1;
  background: #f1f5f9;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
`;
const LiveVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  display: block;
`;
const LoadingCam = styled.div`
  display:flex;gap:8px;align-items:center;color:#64748b;font-weight:600;
  &:before{content:'';width:18px;height:18px;border-radius:50%;border:3px solid #93c5fd;border-top-color:transparent;animation:${spin} 1s linear infinite;}
`;
const CTA = styled.button`
  margin-top:16px;align-self:center;padding:12px 22px;border:none;border-radius:10px;font-weight:700;
  background:${p=>p.$stop?"#dc3545":"#f59e0b"};color:white;cursor:pointer;transition:transform .1s,filter .2s;
  box-shadow:0 2px 8px rgba(0,0,0,.06);&:hover{filter:brightness(.96)}&:active{transform:translateY(1px)}
  ${p=>p.$recording && css`animation:${pulse} 2s infinite;`}
`;

// Overlay permission/autoplay
const CamOverlay = styled.div`
  position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:rgba(241,245,249,.9); border-radius:12px; text-align:center; padding:18px; gap:12px;
  color:#1f2a44; font-weight:600;
  button{
    padding:10px 16px; border:none; border-radius:10px; background:#007bff; color:#fff; font-weight:700; cursor:pointer;
  }
`;

// Placeholder cam en review
const CamPlaceholder = styled.div`
  width:100%; height:100%;
  display:flex; align-items:center; justify-content:center;
  color:#64748b; font-weight:700; background:#f1f5f9;
`;

// Overlay d’upload/merge (bloque interactions)
const BlockingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(243, 246, 251, 0.78);
  backdrop-filter: blur(1px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  pointer-events: all;
`;
const Spinner = styled.div`
  width: 26px; height: 26px; border-radius: 50%;
  border: 3px solid #9ec5fe; border-top-color: transparent;
  animation: ${spin} 0.8s linear infinite; margin-right: 10px;
`;
const UploadBox = styled.div`
  display:flex; align-items:center; gap:10px; font-weight:700; color:#1f2a44;
  background:#ffffff; border:1px solid #dce7f7; border-radius:12px; padding:14px 18px; box-shadow:0 6px 18px rgba(0,0,0,.06);
`;
const UploadSub = styled.div`
  margin-top:10px; color:#4a5568; font-size:0.95rem; text-align:center;
`;
const UploadBar = styled.div`
  width: 320px; height: 8px; background:#e9eef7; border-radius:7px; overflow:hidden; margin-top:10px;
`;
const UploadFill = styled.div`
  height:100%; width:${p=>p.$w}%; background:linear-gradient(90deg,#004085,#3b82f6);
  transition: width .2s ease; border-radius:7px;
`;

// Réponses
const AnswersCard = styled(Card)`
  margin-top: 18px; width: 100%; max-width: 100%; box-sizing: border-box; padding: 22px 22px 18px 22px;
`;
const AnswersHeader = styled.div`
  display:flex;align-items:center;gap:10px;margin-bottom:10px;font-weight:700;color:#004085;
  .badge{margin-left:auto;font-weight:600;font-size:13px;color:#007bff;background:#e1f0ff;border-radius:8px;padding:6px 10px;}
`;
const SegmentsRow = styled.div`display:flex;gap:18px;overflow-x:auto;padding-bottom:8px;`;
const SegmentItem = styled.div`
  min-width:260px;max-width:320px;flex:0 0 auto;border:1px solid #e3e8ee;border-radius:10px;padding:8px;background:#f8fafc;display:flex;flex-direction:column;
  video{width:100%;border-radius:8px;background:#000;display:block;}
  .meta{display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:12px;color:#4a5568;}
  .q{font-weight:700;color:#004085;}
  .dl{border:none;background:#4a6fa5;color:#fff;padding:4px 8px;border-radius:8px;cursor:pointer;}
  .dl:hover{background:#3a5a8a;}
`;

// Bouton transmettre (en bas uniquement)
const SendBtn = styled.button`
  display:inline-flex; align-items:center; gap:10px;
  background:#004085; color:#fff; border:none; border-radius:10px;
  padding:12px 18px; font-weight:700; cursor:pointer;
  box-shadow:0 2px 8px rgba(0,0,0,.06);
  &:disabled { background:#cbd5e1; cursor:not-allowed; }
`;

// ---------------- Component ----------------
export default function Interview() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [interviewData, setInterviewData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [readElapsed, setReadElapsed] = useState(0);
  const [countdown, setCountdown] = useState(MAX_RESPONSE_TIME);
  const [isRecording, setIsRecording] = useState(false);

  const [recordedVideos, setRecordedVideos] = useState([]);
  const recordedVideosRef = useRef([]);
  const mediaRecorderRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [camReady, setCamReady] = useState(false);
  const [showCamPrompt, setShowCamPrompt] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Upload / merge overlay + progress
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mergedVideoUrl, setMergedVideoUrl] = useState(null);

  // Étape review (aperçu AVANT envoi)
  const [reviewMode, setReviewMode] = useState(false);

  const videoRef = useRef(null);
  const readTimerRef = useRef(null);
  const ansTimerRef = useRef(null);

  // interviewFinished = true UNIQUEMENT après upload réussi
  const interviewFinished = useRef(false);

  // Garde-fous
  const fetchedOnceRef = useRef(false);
  const startedOnceRef = useRef(false);

  // Anti refresh / multi onglets
  const [isRefreshing, setIsRefreshing] = useState(false);
  const tabIdRef = useRef(`${Date.now()}-${Math.random()}`);
  const lockKey = `interview.lock.${token}`;

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  });

  const expirerEntretien = async (reason = 'navigation_or_refresh') => {
    try {
      const res = await fetch(`${API_BASE}/${token}/expirer/`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  // -------- Normalise questions (utilisé avant review) --------
  function normalizeQuestionsFromAPI(payload) {
    if (Array.isArray(payload?.questions_selectionnees) && payload.questions_selectionnees.length > 0) {
      return payload.questions_selectionnees
        .sort((a,b) => (a.ordre ?? 0) - (b.ordre ?? 0))
        .map(qs => {
          const q = qs.question || {};
          const texte = q.texte ?? qs.question__texte ?? "";
          const duree = qs.temps_attribue ?? q.duree_limite ?? qs.question__duree_limite ?? MAX_RESPONSE_TIME;
          return { texte, duree_limite: Number(duree) || MAX_RESPONSE_TIME };
        });
    }
    if (Array.isArray(payload?.questions) && payload.questions.length > 0) {
      return payload.questions.map(q => {
        const texte = q.texte ?? q.question__texte ?? "";
        const duree = q.duree_limite ?? q.question__duree_limite ?? MAX_RESPONSE_TIME;
        return { texte, duree_limite: Number(duree) || MAX_RESPONSE_TIME };
      });
    }
    return [];
  }

  // ------------------ Fetch + start (idempotent) ------------------
  const fetchInterviewData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/${token}/statut/`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")||""}` },
        credentials: "include",
      });

      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const txt = await r.text();
        throw new Error(`Réponse inattendue du serveur: ${txt.slice(0,200)}…`);
      }
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || "Impossible de charger l'entretien");

      let d = j.data || {};
      const normalizedQs = normalizeQuestionsFromAPI(d);

      setInterviewData({ ...d, questions: normalizedQs });
      setRecordedVideos(Array(normalizedQs.length).fill(null));
      recordedVideosRef.current = Array(normalizedQs.length).fill(null);

      if (d.statut === "PENDING" && !startedOnceRef.current) {
        startedOnceRef.current = true;
        const r2 = await fetch(`${API_BASE}/${token}/demarrer/`, {
          method: "POST",
          headers: { "Content-Type":"application/json", Authorization: `Bearer ${localStorage.getItem("access_token")||""}` },
          credentials: "include",
          body: JSON.stringify({})
        });

        let j2 = null;
        try { j2 = await r2.json(); } catch {}
        if (!r2.ok) {
          const msg = j2?.message || "";
          const already = r2.status === 400 && /déjà/i.test(msg) && /cours/i.test(msg);
          if (!already) throw new Error(msg || "Échec du démarrage de l'entretien");
        } else {
          const upd = j2?.data || {};
          setInterviewData(prev => prev ? ({ ...prev, statut: upd.statut ?? prev.statut, date_limite: upd.date_limite ?? prev.date_limite }) : prev);
        }

        if (typeof (window).__setInterviewLock__ === 'function') {
          (window).__setInterviewLock__();
        }

        const r3 = await fetch(`${API_BASE}/${token}/statut/`, {
          headers: { Accept:"application/json", Authorization:`Bearer ${localStorage.getItem("access_token")||""}` },
          credentials: "include",
        });
        const j3 = await r3.json();
        if (r3.ok && j3?.data) {
          d = j3.data;
          const normalized2 = normalizeQuestionsFromAPI(d);
          setInterviewData({ ...d, questions: normalized2 });
          setRecordedVideos(Array(normalized2.length).fill(null));
          recordedVideosRef.current = Array(normalized2.length).fill(null);
        }
      } else {
        if (d.statut === "IN_PROGRESS" && typeof (window).__setInterviewLock__ === 'function') {
          (window).__setInterviewLock__();
        }
        if (d.statut === "EXPIRED" || d.statut === "EXPIRE") setError("Cet entretien a expiré.");
        if (d.statut === "COMPLETED" || d.statut === "TERMINE") setError("Vous avez déjà terminé cet entretien.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Problème de communication avec le serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mount unique
  useEffect(() => {
    if (fetchedOnceRef.current) return;
    fetchedOnceRef.current = true;
    fetchInterviewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---------- Caméra
  const enableCamera = async () => {
    try {
      const st = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      setStream(st);
      const v = videoRef.current;
      if (v) {
        v.srcObject = st;
        v.muted = true;
        v.playsInline = true;
        try {
          await v.play();
          setCamReady(true);
          setShowCamPrompt(false);
        } catch {
          setShowCamPrompt(true);
        }
      }
    } catch {
      setShowCamPrompt(true);
    }
  };

  useEffect(() => {
    enableCamera();

    const reattach = () => {
      const v = videoRef.current;
      if (v && !v.srcObject && stream) {
        v.srcObject = stream;
        v.play().catch(()=>{});
      }
    };
    document.addEventListener("visibilitychange", reattach);
    window.addEventListener("focus", reattach);

    return () => {
      document.removeEventListener("visibilitychange", reattach);
      window.removeEventListener("focus", reattach);
      clearInterval(readTimerRef.current);
      clearInterval(ansTimerRef.current);
      try { stream?.getTracks().forEach(t=>t.stop()); } catch {}
      try { localStorage.removeItem(lockKey); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Timers par question (masqués en review)
  useEffect(() => {
    if (!interviewData) return;
    if (reviewMode || interviewFinished.current) {
      clearInterval(readTimerRef.current);
      clearInterval(ansTimerRef.current);
      return;
    }

    setReadElapsed(0);
    clearInterval(readTimerRef.current);
    clearInterval(ansTimerRef.current);

    // lecture avant auto-start
    readTimerRef.current = setInterval(() => {
      setReadElapsed(prev => {
        const next = prev + 1;
        if (next >= READ_SECONDS) {
          clearInterval(readTimerRef.current);
          if (!isRecording && !recordedVideosRef.current[currentQuestion]) {
            startRecording(); // auto-start
          }
        }
        return next;
      });
    }, 1000);

    const limit = Number(
      interviewData.questions?.[currentQuestion]?.duree_limite ?? MAX_RESPONSE_TIME
    );
    setCountdown(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewData, currentQuestion, reviewMode]);

  // ---------- Recording
  const startRecording = (e) => {
    e?.preventDefault();
    try {
      if (!stream) { setShowCamPrompt(true); return; }

      const chunks = [];
      const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus" });

      mediaRecorderRef.current = rec;

      rec.ondataavailable = ev => { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };

      rec.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        if (blob.size === 0) {
          try { rec.requestData?.(); } catch {}
        }
        const finalBlob = blob.size > 0 ? blob : new Blob(chunks, { type: "video/webm" });

        recordedVideosRef.current[currentQuestion] = finalBlob;
        setRecordedVideos(prev => {
          const copy = [...prev];
          copy[currentQuestion] = finalBlob;
          return copy;
        });

        clearInterval(ansTimerRef.current);
        setIsRecording(false);

        const total = interviewData.questions.length;
        const allDone = recordedVideosRef.current.slice(0, total).every(b => b && b.size > 0);

        if (allDone && currentQuestion >= total - 1) {
          // Fin d'enregistrement → review
          setReviewMode(true);

          // stop cam mais laisser la zone visible (placeholder)
          try { stream?.getTracks().forEach(t => t.stop()); } catch {}
          const v = videoRef.current;
          if (v) { try { v.pause(); } catch {} v.srcObject = null; }
          setCamReady(false);
        } else {
          setCurrentQuestion(q => q + 1);
        }
      };

      rec.start();
      setIsRecording(true);

      clearInterval(ansTimerRef.current);
      ansTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            try { rec.requestData?.(); } catch {}
            try { rec.stop(); } catch {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError("Could not access camera/microphone. Please check permissions.");
      setShowCamPrompt(true);
    }
  };

  const stopRecording = (e) => {
    e?.preventDefault();
    clearInterval(ansTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.requestData?.(); } catch {}
      try { mediaRecorderRef.current.stop(); } catch {}
    }
  };

  // ----------- FFmpeg loader -----------
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        if (!ffmpeg.loaded) {
          const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
          });
        }
      } catch (err) {
        console.error("Failed to load FFmpeg:", err);
      }
    };
    loadFFmpeg();
  }, []);

  // ----------- Upload segments + overlay/progress + redirect (logs) -----------
  const uploadSegments = async () => {
    console.groupCollapsed("📤 uploadSegments");
    console.time("⏱️ uploadSegments");
    console.log("🚀 Envoi des segments vers le backend…");

    const formData = new FormData();
    let totalBytes = 0;
    recordedVideos.forEach((blob, i) => {
      formData.append("videos", blob, `part${i}.webm`);
      console.log(`📦 Segment ${i} ajouté au formData`, { name: `part${i}.webm`, type: blob?.type, size: blob?.size });
      totalBytes += blob?.size || 0;
    });
    console.log(`🧮 Taille totale estimée à l’upload: ${totalBytes.toLocaleString()} bytes`);

    setIsUploading(true);
    setUploadProgress(0);
    console.log("🪟 Overlay d’upload activé, progression réinitialisée à 0%");

    await new Promise((resolve) => {
      const url = `${API_BASE}/${token}/upload_segments/`;
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      console.log("🔧 XHR ouvert:", { method: "POST", url });

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(pct);
          console.log(`📶 Progression upload: ${pct}% (${e.loaded}/${e.total} bytes)`);
        } else {
          console.log("📶 Progression non chiffrable", { loaded: e.loaded, total: e.total });
        }
      };

      xhr.onreadystatechange = () => {
        console.log("🔁 XHR readyState:", { readyState: xhr.readyState, status: xhr.status });
        if (xhr.readyState === 4) {
          let data = null;
          try {
            data = JSON.parse(xhr.responseText || "{}");
            console.log("📨 Réponse JSON du serveur:", data);
          } catch (parseErr) {
            console.warn("⚠️ Échec parsing JSON", parseErr, "→ brut:", (xhr.responseText || "").slice(0, 300));
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            console.log("✅ Segments envoyés avec succès, URL vidéo finale:", data?.video);
            setMergedVideoUrl(data?.video || null);

            // entretien terminé côté UX
            interviewFinished.current = true;

            setShowSuccess(true);
            console.log("🟩 Toast de succès affiché");

            setIsUploading(false);
            console.log("🪟 Overlay d’upload désactivé");

            console.timeEnd("⏱️ uploadSegments");
            console.groupEnd();

            setTimeout(() => {
              console.log("➡️ Redirection vers /candidat/dashboard");
              navigate("/candidat/dashboard");
            }, 1800);
          } else {
            const errMsg = data?.error || `HTTP ${xhr.status}`;
            console.error("❌ Erreur upload (statut HTTP)", xhr.status, "-", errMsg);
            setIsUploading(false);
            setError(errMsg || "Échec de l'envoi des vidéos");
            console.timeEnd("⏱️ uploadSegments");
            console.groupEnd();
          }
          resolve();
        }
      };

      xhr.onerror = () => {
        console.error("💥 Erreur réseau pendant l’envoi des vidéos.");
        setIsUploading(false);
        setError("Erreur réseau pendant l’envoi des vidéos.");
        console.timeEnd("⏱️ uploadSegments");
        console.groupEnd();
        resolve();
      };

      xhr.onabort = () => {
        console.warn("⛔ Envoi annulé.");
        setIsUploading(false);
        setError("Envoi annulé.");
        console.timeEnd("⏱️ uploadSegments");
        console.groupEnd();
        resolve();
      };

      console.log("📮 Envoi du FormData via XHR…");
      xhr.send(formData);
    });
  };

  // ======== Anti refresh / fermeture / BFCache ========
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue = '';
        return;
      }
      if (!interviewFinished.current && !isRefreshing) {
        e.preventDefault();
        e.returnValue = '';
        setIsRefreshing(true);
        try {
          const blob = new Blob([JSON.stringify({ reason: 'beforeunload' })], { type: 'application/json' });
          window.navigator.sendBeacon?.(`${API_BASE}/${token}/expirer/`, blob);
        } catch {}
      }
    };

    const onPageHide = (ev) => {
      if (isUploading) return;
      if (!interviewFinished.current && !ev.persisted) {
        try {
          const blob = new Blob([JSON.stringify({ reason: 'pagehide' })], { type: 'application/json' });
          window.navigator.sendBeacon?.(`${API_BASE}/${token}/expirer/`, blob);
        } catch {}
      }
    };

    const onPageShow = (ev) => {
      if (isUploading) return;
      if (ev.persisted && !interviewFinished.current) {
        (async () => {
          await expirerEntretien('bfcache_restore');
          setError("Ce lien d'entretien ne peut être lancé qu'une seule fois. Il est désormais expiré.");
        })();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [token, isRefreshing, isUploading]);

  // ======== Bloquer bouton "Back" ========
  useEffect(() => {
    const push = () => {
      try { window.history.pushState({ __blockBack: true }, "", window.location.href); } catch {}
    };
    push();

    const onPop = (ev) => {
      if (isUploading) {
        push();
        ev.preventDefault?.();
        return;
      }
      if (!interviewFinished.current) {
        push();
        setError("Lien expiré (retour arrière détecté).");
        expirerEntretien('back_button');
        ev.preventDefault?.();
        ev.stopImmediatePropagation?.();
      }
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isUploading]);

  // ======== Bloquer navigation par liens ========
  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest?.('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;
      const same = href === window.location.pathname || href === window.location.href;

      if (!same && isUploading) {
        e.preventDefault();
        setError("Transmission en cours — veuillez rester sur la page…");
        return;
      }
      if (!same && !interviewFinished.current) {
        e.preventDefault();
        expirerEntretien('anchor_navigation');
        setError("Lien expiré : la page d'entretien ne peut pas être quittée.");
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isUploading]);

  // ======== Anti multi-onglets ========
  useEffect(() => {
    const channelName = 'interview-channel';
    const bc = "BroadcastChannel" in window ? new BroadcastChannel(channelName) : null;

    const broadcastLock = () => {
      bc?.postMessage({ type: "LOCK", t: token, tabId: tabIdRef.current });
    };

    const onMsg = async (ev) => {
      const { type, t, tabId } = ev.data || {};
      if (type === "LOCK" && t === token && tabId !== tabIdRef.current && !interviewFinished.current) {
        await expirerEntretien('second_tab');
        setError("Ce lien est déjà ouvert ailleurs. Il est désormais expiré.");
      }
    };
    bc?.addEventListener("message", onMsg);

    const onStorage = async (e) => {
      if (e.key === lockKey && e.newValue && e.newValue !== tabIdRef.current && !interviewFinished.current) {
        await expirerEntretien('second_tab_storage');
        setError("Ce lien est déjà ouvert ailleurs. Il est désormais expiré.");
      }
    };
    window.addEventListener("storage", onStorage);

    const setLock = () => {
      try { localStorage.setItem(lockKey, tabIdRef.current); } catch {}
      broadcastLock();
    };
    (window).__setInterviewLock__ = setLock;

    return () => {
      bc?.removeEventListener("message", onMsg);
      bc?.close?.();
      window.removeEventListener("storage", onStorage);
      try { localStorage.removeItem(lockKey); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ------- UI -------
  if (isLoading) return <Container><Welcome>Chargement…</Welcome></Container>;
  if (error)     return <Container><Welcome style={{color:"#b91c1c"}}>{error}</Welcome></Container>;
  if (!interviewData) return <Container><Welcome>Aucun entretien</Welcome></Container>;

  const total = interviewData.questions.length;
  const q = interviewData.questions[currentQuestion] || {};
  const qText = q.texte || "";
  const qTitle = "Questions";
  const qAnswerSec = Number(q.duree_limite || MAX_RESPONSE_TIME);
  const progressPercent = ((Math.min(currentQuestion + 1, total)) / total) * 100;

  const allSegmentsReady = recordedVideos.length === total && recordedVideos.every(b => b && b.size > 0);
  const showSegments = allSegmentsReady;

  return (
    <Container>
      {/* Toast succès + redirection */}
      {showSuccess && (
        <div style={{
          position: "fixed",
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#22c55e",
          color: "#fff",
          padding: "18px 32px",
          borderRadius: 12,
          fontWeight: 700,
          fontSize: "1.15rem",
          zIndex: 9999,
          boxShadow: "0 4px 16px #22c55e33"
        }}>
          ✅ Toutes vos réponses ont été transmises au recruteur avec succès !
        </div>
      )}

      {/* Overlay bloquant pendant upload/merge */}
      {isUploading && (
        <BlockingOverlay aria-live="polite" aria-busy="true">
          <UploadBox>
            <Spinner />
            <div>Transmission des réponses en cours…</div>
          </UploadBox>
          <UploadSub>Merci de ne pas fermer ou quitter cette page pendant l’envoi et le traitement.</UploadSub>
          <UploadBar><UploadFill $w={uploadProgress} /></UploadBar>
          <div style={{ marginTop: 8, color: "#4a5568", fontWeight: 700 }}>{uploadProgress}%</div>
        </BlockingOverlay>
      )}

      <Welcome>Bienvenue {interviewData.candidat?.nomComplet || ""}</Welcome>
      <ProgressBarContainer>
        <ProgressBarWrapper>
          <ProgressBarBg><ProgressBarFill $progress={progressPercent} /></ProgressBarBg>
          <ProgressBarText>{Math.min(currentQuestion + 1, total)}/{total}</ProgressBarText>
          <ProgressBarLabel>Progression de l'entretien</ProgressBarLabel>
        </ProgressBarWrapper>
      </ProgressBarContainer>

      <Wrapper aria-hidden={isUploading}>
        <MainLayout>
          {/* Gauche : MASQUÉE en review (plus de questions/timer) */}
          {!reviewMode && (
            <LeftColumn>
              <CardQuestion>
                <CardTitleRow>
                  <span style={{ color:"#007bff" }}>○</span>
                  {qTitle}
                  <span style={{marginLeft:"auto",color:"#007bff",fontWeight:600,fontSize:13,background:"#e1f0ff",borderRadius:8,padding:"6px 14px"}}>
                    Question {Math.min(currentQuestion + 1, total)}/{total}
                  </span>
                </CardTitleRow>

                <CardQuestionDetails>{qText}</CardQuestionDetails>

                <hr style={{border:0,borderTop:"1px solid #eef2f7",margin:"10px 0 14px"}} />
                <CardQuestionMeta>
                  <CardMetaSpan $orange>30s pour lire</CardMetaSpan>
                  <CardMetaSpan $blue>{qAnswerSec}s pour répondre</CardMetaSpan>
                  <span><span style={{color:"#004085",fontWeight:700}}>{Math.min(currentQuestion + 1, total)}</span> sur {total}</span>
                </CardQuestionMeta>
              </CardQuestion>

              <CardTimer>
                <CardTimerTitle>
                  {isRecording ? "Temps de réponse" : "Temps de lecture"}
                </CardTimerTitle>
                <CardTimerValue $phase={isRecording ? "record" : "prep"}>
                  {isRecording
                    ? `0:${String(countdown).padStart(2,"0")}`
                    : `0:${String(Math.max(0, READ_SECONDS - readElapsed)).padStart(2,"0")}`}
                  <span style={{fontSize:15,color:"#888",fontWeight:500,marginLeft:8}}>En cours</span>
                </CardTimerValue>
                <CardTimerProgressBar>
                  <CardTimerProgressFill
                    $phase={isRecording ? "record" : "prep"}
                    $progress={
                      isRecording
                        ? (1 - (countdown / qAnswerSec)) * 100
                        : (1 - (Math.min(readElapsed, READ_SECONDS) / READ_SECONDS)) * 100
                    }
                  />
                </CardTimerProgressBar>
                <CardTimerDesc>
                  {isRecording ? "Enregistrez votre réponse" : "Lisez attentivement la question"}
                </CardTimerDesc>
              </CardTimer>
            </LeftColumn>
          )}

          {/* Droite : Zone caméra TOUJOURS affichée.
              - En enregistrement: vidéo active
              - En review: placeholder gris (cam désactivée) */}
          <RightColumn>
            <VideoContainer>
              <VideoBox>
                {!reviewMode ? (
                  <>
                    <LiveVideo ref={videoRef} autoPlay muted playsInline disablePictureInPicture />
                    {!camReady && !stream && <LoadingCam>Chargement de la caméra…</LoadingCam>}
                    {(!camReady || showCamPrompt) && (
                      <CamOverlay>
                        <div>
                          Autorisez l’accès <b>caméra & micro</b> dans votre navigateur.<br/>
                          Si l’image ne démarre pas, cliquez ci-dessous.
                        </div>
                        <button onClick={enableCamera}>Activer la caméra</button>
                      </CamOverlay>
                    )}
                  </>
                ) : (
                  <CamPlaceholder>Enregistrement terminé — aperçu des réponses ci-dessous</CamPlaceholder>
                )}
              </VideoBox>

              {!reviewMode && (
                !interviewFinished.current && (
                  isRecording ? (
                    <CTA $stop $recording onClick={stopRecording} disabled={isUploading}>Arrêter l'enregistrement</CTA>
                  ) : (
                    <CTA onClick={startRecording} disabled={!!recordedVideos[currentQuestion] || isUploading}>
                      {recordedVideos[currentQuestion] ? "Réponse enregistrée" : "Commencer à répondre"}
                    </CTA>
                  )
                )
              )}
            </VideoContainer>
          </RightColumn>
        </MainLayout>

        {/* Étape REVIEW : lecture des segments + bouton Transmettre (EN BAS SEULEMENT) */}
        {showSegments && (
          <AnswersCard>
            <AnswersHeader>
              <div>Réponses (aperçu)</div>
              <span className="badge">{recordedVideos.length} / {total} enregistrée(s)</span>
            </AnswersHeader>

            <SegmentsRow>
              {recordedVideos.map((blob, i) => (
                <SegmentItem key={i}>
                  <video controls src={URL.createObjectURL(blob)} />
                  <div className="meta">
                    <span className="q">Question {i + 1}</span>
                    <button
                      className="dl"
                      onClick={() => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url; a.download = `reponse_q${i+1}.webm`;
                        document.body.appendChild(a); a.click(); a.remove();
                        setTimeout(()=>URL.revokeObjectURL(url),0);
                      }}
                      disabled={isUploading}
                    >
                      Télécharger
                    </button>
                  </div>
                </SegmentItem>
              ))}
            </SegmentsRow>

            {reviewMode && !interviewFinished.current && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <SendBtn onClick={uploadSegments} disabled={isUploading}>
                  <span>📤 Transmettre mes réponses au recruteur</span>
                </SendBtn>
              </div>
            )}
          </AnswersCard>
        )}
      </Wrapper>
    </Container>
  );
}
