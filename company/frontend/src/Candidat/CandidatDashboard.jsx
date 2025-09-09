// import React, { useEffect, useState } from "react";
// import styled from "styled-components";
// import TemplateCan from "../CandidatNavbar/TemplateCan";

// const DashboardContainer = styled.div`
//   padding: 40px;
//   font-family: 'Montserrat', sans-serif;
//   background-color: #f4f7fc;
// `;

// const Title = styled.h1`
//   font-size: 32px;
//   margin-bottom: 30px;
//   color: #2f3e46;
// `;

// const Grid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
//   gap: 20px;
// `;

// const Card = styled.div`
//   background: #fff;
//   padding: 25px;
//   border-radius: 16px;
//   box-shadow: 0 8px 20px rgba(0,0,0,0.05);
//   transition: transform 0.3s ease, box-shadow 0.3s ease;
//   text-align: center;

//   &:hover {
//     transform: translateY(-5px);
//     box-shadow: 0 12px 30px rgba(0,0,0,0.1);
//   }
// `;

// const CardTitle = styled.h2`
//   font-size: 20px;
//   margin: 15px 0 10px;
//   color: #1d3557;
// `;

// const CardText = styled.p`
//   font-size: 14px;
//   color: #6c757d;
//   margin: 5px 0;
// `;

// const LinkStyled = styled.a`
//   color: #4cc9f0;
//   text-decoration: none;
//   &:hover {
//     text-decoration: underline;
//   }
// `;

// const CandidatDashboard = () => {
//   const [candidat, setCandidat] = useState(null);

//   useEffect(() => {
//     fetch("http://localhost:8000/api/candidat/can_01/")
//       .then(res => res.json())
//       .then(data => setCandidat(data))
//       .catch(err => console.error("Erreur fetch :", err));
//   }, []);

//   if (!candidat) return <div>Chargement...</div>;

//   return (
//     <TemplateCan messagerieEntretiens={candidat.entretiens}>
//     <DashboardContainer>
//       <Title>Bienvenue {candidat.nomComplet}</Title>
//       <Grid>
//         <Card>
//           <CardTitle>Informations personnelles</CardTitle>
//           <CardText>Email : {candidat.email}</CardText>
//           <CardText>Métier recherché : {candidat.metierRecherche}</CardText>
//           <CardText>Filière : {candidat.filiere}</CardText>
//           <CardText>Branche : {candidat.branche}</CardText>
//         </Card>

//         <Card>
//           <CardTitle>Candidatures</CardTitle>
//           {candidat.applications.length === 0 && <CardText>Aucune candidature</CardText>}
//           {candidat.applications.map(app => (
//             <CardText key={app.offre__id}>
//               {app.offre__titre} ({new Date(app.date_ajout).toLocaleDateString()})
//             </CardText>
//           ))}
//         </Card>

//         <Card>
//           <CardTitle>Entretiens</CardTitle>
//           {candidat.entretiens.length === 0 && <CardText>Aucun entretien prévu</CardText>}
//           {candidat.entretiens.map(ent => (
//             <CardText key={ent.token}>
//               {ent.offre__titre} - Lien :{" "}
//               <LinkStyled href={`http://localhost:8000/api/interview/${ent.token}/`} target="_blank">
//                 Voir entretien
//               </LinkStyled>
//             </CardText>
//           ))}
//         </Card>
//       </Grid>
//     </DashboardContainer>
//     </TemplateCan>
//   );
// };

// export default CandidatDashboard;



import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import TemplateCan from "../CandidatNavbar/TemplateCan";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const gradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Styled Components
const DashboardContainer = styled.div`
  padding: 40px;
  font-family: 'Montserrat', sans-serif;
  background: linear-gradient(-45deg, #f4f7fc, #eef2f7, #f9fbff, #e6ecf8);
  background-size: 400% 400%;
  animation: ${gradient} 15s ease infinite;
  min-height: 100vh;
`;

const Title = styled.h1`
  font-size: 2.8rem;
  margin-bottom: 30px;
  color: #2f3e46;
  text-align: center;
  font-weight: 700;
  position: relative;
  padding-bottom: 15px;
  animation: ${fadeIn} 0.8s ease-out;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 4px;
    background: linear-gradient(90deg, #4cc9f0, #4361ee);
    border-radius: 2px;
  }
`;

const WelcomeText = styled.p`
  text-align: center;
  color: #6c757d;
  margin-bottom: 40px;
  font-size: 1.2rem;
  animation: ${fadeIn} 1s ease-out;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 30px;
  margin-top: 20px;
`;

const Card = styled.div`
  background: #fff;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.8s ease-out;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 100%;
    background: linear-gradient(to bottom, #4cc9f0, #4361ee);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const CardIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: ${props => props.color || '#4361ee'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  color: white;
  font-size: 1.5rem;
  animation: ${float} 4s ease-in-out infinite;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  color: #1d3557;
  margin: 0;
  font-weight: 600;
`;

const CardContent = styled.div`
  margin-top: 20px;
`;

const CardText = styled.p`
  font-size: 1rem;
  color: #6c757d;
  margin: 12px 0;
  padding-left: 10px;
  position: relative;
  
  &::before {
    content: '•';
    position: absolute;
    left: 0;
    color: #4361ee;
  }
`;

