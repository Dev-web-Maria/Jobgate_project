import React, { useState, useEffect } from 'react'; 
import styled, { keyframes } from 'styled-components';
import { FaEllipsisH, FaArrowRight, FaArrowLeft, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import Template from '../Layouts/Template';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Container styles
const Container = styled.div`
  display: flex;
  gap: 30px;
  max-width: 1200px;
  margin: 30px auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const ColumnLeft = styled.div`
  flex: 1;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }

  h1 {
    font-size: 24px;
    color: #2c3e50;
    margin-bottom: 15px;
    font-weight: 600;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 10px;
  }

  h2 {
    margin-top: 25px;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 8px;
  }

  p {
    margin-bottom: 12px;
    color: #555;
    line-height: 1.5;
  }
`;

const ColumnRight = styled.div`
  flex: 2;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ButtonGroup = styled.div`
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  button {
    position: relative;
    flex: 1;
    background-color: transparent;
    color: #7f8c8d;
    border: none;
    padding: 10px 15px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    white-space: nowrap;

    &:not(:last-child)::after {
      content: '';
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      height: 60%;
      width: 1px;
      background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%);
    }

    &:hover {
      background-color: rgba(52, 152, 219, 0.1);
      color: #3498db;
    }

    &.active {
      background-color: #3498db;
      color: white;
      animation: ${pulse} 1.5s infinite;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
    }
  }
`;

const SendInterviewButton = styled.button`
  background-color: #9b59b6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #8e44ad;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;

  thead tr {
    background-color: #f8f9fa;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    font-weight: 600;
    color: #2c3e50;
    border-bottom: 2px solid #eee;
  }

  tbody tr:hover {
    background-color: #f8f9fa;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  text-transform: capitalize;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 0.3s ease-out;
  background-color: ${props => {
    switch(props.status) {
      case 'Retire': return '#f1c40f';
      case 'Pending': return '#3498db';
      case 'Preselectionne': return '#2ecc71';
      case 'Entretient': return '#9b59b6';
      case 'En Processus d\'entretient': return '#e67e22';
      case 'En negotiation': return '#1abc9c';
      case 'Recrute': return '#27ae60';
      default: return '#95a5a6';
    }
  }};
`;

const ActionMenu = styled.div`
  position: relative;
  display: inline-block;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  &:hover {
    background-color: #f0f0f0;
    color: #2c3e50;
  }
`;

const MenuContent = styled.div`
  display: ${props => (props.show ? 'block' : 'none')};
  position: absolute;
  right: 0;
  background-color: white;
  min-width: 200px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  z-index: 100;
  border-radius: 8px;
  overflow: hidden;
  animation: ${fadeIn} 0.2s ease-out;
`;

const MenuItem = styled.div`
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #2c3e50;
  font-size: 14px;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;

  &:hover {
    background-color: #f5f5f5;
    border-left-color: ${props => {
      if (props.variant === 'reject') return '#e74c3c';
      if (props.variant === 'previous') return '#f39c12';
      return '#2ecc71';
    }};
  }

  svg {
    color: ${props => {
      if (props.variant === 'reject') return '#e74c3c';
      if (props.variant === 'previous') return '#f39c12';
      return '#2ecc71';
    }};
  }
`;

// === Overlay ===
const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

// === Modal container ===
const ModalContainer = styled.div`
  background: #ffffff;
  padding: 30px;
  border-radius: 16px;
  width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.2);
  font-family: "Montserrat", sans-serif;
  animation: ${fadeIn} 0.3s ease-out;
`;

// === Header ===
const ModalHeader = styled.h2`
  font-size: 1.4rem;
  margin-bottom: 20px;
  font-weight: 600;
  color: #2d3e50;
  display: flex;
  align-items: center;
  gap: 10px;
`;

// === Input and Add button ===
const QuestionInput = styled.input`
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  flex: 1;
  outline: none;
  font-size: 14px;
  transition: all 0.3s ease;
  &:focus {
    border-color: #0077ff;
    box-shadow: 0 0 6px rgba(0, 119, 255, 0.3);
  }
`;

