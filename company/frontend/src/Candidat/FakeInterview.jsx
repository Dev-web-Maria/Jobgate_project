import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";

/** ---------- Config essai (local only) ---------- */
const READ_SECONDS = 30;
const FAKE_QUESTIONS = [
  { texte: "Présentez-vous brièvement.", dureeReponse: 60 },
  { texte: "Pourquoi souhaitez-vous ce poste ?", dureeReponse: 60 },
];

/** ---------- Animations / UI ---------- */
const fadeIn = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}`;
const pulse = keyframes`
  0%{transform:scale(1);box-shadow:0 0 0 0 rgba(74,111,165,.7)}
  50%{transform:scale(1.02)}
  70%{box-shadow:0 0 0 16px rgba(74,111,165,0)}
  100%{transform:scale(1);box-shadow:0 0 0 0 rgba(74,111,165,0)}
`;
const spin = keyframes`to{transform:rotate(360deg)}`;

const Container = styled.div`font-family:'Inter',system-ui,sans-serif;background:#f3f6fb;min-height:100vh;color:#1f2a44;`;
const Welcome = styled.div`max-width:1100px;margin:0 auto;padding:18px 16px 0;font-size:1.35rem;font-weight:700;color:#004085;`;
const Note = styled.div`
  max-width:1100px;margin:4px auto 10px;padding:8px 16px;color:#0f5132;background:#d1e7dd;border:1px solid #badbcc;border-radius:10px;
  font-weight:600; font-size:.95rem;
`;

const ProgressBarContainer = styled.div`width:100%;padding:0 16px 18px;`;
const ProgressBarWrapper = styled.div`max-width:1100px;margin:0 auto;display:flex;gap:18px;align-items:center;`;
const ProgressBarBg = styled.div`flex:1;height:7px;background:#f1f5f9;border-radius:6px;overflow:hidden;`;
const ProgressBarFill = styled.div`
  height:100%;width:${p => p.$progress}%;
  background:linear-gradient(90deg,#004085 60%,#007bff 100%);
  border-radius:6px;transition:width .4s ease;
`;
const ProgressBarText = styled.div`font-size:15px;color:#888;font-weight:600;min-width:70px;`;
const ProgressBarLabel = styled.div`font-size:15px;color:#888;font-weight:600;min-width:180px;text-align:right;`;

const Wrapper = styled.div`max-width:1100px;margin:0 auto;padding:0 16px 24px;`;
const MainLayout = styled.div`display:flex;gap:32px;align-items:flex-start;animation:${fadeIn} .35s ease both;@media(max-width:1024px){flex-direction:column;}`;
const LeftColumn = styled.div`width:410px;min-width:320px;display:flex;flex-direction:column;gap:28px;`;
const RightColumn = styled.div`flex:1;display:flex;flex-direction:column;`;

const Card = styled.div`background:#fff;border-radius:12px;border:1.5px solid #b6d4fa;box-shadow:0 2px 8px #007bff11;padding:22px 22px 18px;`;
const CardTitleRow = styled.div`display:flex;gap:8px;align-items:center;color:#004085;font-weight:700;font-size:1.18rem;margin-bottom:6px;`;
const CardQuestionDetails = styled.div`font-size:1.08rem;color:#222;margin-top:18px;margin-bottom:22px;font-weight:500;line-height:1.5;`;
const CardQuestionMeta = styled.div`display:flex;gap:18px;font-size:13px;color:#888;align-items:center;`;
const CardMetaSpan = styled.span`color:${p => p.$orange ? "#f59e0b" : p.$blue ? "#007bff" : "#004085"};font-weight:700;`;

/* --- Timer centré (même style que l'officiel) --- */
const CardTimer = styled(Card)`display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;`;
const CardTimerTitle = styled.div`color:#004085;font-weight:700;font-size:1.13rem;margin-bottom:10px;`;
const CardTimerValue = styled.div`
  display:flex;align-items:center;justify-content:center;
  font-size:2.2rem;font-weight:700;color:${p => p.$phase === "prep" ? "#f59e0b" : "#007bff"};
  margin-bottom:2px;letter-spacing:1px;min-height:2.6rem;
`;
const TimerSuffix = styled.span`font-size:15px;color:#888;font-weight:500;margin-left:8px;`;
const CardTimerProgressBar = styled.div`width:100%;height:7px;background:#e3e8ee;border-radius:6px;margin:10px 0 8px;overflow:hidden;`;
const CardTimerProgressFill = styled.div`
  height:100%;width:${p => p.$progress}%;
  background:${p => p.$phase === "prep" ? "linear-gradient(90deg,#f5bb0c 60%,#f59e0b 100%)" : "linear-gradient(90deg,#004085 60%,#007bff 100%)"};
  border-radius:6px;transition:width 1s linear;
`;
const CardTimerDesc = styled.div`color:#888;font-size:15px;margin-top:6px;`;

