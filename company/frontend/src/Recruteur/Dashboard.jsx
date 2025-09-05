// import React, { useState, useEffect } from 'react';
// import Template from '../Layouts/Template';
// import OffreDetail from './OffreDetail';

// const Dashboard = ({ offreId }) => {
//   const [offre, setOffre] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetch('http://localhost:8000/api/recruteur/REC-2025-001/')
//       .then(res => res.json())
//       .then(data => console.log('Recruteur data:', data))
//       .catch(err => console.error('Erreur fetch recruteur:', err));
//   }, []);

//   useEffect(() => {
//     fetch(`http://localhost:8000/api/recruteur/offre/offre_01/candidats/`)
//       .then(res => res.json())
//       .then(data => {
//         setOffre(data);
//         setLoading(false);
//       })
//       .catch(err => {
//         console.error('Erreur chargement offre:', err);
//         setLoading(false);
//       });
//   }, [offreId]);

//   const handleStatusChange = (candidatId, newStatus) => {
//     setOffre(prevOffre => {
//       if (!prevOffre) return prevOffre;
//       const updatedCandidats = prevOffre.candidats.map(candidat => {
//         if (candidat.id === candidatId) {
//           return { ...candidat, status: newStatus };
//         }
//         return candidat;
//       });
//       return { ...prevOffre, candidats: updatedCandidats };
//     });
//   };

//   if (loading) return <p>Chargement en cours...</p>;
//   if (!offre) return <p>Offre introuvable</p>;

//   return (
//     <Template>
//       <div className="container mx-auto py-6">
//         <OffreDetail 
//           offre={offre} 
//           onStatusChange={handleStatusChange} 
//         />
//       </div>
//     </Template>
//   );
// };

// export default Dashboard;


// import React, { useState, useEffect } from 'react';
// import Template from '../Layouts/Template';
// import OffreDetail from './OffreDetail';

// const Dashboard = ({ offreId }) => {
//   const [offre, setOffre] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [recruteur, setRecruteur] = useState(null);

//   // Récupérer le recruteur et ses offres
//   useEffect(() => {
//     fetch('http://localhost:8000/api/recruteur/REC-2025-001/')
//       .then(res => res.json())
//       .then(data => {
//         setRecruteur(data.recruteur);
//         console.log('Recruteur :', data.recruteur);
//         console.log('Offres du recruteur :', data.offres);
//       })
//       .catch(err => console.error('Erreur fetch recruteur:', err));
//   }, []);

//   // Récupérer les détails de l'offre et ses candidats
//   useEffect(() => {
//     fetch(`http://localhost:8000/api/recruteur/offre/offre_01/candidats/`)
//       .then(res => res.json())
//       .then(data => {
//         setOffre(data);
//         setLoading(false);
//         console.log('Offre avec candidats :', data);
//       })
//       .catch(err => {
//         console.error('Erreur chargement offre:', err);
//         setLoading(false);
//       });
//   }, [offreId]);

//   const handleStatusChange = (candidatId, newStatus) => {
//     setOffre(prevOffre => {
//       if (!prevOffre) return prevOffre;
//       const updatedCandidats = prevOffre.candidats.map(candidat => {
//         if (candidat.id === candidatId) {
//           return { ...candidat, status: newStatus };
//         }
//         return candidat;
//       });
//       return { ...prevOffre, candidats: updatedCandidats };
//     });
//   };

//   if (loading) return <p>Chargement en cours...</p>;
//   if (!offre) return <p>Offre introuvable</p>;

//   return (
//     <Template>
//       <div className="container mx-auto py-6">
//         <OffreDetail 
//           offre={offre} 
//           onStatusChange={handleStatusChange} 
//         />
//       </div>
//     </Template>
//   );
// };

// export default Dashboard;




// src/Recruteur/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import Template from '../Layouts/Template';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { useNavigate } from 'react-router-dom';

// ----------------- Global Styles -----------------
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  * { box-sizing: border-box; }
  body { 
    font-family: 'Inter', sans-serif; 
    background-color: #f9fafb; 
    color: #374151; 
    margin: 0;
    padding: 0;
  }
`;

// ----------------- Animations -----------------
const fadeInUp = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

// ----------------- Styled Components -----------------
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;

const WelcomeSection = styled.div`
  margin-bottom: 2.5rem;
  animation: ${fadeInUp} 0.6s ease forwards;
