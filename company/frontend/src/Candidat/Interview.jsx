import React, { useState, useRef, useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { useParams } from "react-router-dom";

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

// ---------------- Component ----------------
export default function Interview() {
  const { token } = useParams();

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

  const [isMerging, setIsMerging] = useState(false);
  const [mergedVideoUrl, setMergedVideoUrl] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const videoRef = useRef(null);
  const readTimerRef = useRef(null);
  const ansTimerRef = useRef(null);

  const interviewFinished = useRef(false);

  // Garde-fous contre les doubles appels
  const fetchedOnceRef = useRef(false);
  const startedOnceRef = useRef(false);

  // -------- Normalise les questions pour TOUJOURS lire la même liste que le recruteur
  function normalizeQuestionsFromAPI(payload) {
    // 1) Priorité à questions_selectionnees (même ordre, même contenu que côté recruteur)
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
    // 2) Sinon, fallback sur d.questions si l’API a renvoyé la liste brute
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
      // 1) statut
      const r = await fetch(`http://localhost:8000/api/entretiens/${token}/statut/`, {
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

      setInterviewData({
        ...d,
        questions: normalizedQs,
      });
      setRecordedVideos(Array(normalizedQs.length).fill(null));
      recordedVideosRef.current = Array(normalizedQs.length).fill(null);

      // 2) démarrer si et seulement si PENDING et pas encore tenté
      if (d.statut === "PENDING" && !startedOnceRef.current) {
        startedOnceRef.current = true;
        const r2 = await fetch(`http://localhost:8000/api/entretiens/${token}/demarrer/`, {
          method: "POST",
          headers: {
            "Content-Type":"application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")||""}`
          },
          credentials: "include",
          body: JSON.stringify({})
        });

        // Tolérer “déjà en cours” pour être idempotent
        let j2 = null;
        try { j2 = await r2.json(); } catch {}
        if (!r2.ok) {
          const msg = j2?.message || "";
          const already = r2.status === 400 && /déjà/i.test(msg) && /cours/i.test(msg);
          if (!already) throw new Error(msg || "Échec du démarrage de l'entretien");
        } else {
          // mise à jour locale si l’API renvoie des champs
          const upd = j2?.data || {};
          setInterviewData(prev => prev ? ({
            ...prev,
            statut: upd.statut ?? prev.statut,
            date_limite: upd.date_limite ?? prev.date_limite,
          }) : prev);
        }

        // 3) Re-fetch du statut pour figer la sélection renvoyée côté serveur
        const r3 = await fetch(`http://localhost:8000/api/entretiens/${token}/statut/`, {
          headers: { Accept:"application/json", Authorization:`Bearer ${localStorage.getItem("access_token")||""}` },
          credentials: "include",
        });
        const j3 = await r3.json();
        if (r3.ok && j3?.data) {
          d = j3.data;
          const normalized2 = normalizeQuestionsFromAPI(d);
          setInterviewData({
            ...d,
            questions: normalized2,
          });
          setRecordedVideos(Array(normalized2.length).fill(null));
          recordedVideosRef.current = Array(normalized2.length).fill(null);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Problème de communication avec le serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------ Mount: empêcher double run en dev (StrictMode) ------------------
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Timers par question
  useEffect(() => {
    if (!interviewData) return;
    if (interviewFinished.current) {
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
  }, [interviewData, currentQuestion]);

  // ---------- Recording (flush avant stop)
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
          interviewFinished.current = true;
          clearInterval(readTimerRef.current);
          clearInterval(ansTimerRef.current);
          setReadElapsed(0);
          setCountdown(0);

          try { stream?.getTracks().forEach(t => t.stop()); } catch {}
          const v = videoRef.current;
          if (v) { try { v.pause(); } catch {} v.srcObject = null; }
        } else {
          setCurrentQuestion(q => q + 1);
        }
      };

      rec.start(); // pas de timeslice
      setIsRecording(true);

      clearInterval(ansTimerRef.current);
      ansTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            try { rec.requestData?.(); } catch {}   // 🔧 flush
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
      try { mediaRecorderRef.current.requestData?.(); } catch {}  // 🔧 flush manuel
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


  // ----------- MergeVideos (concat copy) -----------
// ----------- Upload segments vers le backend (robuste) -----------
const uploadSegments = async () => {
  console.log("🚀 Envoi des segments vers le backend…");

  const formData = new FormData();
  recordedVideos.forEach((blob, i) => {
    formData.append("videos", blob, `part${i}.webm`);
    console.log(`📦 Segment ${i} ajouté au formData`);
  });

  try {
    const resp = await fetch(`http://localhost:8000/api/entretiens/${token}/upload_segments/`, {
      method: "POST",
      body: formData,
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Upload échoué");

    console.log("✅ Segments envoyés, vidéo finale:", data.video);
    setMergedVideoUrl(data.video);

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  } catch (err) {
    console.error("❌ Erreur upload:", err);
    setError("Échec de l'envoi des vidéos");
  }
};



// ----------- Déclencher l’upload quand toutes les réponses sont là -----------
useEffect(() => {
  if (
    interviewData &&
    recordedVideos.length === (interviewData.questions?.length || 0) &&
    recordedVideos.every(video => video !== null)
  ) {
    uploadSegments(); // ⬅️ nouveau au lieu de mergeVideos()
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [recordedVideos, interviewData]);





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

  const showSegments = recordedVideos.length === total && recordedVideos.every(b => b && b.size > 0);

  return (
    <Container>
      {/* Popup vert de succès après upload */}
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

      <Welcome>Bienvenue {interviewData.candidat?.nomComplet || ""}</Welcome>
      <ProgressBarContainer>
        <ProgressBarWrapper>
          <ProgressBarBg><ProgressBarFill $progress={progressPercent} /></ProgressBarBg>
          <ProgressBarText>{Math.min(currentQuestion + 1, total)}/{total}</ProgressBarText>
          <ProgressBarLabel>Progression de l'entretien</ProgressBarLabel>
        </ProgressBarWrapper>
      </ProgressBarContainer>

      <Wrapper>
        <MainLayout>
          {/* Gauche */}
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
                {interviewFinished.current ? "Entretien terminé" : (isRecording ? "Temps de réponse" : "Temps de lecture")}
              </CardTimerTitle>
              <CardTimerValue $phase={isRecording ? "record" : "prep"}>
                {interviewFinished.current
                  ? `0:00`
                  : (isRecording
                      ? `0:${String(countdown).padStart(2,"0")}`
                      : `0:${String(Math.max(0, READ_SECONDS - readElapsed)).padStart(2,"0")}`)}
                {!interviewFinished.current && (
                  <span style={{fontSize:15,color:"#888",fontWeight:500,marginLeft:8}}>En cours</span>
                )}
              </CardTimerValue>
              <CardTimerProgressBar>
                <CardTimerProgressFill
                  $phase={isRecording ? "record" : "prep"}
                  $progress={
                    interviewFinished.current
                      ? 100
                      : (isRecording
                          ? (1 - (countdown / qAnswerSec)) * 100
                          : (1 - (Math.min(readElapsed, READ_SECONDS) / READ_SECONDS)) * 100)
                  }
                />
              </CardTimerProgressBar>
              <CardTimerDesc>
                {interviewFinished.current
                  ? "Merci ! Vos réponses ont été transmises."
                  : (isRecording ? "Enregistrez votre réponse" : "Lisez attentivement la question")}
              </CardTimerDesc>
            </CardTimer>
          </LeftColumn>

          {/* Droite */}
          <RightColumn>
            <VideoContainer>
              <VideoBox>
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
              </VideoBox>

              {!interviewFinished.current && (
                isRecording ? (
                  <CTA $stop $recording onClick={stopRecording}>Arrêter l'enregistrement</CTA>
                ) : (
                  <CTA onClick={startRecording} disabled={!!recordedVideos[currentQuestion]}>
                    {recordedVideos[currentQuestion] ? "Réponse enregistrée" : "Commencer à répondre"}
                  </CTA>
                )
              )}
            </VideoContainer>
          </RightColumn>
        </MainLayout>

        {/* Réponses */}
        {showSegments && (
          <AnswersCard>
            <AnswersHeader>
              <div>Réponses</div>
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
                    >
                      Télécharger
                    </button>
                  </div>
                </SegmentItem>
              ))}
            </SegmentsRow>

          </AnswersCard>
        )}
      </Wrapper>
    </Container>
  );
}