const VideoContainer = styled(Card)`min-height:420px;display:flex;flex-direction:column;margin-bottom:24px;`;
const VideoBox = styled.div`
  position:relative;flex:1;background:#f1f5f9;border:1px dashed #e5e7eb;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:400px;
`;
const LiveVideo = styled.video`width:100%;height:100%;object-fit:cover;transform:scaleX(-1);display:block;`;
const LoadingCam = styled.div`
  display:flex;gap:8px;align-items:center;color:#64748b;font-weight:600;
  &:before{content:'';width:18px;height:18px;border-radius:50%;border:3px solid #93c5fd;border-top-color:transparent;animation:${spin} 1s linear infinite;}
`;
const CamOverlay = styled.div`
  position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:rgba(241,245,249,.9); border-radius:12px; text-align:center; padding:18px; gap:12px;
  color:#1f2a44; font-weight:600;
  button{padding:10px 16px; border:none; border-radius:10px; background:#007bff; color:#fff; font-weight:700; cursor:pointer;}
`;
const CTA = styled.button`
  margin-top:16px;align-self:center;padding:12px 22px;border:none;border-radius:10px;font-weight:700;
  background:${p => p.$stop ? "#dc3545" : "#f59e0b"};color:white;cursor:pointer;transition:transform .1s,filter .2s;
  box-shadow:0 2px 8px rgba(0,0,0,.06);&:hover{filter:brightness(.96)}&:active{transform:translateY(1px)}
  ${p => p.$recording && css`animation:${pulse} 2s infinite;`}
`;