`;

const WelcomeTitle = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  
  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.125rem;
  color: #64748b;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2.5rem;
  animation: ${fadeInUp} 0.6s ease 0.2s forwards;
  opacity: 0;
`;

const StatCard = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: ${fadeInUp} 0.6s ease 0.4s forwards;
  opacity: 0;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  animation: ${fadeInUp} 0.6s ease 0.6s forwards;
  opacity: 0;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: #fff;
  padding: 1.75rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border-color: #3b82f6;
    
    &::after {
      transform: translateX(0);
    }
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
`;

const CardMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
  margin-top: auto;
`;

const CandidatesCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #3b82f6;
  background: #dbeafe;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
`;

const ViewButton = styled.button`
  background: transparent;
  color: #3b82f6;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;

  &:hover {
    background: #eff6ff;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 1rem;
  grid-column: 1 / -1;
`;

const Spinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 3px solid #dbeafe;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: ${pulse} 1.5s linear infinite;
  margin-bottom: 1.5rem;
`;

const LoadingText = styled.p`
  color: #64748b;
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 1.5rem;
  border-radius: 0.75rem;
  text-align: center;
  margin: 2rem 0;
  border: 1px solid #fecaca;
  animation: ${fadeInUp} 0.6s ease forwards;
`;

const EmptyState = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  grid-column: 1 / -1;
  animation: ${fadeInUp} 0.6s ease forwards;
  
  div {
    font-size: 3rem;
    margin-bottom: 1.5rem;
  }
  
  h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }
  
  p {
    color: #64748b;
    margin: 0;
  }
`;

// ----------------- Icons -----------------
const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

// ----------------- Component -----------------
const Dashboard = () => {
  const [recruteur, setRecruteur] = useState(null);
  const [offres, setOffres] = useState([]);
  const [stats, setStats] = useState({
    totalOffres: 0,
    totalCandidats: 0,
    entretiensPlanifies: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:8000/api/recruteur/1/');
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        console.log('Recruteur data:', data);
        setRecruteur(data.recruteur);
        setOffres(Array.isArray(data.offres) ? data.offres : []);
        
        // Calculer les statistiques
        const totalCandidats = data.offres.reduce((acc, offre) => acc + (offre.nb_candidats || 0), 0);
        const entretiensPlanifies = data.offres.reduce((acc, offre) => acc + (offre.entretiens_planifies || 0), 0);
        
        setStats({
          totalOffres: data.offres.length,
          totalCandidats,
          entretiensPlanifies
        });
      } catch (e) {
        setError("Impossible de charger les données du recruteur.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleOffreClick = (offreId) => {
    if (!offreId) return;
    navigate(`/recruteur/offre/${offreId}`);
  };

  if (loading) {
    return (
      <Template>
        <GlobalStyle />
        <Container>
          <LoadingContainer>
            <Spinner />
            <LoadingText>Chargement de votre tableau de bord...</LoadingText>
          </LoadingContainer>
        </Container>
      </Template>
    );
  }

  if (error) {
    return (
      <Template>
        <GlobalStyle />
        <Container>
          <ErrorMessage>
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
          </ErrorMessage>
        </Container>
      </Template>
    );
  }

  if (!recruteur) {
    return (
      <Template>
        <GlobalStyle />
        <Container>
          <EmptyState>
            <div>👤</div>
            <h3>Recruteur introuvable</h3>
            <p>Nous n'avons pas pu trouver les informations de ce recruteur.</p>
          </EmptyState>
        </Container>
      </Template>
    );
  }

  return (
    <Template>
      <GlobalStyle />
      <Container>
        <WelcomeSection>
          <WelcomeTitle>Bienvenue, {recruteur.nomComplet}</WelcomeTitle>
          <WelcomeSubtitle>Voici un aperçu de vos offres d'emploi et candidatures</WelcomeSubtitle>
        </WelcomeSection>

        <StatsContainer>
          <StatCard>
            <StatValue>{stats.totalOffres}</StatValue>
            <StatLabel>Offres d'emploi</StatLabel>
          </StatCard>
          
          <StatCard>
            <StatValue>{stats.totalCandidats}</StatValue>
            <StatLabel>Candidats total</StatLabel>
          </StatCard>
          
          
        </StatsContainer>

        <SectionTitle>
          <BriefcaseIcon />
          Vos offres d'emploi
        </SectionTitle>
        
        {offres.length === 0 ? (
          <EmptyState>
            <div>📋</div>
            <h3>Aucune offre d'emploi</h3>
            <p>Vous n'avez pas encore créé d'offres d'emploi.</p>
          </EmptyState>
        ) : (
          <Grid>
            {offres.map(offre => (
              <Card key={offre.id} onClick={() => handleOffreClick(offre.id)}>
                <CardTitle>{offre.titre}</CardTitle>
                
                <CardMeta>
                  <MetaItem>
                    <BriefcaseIcon />
                    {offre.metier}
                  </MetaItem>
                  
                  <MetaItem>
                    <LocationIcon />
                    {offre.lieu}
                  </MetaItem>
                </CardMeta>
                
                <CardFooter>
                  <CandidatesCount>
                    <UsersIcon />
                    {offre.nb_candidats || 0} candidats
                  </CandidatesCount>
                  
                  <ViewButton>
                    Voir détails
                    <ChevronRightIcon />
                  </ViewButton>
                </CardFooter>
              </Card>
            ))}
          </Grid>
        )}
      </Container>
    </Template>
  );
};

export default Dashboard;




// import React, { useState, useEffect } from 'react';
// import Template from '../Layouts/Template';
// import OffreDetail from './OffreDetail';
// import styled, { keyframes } from 'styled-components';
// import { useNavigate } from 'react-router-dom';

// // Animations
// const fadeInUp = keyframes`
//   from { opacity: 0; transform: translateY(20px); }
//   to { opacity: 1; transform: translateY(0); }
// `;