const LinkStyled = styled.a`
  color: #4cc9f0;
  text-decoration: none;
  font-weight: 500;
  position: relative;
  transition: all 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: #4cc9f0;
    transition: width 0.3s ease;
  }
  
  &:hover {
    color: #4361ee;
    
    &::after {
      width: 100%;
    }
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-left: 10px;
  background: ${props => {
    switch(props.status) {
      case 'completed': return '#e7f5ef';
      case 'pending': return '#fff4e6';
      case 'upcoming': return '#e3f2fd';
      default: return '#f0f0f0';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'completed': return '#2ecc71';
      case 'pending': return '#f39c12';
      case 'upcoming': return '#3498db';
      default: return '#95a5a6';
    }
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: #bdc3c7;
  
  i {
    font-size: 3rem;
    margin-bottom: 15px;
    display: block;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(76, 201, 240, 0.3);
    border-radius: 50%;
    border-top-color: #4cc9f0;
    animation: spin 1s ease-in-out infinite;
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  }
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin-bottom: 40px;
  animation: ${fadeIn} 0.8s ease-out;
`;

const StatCard = styled.div`
  background: white;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  text-align: center;
  width: 180px;
  transition: all 0.3s ease;
  animation: ${pulse} 2s infinite;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  }
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #4361ee;
  margin-bottom: 10px;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: #6c757d;
`;

const CandidatDashboard = () => {
  const [candidat, setCandidat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with a delay for better UX
    setTimeout(() => {
      fetch("http://localhost:8000/api/candidat/4274e628-a/")
        .then(res => res.json())
        .then(data => {
          setCandidat(data);
          setLoading(false);
          console.log(data);
        })
        .catch(err => {
          console.error("Erreur fetch :", err);
          setLoading(false);
        });
    }, 1500);
  }, []);

  if (loading) {
    return (
      <TemplateCan>
        <DashboardContainer>
          <LoadingSpinner>
            <div className="spinner"></div>
          </LoadingSpinner>
        </DashboardContainer>
      </TemplateCan>
    );
  }

  if (!candidat) return <div>Erreur de chargement des données</div>;

  // Calculate stats for the dashboard
  const applicationsCount = candidat.applications.length;
  const interviewsCount = candidat.entretiens.length;
  const completedInterviews = candidat.entretiens.filter(ent => ent.status === 'completed').length;

  return (
    <TemplateCan messagerieEntretiens={candidat.entretiens}>
      <DashboardContainer>
        <Title>Tableau de Bord Candidat</Title>
        <WelcomeText>Bienvenue {candidat.nomComplet}, voici votre espace personnel</WelcomeText>
        
        <StatsContainer>
          <StatCard>
            <StatNumber>{applicationsCount}</StatNumber>
            <StatLabel>Candidatures</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{interviewsCount}</StatNumber>
            <StatLabel>Entretiens</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{completedInterviews}</StatNumber>
            <StatLabel>Entretiens terminés</StatLabel>
          </StatCard>
        </StatsContainer>
        
        <Grid>
          <Card>
            <CardHeader>
              <CardIcon color="#4361ee">
                <i className="fas fa-user"></i>
              </CardIcon>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <CardText><strong>Email :</strong> {candidat.email}</CardText>
              <CardText><strong>Métier recherché :</strong> {candidat.metierRecherche}</CardText>
              <CardText><strong>Filière :</strong> {candidat.filiere}</CardText>
              <CardText><strong>Branche :</strong> {candidat.branche}</CardText>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardIcon color="#f6b605ff">
                <i className="fas fa-file-alt"></i>
              </CardIcon>
              <CardTitle>Mes Candidatures</CardTitle>
            </CardHeader>
            <CardContent>
              {candidat.applications.length === 0 ? (
                <EmptyState>
                  <i className="fas fa-folder-open"></i>
                  <p>Aucune candidature pour le moment</p>
                </EmptyState>
              ) : (
                candidat.applications.map(app => (
                  <CardText key={app.offre__id}>
                    <strong>{app.offre__titre}</strong> 
                    <br />
                    <small>Postulé le {new Date(app.date_ajout).toLocaleDateString('fr-FR')}</small>
                    <StatusBadge status={app.status || 'pending'}>
                      {app.status === 'accepted' ? 'Accepté' : 
                       app.status === 'rejected' ? 'Rejeté' : 'En attente'}
                    </StatusBadge>
                  </CardText>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardIcon color="#08aeefff">
                <i className="fas fa-video"></i>
              </CardIcon>
              <CardTitle>Mes Entretiens</CardTitle>
            </CardHeader>
            <CardContent>
              {candidat.entretiens.length === 0 ? (
                <EmptyState>
                  <i className="fas fa-calendar-times"></i>
                  <p>Aucun entretien prévu</p>
                </EmptyState>
              ) : (
                candidat.entretiens.map(ent => (
                  <CardText key={ent.token}>
                    <strong>{ent.offre__titre}</strong>
                    <br />
                    <small>
                      {ent.date_prevue ? 
                        `Programmé le ${new Date(ent.date_prevue).toLocaleDateString('fr-FR')}` : 
                        'Date à définir'}
                    </small>
                    <br />
                    <LinkStyled href={`http://localhost:8000/api/interview/${ent.token}/`} target="_blank">
                      <i className="fas fa-external-link-alt"></i> Accéder à l'entretien
                    </LinkStyled>
                  </CardText>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </DashboardContainer>
    </TemplateCan>
  );
};

export default CandidatDashboard;
