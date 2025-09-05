// import React, { useState } from 'react';
// import { Routes, Route } from 'react-router-dom';  
// import Dashboard from '../Recruteur/Dashboard';
// import CandidatDashboard from '../Candidat/CandidatDashboard';
// import NotFound from '../Notfound/NotFound';
// import Messagerie from '../Candidat/Messagerie';
// import Instructions from '../Candidat/Instructions';
// import Interview from '../Candidat/Interview';
// import VoirEntretiens from '../Recruteur/VoirEntretiens';
// import OffreDetail from '../Recruteur/OffreDetail';


// const Routing = () => {
//   return (
//     <Routes>
//       <Route path="/recruteur/dashboard" element={<Dashboard />} />
//       <Route path="/recruteur/voirentretiens" element={<VoirEntretiens />} />
//       <Route path="/recruteur/offre/:offreId" element={<OffreDetail />} />
//       <Route path="/candidat/dashboard" element={<CandidatDashboard/>} />
//       <Route path="/candidat/dashboard/messagerie" element={<Messagerie />} />
//       <Route path="/candidat/dashboard/messagerie/instructions/:token" element={<Instructions />} />
//       <Route path="/candidat/dashboard/messagerie/instructions/interview/:token" element={<Interview />} />
//       <Route path="*" element={<NotFound/>} />
//     </Routes>
//   );
// }


// export default Routing;

// src/Routes/Routing.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Dashboard from '../Recruteur/Dashboard';
import CandidatDashboard from '../Candidat/CandidatDashboard';
import NotFound from '../Notfound/NotFound';
import Messagerie from '../Candidat/Messagerie';
import Instructions from '../Candidat/Instructions';
import Interview from '../Candidat/Interview';
import VoirEntretiens from '../Recruteur/VoirEntretiens';
import OffreDetail from '../Recruteur/OffreDetail';

const Routing = () => {
  return (
    <Routes>
      <Route path="/recruteur/dashboard" element={<Dashboard />} />
      <Route path="/recruteur/voirentretiens" element={<VoirEntretiens />} />
      <Route path="/recruteur/offre/:offreId" element={<OffreDetail />} />
      <Route path="/candidat/dashboard" element={<CandidatDashboard />} />
      <Route path="/candidat/dashboard/messagerie" element={<Messagerie />} />
      <Route path="/candidat/dashboard/messagerie/instructions/:token" element={<Instructions />} />
      <Route path="/candidat/dashboard/messagerie/instructions/interview/:token" element={<Interview />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Routing;