const TimeInput = styled.input`
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  width: 80px;
  outline: none;
  font-size: 14px;
  margin-left: 10px;
  transition: all 0.3s ease;
  &:focus {
    border-color: #0077ff;
    box-shadow: 0 0 6px rgba(0, 119, 255, 0.3);
  }
`;

const AddButton = styled.button`
  padding: 10px 16px;
  margin-left: 8px;
  border: none;
  background: #0077ff;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
  &:hover {
    background: #005dc1;
  }
`;

// === Question list ===
const QuestionList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 20px;
`;

const QuestionItem = styled.li`
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const QuestionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const QuestionLevel = styled.span`
  font-size: 12px;
  color: #6c757d;
`;

const QuestionTime = styled.span`
  font-size: 12px;
  color: #0077ff;
  font-weight: 500;
`;

const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: #d9534f;
  font-size: 18px;
  cursor: pointer;
  transition: 0.2s;
  &:hover {
    color: #b52b27;
  }
`;

// === Configuration section ===
const ConfigSection = styled.div`
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
`;

const ConfigLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
`;

const ConfigInput = styled.input`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ced4da;
  width: 80px;
  margin-right: 10px;
`;

// === Pagination buttons ===
const Pagination = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
`;

const PageButton = styled.button`
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: #e9ecef;
  transition: 0.2s;
  &:hover:not(:disabled) {
    background: #0077ff;
    color: white;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageNumber = styled.span`
  font-weight: 500;
  padding: 8px;
`;

// === Footer buttons ===
const Footer = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ConfirmButton = styled.button`
  padding: 10px 18px;
  background: #28a745;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: #1e7e34;
  }
`;

const CloseButton = styled.button`
  padding: 10px 18px;
  background: #dc3545;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: #a71d2a;
  }
`;

// ------------------ Main Component -------------------
const OffreDetail = () => {
  const { offreId } = useParams();
  const [offreData, setOffreData] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Preselectionne');
  const [openMenu, setOpenMenu] = useState(null);
  const [isSendingLinks, setIsSendingLinks] = useState(false);
  const [deadline, setDeadline] = useState(7);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [questionTime, setQuestionTime] = useState(60); // Default time in seconds
  const [currentPage, setCurrentPage] = useState(1);
  const [levelStep, setLevelStep] = useState('Facile');
  // const [questionsPerCandidate, setQuestionsPerCandidate] = useState(5);
  const [loading, setLoading] = useState(true);
  const [candidats, setCandidats] = useState([]);

  // Charger détails offre
  useEffect(() => {
    fetch(`http://localhost:8000/api/recruteur/offres/${offreId}/`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setOffreData(data);
        setLoading(false);
        console.log("Offre chargée:", data);
      })
      .catch(err => {
        console.error("Erreur lors du chargement de l'offre:", err);
        setLoading(false);
      });
  }, [offreId]);

  // Charger candidats liés
  useEffect(() => {
    fetch(`http://localhost:8000/api/recruteur/offre/${offreId}/candidats/`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const candidatsArray = Array.isArray(data) ? data : (data.candidats || []);
        setCandidats(candidatsArray);
        setLoading(false);
        console.log('Candidats chargés:', candidatsArray);
      })
      .catch(err => {
        console.error('Erreur chargement candidats:', err);
        setCandidats([]);
        setLoading(false);
      });
  }, [offreId]);

  const levelOrder = ['Facile', 'Moyen', 'Difficile'];

  const addQuestion = () => {
    const levelCount = questions.filter(q => q.niveau === levelStep).length;
    if (newQuestionText.trim() === '') return;
    if (levelCount >= 10) {
      alert(`Maximum 10 questions de niveau ${levelStep}`);
      return;
    }

    setQuestions(prev => [
      ...prev,
      { 
        texte: newQuestionText, 
        niveau: levelStep, 
        duree_limite: questionTime // Already in seconds
      }
    ]);
    setNewQuestionText('');
  };

  const removeQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(questions.filter(q => q.niveau === levelStep).length / 5)) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const sendQuestionsToBackend = async () => {
    try {
      const payload = {
        questions,
        // questions_per_candidate: questionsPerCandidate
      };
      
      console.log('Envoi des questions au backend:', payload);
      const response = await fetch(`http://localhost:8000/api/recruteur/offres/${offreId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.detail || errorData?.error || 'Erreur lors de l\'envoi des questions';
        throw new Error(message);
      }

      alert('Questions envoyées avec succès !');
    } catch (error) {
      alert('Erreur lors de l\'envoi des questions : ' + error.message);
    }
  };

  const confirmCurrentPage = () => {
    const levelCount = questions.filter(q => q.niveau === levelStep).length;
    if (levelCount < 5) {
      alert(`Ajoutez encore ${5 - levelCount} questions de niveau ${levelStep}`);
      return;
    }

    const nextLevelIndex = levelOrder.indexOf(levelStep) + 1;
    if (nextLevelIndex < levelOrder.length) {
      setLevelStep(levelOrder[nextLevelIndex]);
      setCurrentPage(1);
    } else {
      sendQuestionsToBackend();
      setShowQuestionModal(false);
    }
  };

  const handleStatusChange = async (candidatId, newStatus) => {
    setOpenMenu(null);
    try {
      const response = await fetch(`http://localhost:8000/api/candidat/${candidatId}/offre/${offreId}/update-status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.detail || errorData?.error || 'Erreur lors de la mise à jour';
        throw new Error(message);
      }

      const updatedCandidat = await response.json();
      setCandidats(prev => 
        prev.map(c => 
          c.id === candidatId ? { ...c, status: updatedCandidat.status } : c
        )
      );
      window.location.reload();
    } catch (error) {
      alert('Erreur lors de la mise à jour du statut : ' + error.message);
    }
  };

  const toggleMenu = (candidatId) => {
    setOpenMenu(openMenu === candidatId ? null : candidatId);
  };

  const sendInterviewLinks = async () => {
    if (!offreId) {
      alert("Erreur : offre non sélectionnée ou id manquant");
      return;
    }

    setIsSendingLinks(true);

    fetch('http://localhost:8000/api/send-interview-links/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offre_id: offreId, deadline: deadline })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert('Erreur : ' + data.error);
        } else {
          console.log('Liens envoyés:', data.links);

          let message = 'Liens sécurisés envoyés avec succès !\n\n';
          data.links.forEach(linkObj => {
            message += `${linkObj.candidat} (${linkObj.email}): ${linkObj.link}\n`;
          });
          alert(message);
        }
      })
      .catch(err => {
        alert('Erreur lors de l’envoi des liens');
      });
  };

  const getAvailableTransitions = (currentStatus) => {
    const transitions = {
      Retire: [{ status: 'Pending', label: 'Remettre en attente', icon: <FaArrowRight />, variant: 'next' }],
      Pending: [
        { status: 'Preselectionne', label: 'Preselectionner', icon: <FaArrowRight />, variant: 'next' },
        { status: 'Retire', label: 'Rejeter', icon: <FaTimes />, variant: 'reject' }
      ],
      Preselectionne: [
        { status: 'Entretient', label: 'Programmer entretien', icon: <FaArrowRight />, variant: 'next' },
        { status: 'Pending', label: 'Retour en attente', icon: <FaArrowLeft />, variant: 'previous' },
        { status: 'Retire', label: 'Rejeter', icon: <FaTimes />, variant: 'reject' }
      ],
      Entretient: [
        { status: 'EnProcessus', label: 'Continuer processus', icon: <FaArrowRight />, variant: 'next' },
        { status: 'Preselectionne', label: 'Annuler entretien', icon: <FaArrowLeft />, variant: 'previous' },
        { status: 'Retire', label: 'Rejeter', icon: <FaTimes />, variant: 'reject' }
      ],
      EnProcessus: [
        { status: 'EnNegotiation', label: 'Négocier', icon: <FaArrowRight />, variant: 'next' },
        { status: 'Entretient', label: 'Retour à entretien', icon: <FaArrowLeft />, variant: 'previous' },
        { status: 'Retire', label: 'Rejeter', icon: <FaTimes />, variant: 'reject' }
      ],
      EnNegotiation: [
        { status: 'Recrute', label: 'Recruter', icon: <FaArrowRight />, variant: 'next' },
        { status: 'EnProcessus', label: 'Retour à processus', icon: <FaArrowLeft />, variant: 'previous' },
        { status: 'Retire', label: 'Rejeter', icon: <FaTimes />, variant: 'reject' }
      ],
      Recrute: [
        { status: 'Retire', label: 'Annuler recrutement', icon: <FaTimes />, variant: 'reject' }
      ]
    };
    return transitions[currentStatus] || [];
  };

  const getAllPossibleStatuses = () => {
    return [
      'Retire',
      'Pending',
      'Preselectionne',
      'Entretient',
      'EnProcessus',
      'EnNegotiation',
      'Recrute'
    ];
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</p>;
  if (!offreData) return <p style={{ textAlign: 'center', padding: '2rem' }}>Offre introuvable</p>;

  const filteredCandidats = Array.isArray(candidats) 
    ? candidats.filter(c => c.status === selectedStatus) 
    : [];
    
  const interviewCandidatesCount = Array.isArray(candidats) 
    ? candidats.filter(c => c.status === 'Entretient').length 
    : 0;

  return (
    <Template>
    <Container>
      {/* --- Left column --- */}
      <ColumnLeft>
        <h1>{offreData.offre?.titre || 'Titre indisponible'}</h1>
        <p>{offreData.offre?.description || 'Description indisponible'}</p>
        <p>📍 Lieu: {offreData.offre?.lieu || 'Non spécifié'}</p>
        <p>📄 Type de contrat: {offreData.offre?.typecontrat || 'Non spécifié'}</p>
        <p>💼 Métier: {offreData.offre?.metier || 'Non spécifié'}</p>
        <p>Salaire : {offreData.offre?.salaire || 'Non spécifié'}</p>
      </ColumnLeft>

      {/* --- Right column --- */}
      <ColumnRight>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <h2>Candidats</h2>
          <SendInterviewButton onClick={() => setShowQuestionModal(true)}>
            🎤 Gérer les Questions
          </SendInterviewButton>
        </div>

        <ButtonGroup>
          {getAllPossibleStatuses().map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={selectedStatus === status ? 'active' : ''}
            >
              {status}
            </button>
          ))}
        </ButtonGroup>

        {selectedStatus === 'Entretient' && interviewCandidatesCount > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <SendInterviewButton onClick={sendInterviewLinks} disabled={isSendingLinks}>
              {isSendingLinks ? 'Envoi en cours...' : <><FaPaperPlane /> Envoyer les liens</>}
            </SendInterviewButton>
            <select value={deadline} onChange={(e) => setDeadline(Number(e.target.value))}>
              <option value={1}>1 jours</option>
              <option value={2}>2 jours</option>
              <option value={3}>3 jours</option>
              <option value={4}>4 jours</option>
              <option value={5}>5 jours</option>
              <option value={6}>6 jours</option>
              <option value={7}>7 jours</option>
              <option value={8}>8 jours</option>
              <option value={9}>9 jours</option>
              <option value={10}>10 jours</option>
              <option value={15}>15 jours</option>
              <option value={30}>30 jours</option>
              <option value={60}>60 jours</option>
            </select>
          </div>
        )}

        {/* Table candidats */}
        <Table>
          <thead>
            <tr>
              <th>Nom complet</th>
              <th>Université</th>
              <th>Diplome</th>
              <th>Filière</th>
              <th>Matching Score</th>
              <th>Date de candidature</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidats.map(candidat => (
              <tr key={candidat.id}>
                <td>{candidat.nomComplet}</td>
                <td>{candidat.universite}</td>
                <td>{candidat.diplome}</td>
                <td>{candidat.filiere}</td>
                <td>{candidat.matchingScore}</td>
                <td>{candidat.dateCandidature}</td>
                <td><StatusBadge status={candidat.status}>{candidat.status}</StatusBadge></td>
                <td>
                  <ActionMenu>
                    <MenuButton onClick={() => toggleMenu(candidat.id)}><FaEllipsisH /></MenuButton>
                    <MenuContent show={openMenu === candidat.id}>
                      {getAvailableTransitions(candidat.status).map(action => (
                        <MenuItem key={action.status} onClick={() => handleStatusChange(candidat.id, action.status)} variant={action.variant}>
                          {action.icon} {action.label}
                        </MenuItem>
                      ))}
                    </MenuContent>
                  </ActionMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Question Modal */}
        {showQuestionModal && (
          <ModalOverlay>
            <ModalContainer>
              <ModalHeader>🎯 Questions ({questions.length}/15) — Niveau: {levelStep}</ModalHeader>

              {/* <ConfigSection>
                <ConfigLabel>
                  Nombre de questions par candidat: 
                  <ConfigInput 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={questionsPerCandidate} 
                    onChange={(e) => setQuestionsPerCandidate(parseInt(e.target.value))}
                  />
                  (1-10)
                </ConfigLabel>
              </ConfigSection> */}

              {questions.filter(q => q.niveau === levelStep).length < 10 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                    <QuestionInput
                      type="text"
                      placeholder="Entrez une nouvelle question..."
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                    />
                    <TimeInput
                      type="number"
                      min="30"
                      max="300"
                      placeholder="Secondes"
                      value={questionTime}
                      onChange={(e) => setQuestionTime(parseInt(e.target.value))}
                    />
                    <span style={{ marginLeft: "5px" }}>sec</span>
                    <AddButton onClick={addQuestion}>➕ Ajouter</AddButton>
                  </div>
                </>
              )}

              <QuestionList>
                {questions
                  .filter(q => q.niveau === levelStep)
                  .slice((currentPage - 1) * 5, currentPage * 5)
                  .map((q, idx) => {
                    const indexToRemove = questions.findIndex(
                      (item, i) => item.texte === q.texte && item.niveau === q.niveau && i >= (currentPage - 1) * 5
                    );
                    return (
                      <QuestionItem key={idx}>
                        <QuestionInfo>
                          <span>{q.texte}</span>
                          <div>
                            <QuestionLevel>Niveau: {q.niveau}</QuestionLevel>
                            <QuestionTime>Temps: {q.duree_limite} secondes</QuestionTime>
                          </div>
                        </QuestionInfo>
                        <RemoveButton onClick={() => removeQuestion(indexToRemove)}>✖</RemoveButton>
                      </QuestionItem>
                    );
                  })}
              </QuestionList>

              <Pagination>
                <PageButton onClick={handlePrevPage} disabled={currentPage === 1}>⬅ Précédent</PageButton>
                <PageNumber>Page {currentPage}</PageNumber>
                <PageButton
                  onClick={handleNextPage}
                  disabled={currentPage === Math.ceil(questions.filter(q => q.niveau === levelStep).length / 5)}
                >
                  Suivant ➡
                </PageButton>
              </Pagination>

              <Footer>
                <ConfirmButton onClick={confirmCurrentPage}>✅ Confirmer</ConfirmButton>
                <CloseButton onClick={() => setShowQuestionModal(false)}>❌ Fermer</CloseButton>
              </Footer>
            </ModalContainer>
          </ModalOverlay>
        )}
      </ColumnRight>
    </Container>
    </Template>
  );
};

export default OffreDetail;