const AnswersCard = styled(Card)`margin-top:18px;`;
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
  .dl{border:none;background:#4a6fa5;color:#fff;padding:6px 10px;border-radius:8px;cursor:pointer;}
  .dl:hover{background:#3a5a8a;}
`;

const ActionsRow = styled.div`display:flex;gap:12px;justify-content:center;margin-top:12px;`;

/** ---------- Helpers ---------- */
const formatTimer = (seconds) => {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

/** ---------- Composant ---------- */
export default function FakeInterview() {
  const navigate = useNavigate();
  const location = useLocation();
  const total = FAKE_QUESTIONS.length;

  // Récupérer le token depuis l'état de navigation
  const token = location.state?.token || 'demo';

  const [camReady, setCamReady] = useState(false);
  const [showCamPrompt, setShowCamPrompt] = useState(false);
  const [stream, setStream] = useState(null);

  const [current, setCurrent] = useState(0);
  const [readElapsed, setReadElapsed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(FAKE_QUESTIONS[0].dureeReponse);

  const [segments, setSegments] = useState(Array(total).fill(null));
  const [finished, setFinished] = useState(false);
  
  // New states for interview handling
  const [canStart, setCanStart] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrls, setVideoUrls] = useState(Array(total).fill(null));

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const readTimerRef = useRef(null);
  const ansTimerRef = useRef(null);

  /** Caméra & micro */
  const enableCamera = async () => {
    try {
      const st = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      setStream(st);
      const v = videoRef.current;
      if (v) { v.srcObject = st; v.muted = true; v.playsInline = true; await v.play().catch(() => { }); }
      setCamReady(true);
      setShowCamPrompt(false);
      setCanStart(true);
    } catch {
      setShowCamPrompt(true);
      setCanStart(false);
    }
  };

  useEffect(() => {
    enableCamera();
    const reattach = () => {
      const v = videoRef.current;
      if (v && !v.srcObject && stream) { v.srcObject = stream; v.play().catch(() => { }); }
    };
    document.addEventListener("visibilitychange", reattach);
    window.addEventListener("focus", reattach);
    return () => {
      clearInterval(readTimerRef.current);
      clearInterval(ansTimerRef.current);
      try { stream?.getTracks().forEach(t => t.stop()); } catch { }
      // Clean up video URLs
      videoUrls.forEach(url => url && URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Créer les URLs pour les vidéos et les conserver
  useEffect(() => {
    const newVideoUrls = segments.map(blob => blob ? URL.createObjectURL(blob) : null);
    setVideoUrls(newVideoUrls);
    
    // Nettoyer les URLs précédentes
    return () => {
      newVideoUrls.forEach(url => url && URL.revokeObjectURL(url));
    };
  }, [segments]);

  /** A chaque nouvelle question, relancer lecture + timer réponse */
  useEffect(() => {
    if (finished) return;

    // lecture (reset)
    clearInterval(readTimerRef.current);
    setReadElapsed(0);

    readTimerRef.current = setInterval(() => {
      setReadElapsed(prev => {
        const next = prev + 1;
        if (next >= READ_SECONDS) {
          clearInterval(readTimerRef.current);
          if (!isRecording && !segments[current]) startRecording();
        }
        return next;
      });
    }, 1000);

    // réponse (reset) selon la question
    setCountdown(FAKE_QUESTIONS[current].dureeReponse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, finished]);

  /** Start / Stop enregistrement pour la question courante */
  const startRecording = (e) => {
    e?.preventDefault();
    if (!stream) { setShowCamPrompt(true); return; }

    const qIndex = current;

    const chunks = [];
    const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus" });
    mediaRecorderRef.current = rec;

    rec.ondataavailable = ev => { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };
    rec.onstop = () => {
      const b = new Blob(chunks, { type: "video/webm" });

      setSegments(prev => {
        const copy = [...prev];
        copy[qIndex] = b.size > 0 ? b : null;
        return copy;
      });

      setIsRecording(false);
      clearInterval(ansTimerRef.current);
      setCountdown(0);

      if (qIndex >= total - 1) {
        setFinished(true);
      } else {
        setCurrent(qIndex + 1);
      }
    };

    rec.start();
    setIsRecording(true);

    clearInterval(ansTimerRef.current);
    ansTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          try { rec.requestData?.(); } catch { }
          try { rec.stop(); } catch { }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRecording = (e) => {
    e?.preventDefault();
    clearInterval(ansTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.requestData?.(); } catch { }
      try { mediaRecorderRef.current.stop(); } catch { }
    }
  };

  /** Réinitialiser tout l'essai */
  const resetTry = () => {
    clearInterval(readTimerRef.current);
    clearInterval(ansTimerRef.current);
    setSegments(Array(total).fill(null));
    setFinished(false);
    setIsRecording(false);
    setCurrent(0);
    setReadElapsed(0);
    setCountdown(FAKE_QUESTIONS[0].dureeReponse);
  };

  const handleStartInterview = async () => {
    console.log("token:", token); // Pour debug
    const INTERVIEW_STATUS = {
      PENDING: 'PENDING',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      EXPIRED: 'EXPIRED',
      ACTIF: 'actif',
      TERMINE: 'termine',
      EXPIRE_LEGACY: 'expire'
    };

    const formatFrenchDate = (dateString) => {
      if (!dateString) return 'date inconnue';
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Europe/Paris'
      });
    };

    if (!canStart) {
      setError("Veuillez tester et valider votre caméra et microphone avant de commencer l'entretien.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Vérifier si nous sommes en mode développement ou si l'API n'est pas disponible
      const isDevelopment = process.env.NODE_ENV === 'development';
      const apiUrl = `http://localhost:8000/api/entretiens/${token}/statut/`;
      
      // Simuler une réponse pour le développement ou quand l'API n'est pas disponible
      if (isDevelopment) {
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simuler une réponse réussie avec statut actif
        const mockResponse = {
          data: {
            statut: 'actif',
            date_limite: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        };
        
        const statut = mockResponse.data.statut;
        // const statut = data.statut;
        console.log("Mock statut:", statut); // Pour debug
        
        switch (statut) {
          case INTERVIEW_STATUS.PENDING:
          case INTERVIEW_STATUS.IN_PROGRESS:
          case INTERVIEW_STATUS.ACTIF:
            // CORRECTION: Utiliser la bonne route de navigation
            navigate(`/entretien-video/${token}`);
            break;
            
          case INTERVIEW_STATUS.EXPIRED:
          case INTERVIEW_STATUS.EXPIRE_LEGACY:
            setError(`Cet entretien a expiré le ${formatFrenchDate(mockResponse.data.date_limite)}.`);
            break;
            
          case INTERVIEW_STATUS.COMPLETED:
          case INTERVIEW_STATUS.TERMINE:
            setError('Vous avez déjà terminé cet entretien.');
            break;
            
          default:
            setError('Statut d\'entretien non reconnu. Veuillez rafraîchir la page.');
        }
        
        return;
      }

      // En mode production, faire la vraie requête
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Accept': 'application/json'
        }
      });

      // Vérifier si la réponse est du JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        
        // Si c'est une page HTML, l'API n'est probablement pas disponible
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          throw new Error('Le service est temporairement indisponible. Veuillez réessayer plus tard.');
        }
        
        throw new Error(`Le serveur a retourné une réponse inattendue: ${text.substring(0, 100)}...`);
      }

      const { data } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la vérification du statut de l\'entretien');
      }

      const statut = data.statut?.toUpperCase();

      switch (statut) {
        case INTERVIEW_STATUS.PENDING:
        case INTERVIEW_STATUS.IN_PROGRESS:
        case INTERVIEW_STATUS.ACTIF:
          // CORRECTION: Utiliser la bonne route de navigation
          navigate(`/entretien-video/${token}`, { state: { token } });
          break;

        case INTERVIEW_STATUS.EXPIRED:
        case INTERVIEW_STATUS.EXPIRE_LEGACY:
          setError(`Cet entretien a expiré le ${formatFrenchDate(data.date_limite)}.`);
          break;

        case INTERVIEW_STATUS.COMPLETED:
        case INTERVIEW_STATUS.TERMINE:
          setError('Vous avez déjà terminé cet entretien.');
          break;

        default:
          setError('Statut d\'entretien non reconnu. Veuillez rafraîchir la page.');
      }

    } catch (error) {
      console.error('Erreur lors du traitement de l\'entretien:', error);
      setError(error.message.includes('indisponible')
        ? error.message
        : 'Problème de communication avec le serveur. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /** Rendu */
  const answeredCount = segments.filter(Boolean).length;
  const progressPercent = (Math.min(answeredCount + (isRecording || readElapsed > 0 ? 1 : 0), total) / total) * 100;

  const readingLeft = Math.max(0, READ_SECONDS - readElapsed);
  const q = FAKE_QUESTIONS[current];
  const qIdx = current + 1;

  const showReset = finished && segments.every(Boolean);

  return (
    <Container>
      <Welcome>Entretien d'essai</Welcome>
      <Note>Mode ESSAI — aucune donnée n'est envoyée ni sauvegardée. C'est juste pour vous entraîner.</Note>

      {error && (
        <div style={{
          maxWidth: '1100px', margin: '10px auto', padding: '12px 16px',
          color: '#721c24', background: '#f8d7da', border: '1px solid #f5c6cb',
          borderRadius: '10px', fontWeight: '600', fontSize: '.95rem'
        }}>
          {error}
        </div>
      )}

      <ProgressBarContainer>
        <ProgressBarWrapper>
          <ProgressBarBg><ProgressBarFill $progress={progressPercent} /></ProgressBarBg>
          <ProgressBarText>{Math.min(answeredCount + (finished ? 0 : 1), total)}/{total}</ProgressBarText>
          <ProgressBarLabel>Progression</ProgressBarLabel>
        </ProgressBarWrapper>
      </ProgressBarContainer>

      <Wrapper>
        <MainLayout>
          {/* Colonne gauche : question + timers */}
          <LeftColumn>
            <Card>
              <CardTitleRow>
                <span style={{ color: "#007bff" }}>○</span>
                Questions
                <span style={{ marginLeft: "auto", color: "#007bff", fontWeight: 600, fontSize: 13, background: "#e1f0ff", borderRadius: 8, padding: "6px 14px" }}>
                  {qIdx} / {total}
                </span>
              </CardTitleRow>
              <CardQuestionDetails>{q.texte}</CardQuestionDetails>
              <hr style={{ border: 0, borderTop: "1px solid #eef2f7", margin: "10px 0 14px" }} />
              <CardQuestionMeta>
                <CardMetaSpan $orange>{READ_SECONDS}s pour lire</CardMetaSpan>
                <CardMetaSpan $blue>{q.dureeReponse}s pour répondre</CardMetaSpan>
                <span><span style={{ color: "#004085", fontWeight: 700 }}>{qIdx}</span> sur {total}</span>
              </CardQuestionMeta>
            </Card>

            <CardTimer>
              <CardTimerTitle>
                {finished ? "Essai terminé" : (isRecording ? "Temps de réponse" : "Temps de lecture")}
              </CardTimerTitle>

              <CardTimerValue $phase={isRecording ? "record" : "prep"}>
                {finished
                  ? `0:00`
                  : (isRecording
                    ? `${formatTimer(countdown)}`
                    : `${formatTimer(readingLeft)}`)}
                {!finished && <TimerSuffix>en cours</TimerSuffix>}
              </CardTimerValue>

              <CardTimerProgressBar>
                <CardTimerProgressFill
                  $phase={isRecording ? "record" : "prep"}
                  $progress={
                    finished
                      ? 100
                      : (isRecording
                        ? (1 - (countdown / q.dureeReponse)) * 100
                        : (1 - ((READ_SECONDS - readingLeft) / READ_SECONDS)) * 100)
                  }
                />
              </CardTimerProgressBar>

              <CardTimerDesc>
                {finished
                  ? "Merci ! Réinitialisez l'entretien si vous souhaitez réessayer."
                  : (isRecording ? "Enregistrez votre réponse" : "Lisez attentivement la question")}
              </CardTimerDesc>
            </CardTimer>
          </LeftColumn>

          {/* Colonne droite : caméra + actions */}
          <RightColumn>
            <VideoContainer>
              <VideoBox>
                <LiveVideo ref={videoRef} autoPlay muted playsInline disablePictureInPicture />
                {!camReady && !stream && <LoadingCam>Chargement de la caméra…</LoadingCam>}
                {(!camReady || showCamPrompt) && (
                  <CamOverlay>
                    <div>
                      Autorisez l'accès <b>caméra & micro</b> dans votre navigateur.<br />
                      Si l'image ne démarre pas, cliquez ci-dessous.
                    </div>
                    <button onClick={enableCamera}>Activer la caméra</button>
                  </CamOverlay>
                )}
              </VideoBox>

              {!finished && (
                isRecording ? (
                  <CTA $stop $recording onClick={stopRecording}>Arrêter l'enregistrement</CTA>
                ) : (
                  <CTA onClick={startRecording} disabled={!!segments[current]}>
                    {segments[current] ? "Réponse enregistrée" : "Commencer à répondre"}
                  </CTA>
                )
              )}
            </VideoContainer>

            {/* Aperçus des réponses quand dispos */}
            {segments.filter(Boolean).length > 0 && (
              <AnswersCard>
                <AnswersHeader>
                  <div>Vos enregistrements d'essai</div>
                  <span className="badge">{segments.filter(Boolean).length} / {total} enregistré(s) — Non envoyé</span>
                </AnswersHeader>

                <SegmentsRow>
                  {segments.map((blob, i) => blob && (
                    <SegmentItem key={i}>
                      <video controls src={videoUrls[i]} />
                      <div className="meta">
                        <span className="q">Question {i + 1}</span>
                        <button
                          className="dl"
                          onClick={() => {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url; a.download = `essai_q${i + 1}.webm`;
                            document.body.appendChild(a); a.click(); a.remove();
                            setTimeout(() => URL.revokeObjectURL(url), 0);
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

            {/* Reset + Aller à l'entretien principal */}
            {showReset && (
              <ActionsRow>
                <button
                  onClick={resetTry}
                  style={{
                    border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a",
                    padding: "10px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer"
                  }}
                >
                  Réinitialiser l'essai
                </button>

                <button
                  onClick={handleStartInterview}
                  disabled={!canStart || isLoading}
                  style={{
                    background: canStart ? '#4a6fa5' : '#e2e8f0',
                    color: canStart ? '#fff' : '#a0aec0',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 32px',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    cursor: canStart && !isLoading ? 'pointer' : 'not-allowed',
                    boxShadow: canStart ? '0 4px 12px rgba(74, 111, 165, 0.25)' : 'none',
                    minWidth: 240,
                    maxWidth: 320,
                    width: '100%',
                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                    marginBottom: '1rem',
                    outline: 'none',
                    letterSpacing: '0.01em',
                    opacity: isLoading ? 0.8 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Chargement...
                    </>
                  ) : (
                    "Commencer l'entretien principal"
                  )}
                </button>
              </ActionsRow>
            )}
          </RightColumn>
        </MainLayout>
      </Wrapper>
    </Container>
  );
}