// const Container = styled.div`
//   max-width: 1200px;
//   margin: 0 auto;
//   padding: 2rem;
// `;

// const Title = styled.h1`
//   font-size: 2rem;
//   font-weight: bold;
//   margin-bottom: 1.5rem;
// `;

// const Grid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
//   gap: 1.5rem;
// `;

// const Card = styled.div`
//   background: #fff;
//   padding: 1.5rem;
//   border-radius: 0.75rem;
//   box-shadow: 0 2px 8px rgba(0,0,0,0.1);
//   cursor: pointer;
//   transition: all 0.3s ease;
//   animation: ${fadeInUp} 0.5s ease forwards;

//   &:hover {
//     transform: scale(1.05);
//     box-shadow: 0 6px 15px rgba(0,0,0,0.2);
//   }
// `;

// const CardTitle = styled.h2`
//   font-size: 1.25rem;
//   font-weight: 600;
// `;

// const CardSubtitle = styled.p`
//   color: #6b7280;
//   font-size: 0.9rem;
// `;

// const OffreWrapper = styled.div`
//   margin-top: 2rem;
// `;

// const Dashboard = () => {
//   const [recruteur, setRecruteur] = useState(null);
//   const [offres, setOffres] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate(); // ✅ correct

//   useEffect(() => {
//     fetch('http://localhost:8000/api/recruteur/REC-2025-001/')
//       .then(res => res.json())
//       .then(data => {
//         setRecruteur(data.recruteur);
//         setOffres(data.offres);
//         setLoading(false);
//       })
//       .catch(err => console.error(err));
//   }, []);

//   const handleOffreClick = (offreId) => {
//     // Optionnel : tu peux aussi charger les candidats ici avant de naviguer
//     navigate(`/recruteur/offre/${offreId}`); // redirection
//   };

//   if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</p>;
//   if (!recruteur) return <p style={{ textAlign: 'center', padding: '2rem' }}>Recruteur introuvable</p>;

//   return (
//     <Template>
//       <Container>
//         <h1>Bienvenue, {recruteur.nomComplet}</h1>

//         <Grid>
//           {offres.map(offre => (
//             <Card key={offre.id} onClick={() => handleOffreClick(offre.id)}>
//               <h2>{offre.titre}</h2>
//               <p>{offre.metier}</p>
//               <p>{offre.lieu}</p>
//             </Card>
//           ))}
//         </Grid>
//       </Container>
//     </Template>
//   );
// };

// export default Dashboard;

