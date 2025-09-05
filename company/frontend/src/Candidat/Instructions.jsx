import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavbarCandidat from "../CandidatNavbar/NavbarCandidat"; 
import { FaCamera, FaVideo, FaQuestionCircle, FaStopwatch, FaMicrophone, FaUserTie } from "react-icons/fa";

const instructionCards = [
  {
    icon: <FaCamera />,
    title: "Activez votre caméra et microphone",
    desc: "Assurez-vous qu'ils fonctionnent correctement"
  },
  {
    icon: <FaVideo />,
    title: "Une seule tentative est possible",
    desc: "Prenez le temps de bien vous préparer"
  },
  {
    icon: <FaQuestionCircle />,
    title: "Nombre total de questions : 5",
    desc: "Vous devrez répondre à 5 questions au total"
  },
  {
    icon: <FaStopwatch />,
    title: "30 secondes pour lire chaque question",
    desc: "Prenez le temps de bien comprendre"
  },
  {
    icon: <FaMicrophone />,
    title: "60 secondes pour répondre",
    desc: "Vous avez 1 minute pour chaque réponse"
  },
  {
    icon: <FaUserTie />,
    title: "Soyez naturel et professionnel",
    desc: "Installez-vous dans un environnement calme"
  }
];

const Instructions = () => {
    const navigate = useNavigate();
    const { token } = useParams();
    const nomEntreprise = "InnovateLab"; 

    // États pour le test caméra/micro
    const [cameraStatus, setCameraStatus] = useState("idle"); // idle | testing | success | error
    const [micStatus, setMicStatus] = useState("idle"); // idle | testing | success | error
    const [testing, setTesting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Fonction de test d'équipement
    const handleTestEquipement = async () => {
        setTesting(true);
        setCameraStatus("testing");
        setMicStatus("testing");
        setErrorMsg("");
        
        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            setCameraStatus("success");
        } catch (e) {
            setCameraStatus("error");
        }
        
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicStatus("success");
        } catch (e) {
            setMicStatus("error");
        }
        
        setTesting(false);
    };

    // Vérification si les deux équipements sont OK
    const canStart = cameraStatus === "success" && micStatus === "success";


    const [error, setError] = useState(null);
    const handleStartInterview = async () => {
    const INTERVIEW_STATUS = {
        PENDING: 'PENDING',
        IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED',
        EXPIRED: 'EXPIRED',
        // Legacy
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
        const response = await fetch(`http://localhost:8000/api/entretiens/${token}/statut/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Accept': 'application/json'
        }
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
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
        case INTERVIEW_STATUS.ACTIF: // legacy
            console.log(token);
            navigate(`/candidat/dashboard/messagerie/instructions/interview/${token}`);
            break;

        case INTERVIEW_STATUS.EXPIRED:
        case INTERVIEW_STATUS.EXPIRE_LEGACY: // legacy
            setError(`Cet entretien a expiré le ${formatFrenchDate(data.date_limite)}.`);
            break;

        case INTERVIEW_STATUS.COMPLETED:
        case INTERVIEW_STATUS.TERMINE:
            setError('Vous avez déjà terminé cet entretien.');
            break;

        default:
            console.error('Statut inconnu reçu:', data.statut);
            setError('Statut d\'entretien non reconnu. Veuillez rafraîchir la page.');
        }

    } catch (error) {
        console.error('Erreur lors du traitement de l\'entretien:', error);
        setError(error.message.includes('inattendue')
        ? 'Problème de communication avec le serveur. Veuillez réessayer.'
        : error.message
        );
    } finally {
        setIsLoading(false);
    }
    };


    return (
        <div>
            <NavbarCandidat />
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                    maxWidth: '900px',
                    width: '100%',
                    backgroundColor: '#fff',
                    borderRadius: '18px',
                    padding: '2.5rem 2rem 2rem 2rem',
                    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.08)',
                    marginBottom: '2.5rem'
                }}>
                    <h2 style={{ textAlign: 'center', color: '#0056b3', fontWeight: 700, fontSize: '2.1rem', marginBottom: 0 }}>
                        Bienvenue ! Vous avez été invité à un entretien par <span>{nomEntreprise}</span>
                    </h2>

                    <h3 style={{ textAlign: 'center', margin: '1.5rem 0 2rem 0', fontWeight: 600, fontSize: '1.45rem', color: '#222' }}>
                        Instructions avant de commencer votre entretien vidéo différé
                    </h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1.2rem',
                        marginBottom: '2.5rem'
                    }}>
                        {instructionCards.map(({ icon, title, desc }, i) => (
                            <div key={i} style={{
                                backgroundColor: '#e9f2fb',
                                borderRadius: '12px',
                                padding: '1.1rem 1.2rem 1.1rem 1.2rem',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '1rem',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                            }}>
                                <div style={{
                                    minWidth: 48,
                                    minHeight: 48,
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    background: '#cce5ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.7rem',
                                    color: '#0056b3',
                                    fontWeight: 700,
                                    marginTop: 2
                                }}>
                                    {icon}
                                </div>
                                <div>
                                    <div style={{
                                        fontWeight: 700,
                                        color: '#004085',
                                        fontSize: '1.08rem',
                                        marginBottom: '0.18rem'
                                    }}>
                                        {title}
                                    </div>
                                    <div style={{
                                        fontSize: '0.97rem',
                                        color: '#4a4a4a',
                                        opacity: 0.85,
                                        marginTop: 2
                                    }}>
                                        {desc}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        background: '#e9f2fb',
                        borderRadius: '12px',
                        padding: '1.5rem 1.2rem 1.7rem 1.2rem',
                        margin: '0 auto 2rem auto',
                        maxWidth: 650,
                        width: '100%',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            color: '#004085',
                            fontWeight: 600,
                            fontSize: '1.08rem',
                            marginBottom: '1.2rem'
                        }}>
                            Avant de commencer l'entretien officiel, vous pouvez effectuer un court essai sur une question simple pour vous familiariser avec la plateforme.<br />
                            <span style={{ color: '#007bff', fontWeight: 500 }}><br></br>
                                C'est totalement facultatif mais vivement recommandé pour une meilleure expérience.
                            </span><br></br>
                        </div>
                        {errorMsg && (
                            <div style={{
                                color: "#dc3545",
                                background: "#fdecea",
                                borderRadius: "8px",
                                padding: "10px 0",
                                marginBottom: "1rem",
                                fontWeight: 600,
                                fontSize: "1.01rem"
                            }}>
                                {errorMsg}
                            </div>
                        )}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: '1.2rem',
                                justifyContent: 'center',
                                alignItems: 'stretch',
                                flexWrap: 'wrap',
                                marginTop: '0.5rem',
                            }}
                        >
                            <button
                                onClick={() => {
                                    if (canStart) {
                                        navigate(`/candidat/dashboard/messagerie/essai/${token}`);
                                    } else {
                                        setErrorMsg("Veuillez tester et valider votre caméra et microphone avant de commencer l'entretien.");
                                    }
                                }}
                                disabled={!canStart}
                                style={{
                                    background: canStart ? '#004085' : '#bfc9d1',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '13px 32px',
                                    fontWeight: 500,
                                    fontSize: '1.08rem',
                                    cursor: canStart ? 'pointer' : 'not-allowed',
                                    boxShadow: '0 2px 8px #007bff11',
                                    minWidth: 220,
                                    maxWidth: 320,
                                    flex: 1,
                                    transition: 'background 0.2s, color 0.2s, border 0.2s',
                                    marginBottom: '0.7rem',
                                    outline: 'none',
                                    letterSpacing: '0.01em',
                                }}
                            >
                                Faire un entretien d'essai
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
                                'Commencer l\'entretien principal'
                                )}
                            </button>
                            
                            {error && (
                                <div style={{
                                color: '#e53e3e',
                                backgroundColor: '#fff5f5',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                fontSize: '0.95rem',
                                maxWidth: '320px',
                                textAlign: 'center',
                                marginTop: '0.5rem',
                                border: '1px solid #fed7d7'
                                }}>
                                {error}
                                </div>
                            )}

                            <style>{`
                                @keyframes spin {
                                to { transform: rotate(360deg); }
                                }
                            `}</style>
                        </div>
                    </div>
                </div>

                <div style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '13px',
                    padding: '1.7rem 2.2rem',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                    maxWidth: '420px',
                    width: '100%'
                }}>
                    <h4 style={{ fontWeight: 700, color: '#004085', fontSize: '1.15rem', marginBottom: '1.2rem' }}>Test de votre équipement</h4>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '2.5rem',
                        marginTop: '0.5rem',
                        marginBottom: '1.2rem'
                    }}>
                        <div>
                            <div style={{
                                minWidth: 38,
                                minHeight: 38,
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                background: '#e1f0ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                color: '#0056b3',
                                fontWeight: 700,
                                margin: '0 auto 0.3rem auto'
                            }}>
                                <FaCamera />
                            </div>
                            <p style={{ margin: 0, fontWeight: 600, color: '#004085', fontSize: '1.01rem' }}>Caméra</p>
                            <p style={{
                                color: cameraStatus === "success" ? "#28a745" : cameraStatus === "error" ? "#dc3545" : "#888",
                                fontSize: '0.97rem',
                                margin: 0,
                                fontWeight: cameraStatus === "success" ? 600 : 400
                            }}>
                                {cameraStatus === "idle" && "Non testé"}
                                {cameraStatus === "testing" && "Test en cours..."}
                                {cameraStatus === "success" && "Fonctionne"}
                                {cameraStatus === "error" && "Erreur"}
                            </p>
                        </div>
                        <div>
                            <div style={{
                                minWidth: 38,
                                minHeight: 38,
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                background: '#e1f0ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                color: '#0056b3',
                                fontWeight: 700,
                                margin: '0 auto 0.3rem auto'
                            }}>
                                <FaMicrophone />
                            </div>
                            <p style={{ margin: 0, fontWeight: 600, color: '#004085', fontSize: '1.01rem' }}>Microphone</p>
                            <p style={{
                                color: micStatus === "success" ? "#28a745" : micStatus === "error" ? "#dc3545" : "#888",
                                fontSize: '0.97rem',
                                margin: 0,
                                fontWeight: micStatus === "success" ? 600 : 400
                            }}>
                                {micStatus === "idle" && "Non testé"}
                                {micStatus === "testing" && "Test en cours..."}
                                {micStatus === "success" && "Fonctionne"}
                                {micStatus === "error" && "Erreur"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleTestEquipement}
                        disabled={testing}
                        style={{
                            marginTop: '0.2rem',
                            padding: '0.6rem 2.2rem',
                            backgroundColor: testing ? '#6c757d' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '7px',
                            cursor: testing ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: '1.07rem',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                        }}>
                        {testing ? "Test en cours..." : "Tester mon équipement"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Instructions;