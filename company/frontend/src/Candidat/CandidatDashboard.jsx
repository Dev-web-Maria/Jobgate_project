import React, { useEffect, useState } from "react";
import styled from "styled-components";
import TemplateCan from "../CandidatNavbar/TemplateCan";

const DashboardContainer = styled.div`
  padding: 40px;
  font-family: 'Montserrat', sans-serif;
  background-color: #f4f7fc;
`;

const Title = styled.h1`
  font-size: 32px;
  margin-bottom: 30px;
  color: #2f3e46;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background: #fff;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  text-align: center;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.1);
  }
`;

const CardTitle = styled.h2`
  font-size: 20px;
  margin: 15px 0 10px;
  color: #1d3557;
`;

const CardText = styled.p`
  font-size: 14px;
  color: #6c757d;
  margin: 5px 0;
`;

const LinkStyled = styled.a`
  color: #4cc9f0;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const CandidatDashboard = () => {
  const [candidat, setCandidat] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/candidat/4274e628-a/")
      .then(res => res.json())
      .then(data => setCandidat(data))
      .catch(err => console.error("Erreur fetch :", err));
  }, []);

  if (!candidat) return <div>Chargement...</div>;

  return (
    <TemplateCan messagerieEntretiens={candidat.entretiens}>
    <DashboardContainer>
      <Title>Bienvenue {candidat.nomComplet}</Title>
      <Grid>
        <Card>
          <CardTitle>Informations personnelles</CardTitle>
          <CardText>Email : {candidat.email}</CardText>
          <CardText>Métier recherché : {candidat.metierRecherche}</CardText>
          <CardText>Filière : {candidat.filiere}</CardText>
          <CardText>Branche : {candidat.branche}</CardText>
        </Card>

        <Card>
          <CardTitle>Candidatures</CardTitle>
          {candidat.applications.length === 0 && <CardText>Aucune candidature</CardText>}
          {candidat.applications.map(app => (
            <CardText key={app.offre__id}>
              {app.offre__titre} ({new Date(app.date_ajout).toLocaleDateString()})
            </CardText>
          ))}
        </Card>

        <Card>
          <CardTitle>Entretiens</CardTitle>
          {candidat.entretiens.length === 0 && <CardText>Aucun entretien prévu</CardText>}
          {candidat.entretiens.map(ent => (
            <CardText key={ent.token}>
              {ent.offre__titre} - Lien :{" "}
              <LinkStyled href={`http://localhost:8000/api/interview/${ent.token}/`} target="_blank">
                Voir entretien
              </LinkStyled>
            </CardText>
          ))}
        </Card>
      </Grid>
    </DashboardContainer>
    </TemplateCan>
  );
};

export default CandidatDashboard;
