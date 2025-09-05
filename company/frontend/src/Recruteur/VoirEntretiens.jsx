// C:\dev\company\frontend\src\Recruteur\VoirEntretiens.jsx
// ============================================================================
// PAGE : VoirEntretiens
// - AJOUTS IA : flag qualité, score /100, jauge 4 couleurs, radar 0..100,
//   masquage résumé, reset de la card IA au changement d’entretien,
//   bouton IA centré, + CACHE d'analyses pour éviter de relancer.
// ============================================================================

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Template from "../Layouts/Template";
import styled, { keyframes, createGlobalStyle } from "styled-components";

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
const pulse = keyframes`0% {transform:scale(1)} 50% {transform:scale(1.05)} 100% {transform:scale(1)}`;

// ----------------- Styled Components -----------------
const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
`;

const Sidebar = styled.div`
  width: 320px;
  background: white;
  border-right: 1px solid #e2e8f0;
  padding: 1.5rem 1rem;
  overflow-y: auto;
  height: 100vh;
  position: sticky;
  top: 0;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`;

const SidebarHeader = styled.div`
  padding: 0 0.75rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 1.5rem;
`;

const SidebarTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
  input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    transition: all 0.2s;
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
    }
  }
  svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const FilterSection = styled.div`
  margin-bottom: 1.5rem;
`;

const FilterTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FilterCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #475569;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  &:hover { background: #f1f5f9; }
  input { margin: 0; }
`;

const CandidateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CandidateListItem = styled(motion.div)`
  padding: 1rem;
  border-radius: 0.75rem;
  background: ${p => (p.active ? "#e0f2fe" : "white")};
  border: 1px solid ${p => (p.active ? "#38bdf8" : "#e2e8f0")};
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: #38bdf8; background: #f0f9ff; }
`;

const CandidateName = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CandidatePosition = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
`;

const CandidateMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CandidateDate = styled.span`
  font-size: 0.75rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const CandidateScore = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${p => (p.score >= 4 ? '#166534' : p.score >= 2.5 ? '#92400e' : '#991b1b')};
  background: ${p => (p.score >= 4 ? '#dcfce7' : p.score >= 2.5 ? '#fef3c7' : '#fee2e2')};
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
`;

const ContentTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ControlButton = styled.button`
  background: ${p => (p.primary ? '#3b82f6' : 'white')};
  color: ${p => (p.primary ? 'white' : '#475569')};
  border: 1px solid ${p => (p.primary ? '#3b82f6' : '#e2e8f0')};
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: ${p => (p.primary ? '#2563eb' : '#f8fafc')}; }
  svg { width: 1.25rem; height: 1.25rem; }
`;

const InterviewContent = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  @media (max-width: 1200px) { grid-template-columns: 1fr; }
`;

const VideoSection = styled.div`
  grid-column: 1 / -1;
`;

const VideoContainer = styled.div`
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  margin-bottom: 1.5rem;
`;

const StyledVideo = styled.video`
  width: 100%;
  display: block;
`;

const PlayOverlay = styled.div`
  position: absolute; inset: 0;
  display: flex; justify-content: center; align-items: center;
  cursor: pointer;
  background: rgba(0,0,0,0.3);
  opacity: ${p => (p.visible ? 1 : 0)};
  transition: opacity .3s ease;
`;

const PlayButton = styled.div`
  background: rgba(255,255,255,0.9);
  border-radius: 50%;
  width: 80px; height: 80px;
  display: flex; justify-content: center; align-items: center;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);
  svg { width: 2.5rem; height: 2.5rem; color: #3b82f6; }
`;

const VideoControls = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 2rem;
`;

const ProgressBar = styled.div`
  flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px;
  margin: 0 1rem; overflow: hidden; position: relative;
`;

const Progress = styled.div`
  height: 100%; background: #3b82f6;
  width: ${p => p.progress}%; border-radius: 3px;
`;

const TimeDisplay = styled.span`
  font-size: 0.875rem; color: #64748b; min-width: 80px; text-align: center;
`;

const QuestionsSection = styled.div`
  background: white; border-radius: 1rem; padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); height: fit-content;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem; font-weight: 600; color: #1e293b; margin: 0 0 1.5rem 0;
  display: flex; align-items: center; gap: 0.75rem;
  padding-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9;
`;

const QuestionList = styled.div`
  display: flex; flex-direction: column; gap: 1rem; max-height: 400px;
  overflow-y: auto; padding-right: 0.5rem;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
  &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  &::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
`;

const QuestionItem = styled(motion.div)`
  background: #f8fafc; padding: 1.25rem; border-radius: 0.75rem;
  border-left: 4px solid ${p => (p.answeredWell ? '#10b981' : p.answeredPoorly ? '#ef4444' : '#3b82f6')};
  cursor: pointer; transition: all .2s ease;
  &:hover { background: #f1f5f9; transform: translateY(-2px); }
`;

const QuestionText = styled.p`
  font-weight: 500; color: #1e293b; margin: 0 0 0.75rem 0; display: flex; align-items: flex-start;
  span { color: #3b82f6; margin-right: 0.75rem; font-size: 1.125rem; }
`;

const QuestionMeta = styled.div`
  display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem;
`;

const TimeBadge = styled.span`
  background: #dbeafe; color: #1d4ed8; padding: 0.375rem 0.75rem; border-radius: 0.375rem;
  font-weight: 500; display: flex; align-items: center; gap: 0.375rem;
`;

const EvaluationSection = styled.div`
  background: white; border-radius: 1rem; padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  height: 100%; min-height: 420px;
  display: flex; flex-direction: column; justify-content: space-between;
`;

const EvaluationTitle = styled.h3`
  font-size: 1.25rem; font-weight: 600; color: #1e293b;
  margin: 0 0 1.5rem 0; display: flex; align-items: center; gap: 0.75rem;
`;

const StarRating = styled.div`
  display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1.5rem;
`;

const Star = styled(motion.button)`
  width: 3rem; height: 3rem; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: none; cursor: pointer; font-weight: 600; font-size: 1rem;
  background: ${p => (p.active ? "linear-gradient(135deg,#f59e0b 0%,#f97316 100%)" : "#f1f5f9")};
  color: ${p => (p.active ? "white" : "#94a3b8")};
  &:hover {
    background: ${p => (p.active ? "linear-gradient(135deg,#f59e0b 0%,#f97316 100%)" : "#e2e8f0")};
  }
`;

const FeedbackInput = styled.textarea`
  width: 100%; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.75rem;
  font-family: 'Inter', sans-serif; font-size: 0.875rem; resize: vertical; min-height: 120px; margin-bottom: 1.5rem;
  &:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
  &::placeholder { color: #94a3b8; }
`;

const DecisionButtons = styled.div`
  display: flex; gap: 0.75rem; justify-content: flex-end;
`;

const RejectButton = styled.button`
  background: white; color: #dc2626; border: 1px solid #e5e7eb;
  padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 0.5rem;
  &:hover { background: #fef2f2; border-color: #dc2626; }
  svg { width: 1.25rem; height: 1.25rem; }
`;

const AcceptButton = styled(RejectButton)`
  background: #3b82f6; color: white; border: 1px solid #3b82f6;
  &:hover { background: #2563eb; border-color: #2563eb; }
`;

const LoadingContainer = styled.div`
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 5rem 1rem; grid-column: 1 / -1;
`;

const Spinner = styled.div`
  width: 4rem; height: 4rem; border: 4px solid #dbeafe; border-top: 4px solid #2563eb;
  border-radius: 50%; animation: ${pulse} 1.5s linear infinite; margin-bottom: 1.5rem;
`;

const LoadingText = styled.p`
  color: #64748b; font-weight: 500;
`;

const EmptyState = styled(motion.div)`
  background: white; border-radius: 1.25rem; padding: 3rem; text-align: center;
  max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  grid-column: 1 / -1;
  div { font-size: 4rem; margin-bottom: 1.5rem; }
  h3 { font-size: 1.5rem; font-weight: 600; color: #1e293b; margin: 0 0 0.5rem 0; }
  p { color: #64748b; margin: 0; }
`;

const FinalResult = styled.div`
  background: ${p => (p.status === "Accepté" ? '#dcfce7' : '#fee2e2')};
  padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 1.5rem;
  border: 1px solid ${p => (p.status === "Accepté" ? '#10b981' : '#ef4444')};
  text-align: center;
`;

const FinalResultTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: ${p => (p.status === "Accepté" ? '#166534' : '#991b1b')};
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
`;

const FinalResultText = styled.p`
  margin: 0; font-size: 0.875rem;
  color: ${p => (p.status === "Accepté" ? '#166534' : '#991b1b')};
`;

const StatusBadge = styled.span`
  display: inline-block; padding: 0.4rem 0.8rem; border-radius: 9999px;
  font-size: 0.75rem; font-weight: 600; text-transform: capitalize; text-align: center; margin-top: 1rem;
  color: ${({ status }) =>
    status === "Accepté" ? "#065f46" :
    status === "Rejete" ? "#991b1b" :
    status === "EnProcessus" ? "#1e40af" : "#374151"};
  background-color: ${({ status }) =>
    status === "Accepté" ? "#d1fae5" :
    status === "Rejete" ? "#fee2e2" :
    status === "EnProcessus" ? "#dbeafe" : "#e5e7eb"};
  border: 1px solid ${({ status }) =>
    status === "Accepté" ? "#10b981" :
    status === "Rejete" ? "#ef4444" :
    status === "EnProcessus" ? "#3b82f6" : "#9ca3af"};
`;

// ----------------- Icons -----------------
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
  </svg>
);

const XMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
  </svg>
);

// === AJOUT IA — styles carte IA, jauge, radar, badge qualité
const IASection = styled(motion.div)`
  grid-column: 1 / -1; background: white; border-radius: 1rem; padding: 1.5rem; margin-top: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
`;
const IATitle = styled.h3`
  font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem 0; display: flex; align-items: center; gap: .5rem;
`;
const IAGrid = styled.div`
  display: grid; grid-template-columns: 420px 1fr; gap: 1.25rem; align-items: stretch;
  @media (max-width: 1200px) { grid-template-columns: 1fr; }
`;
const BigTotal = styled.div`
  font-size: 3.25rem; font-weight: 800; line-height: 1; color: ${p => p.color || '#1f2937'};
`;
const InfoBlock = styled.div`
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: .75rem; padding: 1rem;
`;
const GaugeWrap = styled.div`
  background: #fff; border: 1px solid #e2e8f0; border-radius: .75rem; padding: 1rem;
`;
const RadarWrap = styled.div`
  background: #fff; border: 1px solid #e2e8f0; border-radius: .75rem; padding: 1rem;
`;

// Bouton IA
const IAButtonRow = styled.div` margin-top: 2.5rem; display: flex; justify-content: center; `;
const IAButton = styled.button`
  background: #e0f2fe; color: #2563eb; border: 1px solid #bae6fd; padding: 0.8rem 1.1rem;
  border-radius: 0.75rem; font-size: 0.95rem; font-weight: 600; display: inline-flex; align-items: center; gap: .5rem;
  cursor: pointer; transition: all .2s; box-shadow: 0 1px 4px #2563eb11;
  &:hover { background:#bae6fd; border-color:#60a5fa; color:#1d4ed8; }
  &:disabled { opacity:.6; cursor:not-allowed; }
`;

function QualityBadge({ quality }) {
  if (!quality) return null;
  let bg = '#f1f5f9', fg = '#334155', label = quality;
  if (quality === 'non_exploitable') { bg = '#fee2e2'; fg = '#991b1b'; label = 'Non exploitable'; }
  else if (quality === 'low_quality') { bg = '#fef3c7'; fg = '#92400e'; label = 'Qualité faible'; }
  else if (quality === 'ok') { bg = '#dcfce7'; fg = '#166534'; label = 'OK'; }
  return <span style={{background:bg, color:fg, fontWeight:600, fontSize:12, padding:'4px 8px', borderRadius:8}}>{label}</span>;
}

function bandFor(score){ const s=Math.max(0,Math.min(100,Number(score||0))); if(s<=25)return{label:'Poor',color:'#ef4444'}; if(s<=50)return{label:'Average',color:'#f97316'}; if(s<=75)return{label:'Good',color:'#f59e0b'}; return{label:'Excellent',color:'#22c55e'}; }

function ScoreGauge({ value=0 }){
  const v=Math.max(0,Math.min(100,value)); const angle=-90+(v/100)*180;
  const arcDefs=[{color:"#ef4444",start:-90,end:-45},{color:"#f97316",start:-45,end:0},{color:"#facc15",start:0,end:45},{color:"#22c55e",start:45,end:90}];
  function polarToCartesian(cx,cy,r,a){const rad=(a-90)*Math.PI/180;return{ x:cx+r*Math.cos(rad), y:cy+r*Math.sin(rad) };}
  function describeArc(cx,cy,r,start,end){const s=polarToCartesian(cx,cy,r,end);const e=polarToCartesian(cx,cy,r,start);const f=end-start<=180?"0":"1";return ["M",s.x,s.y,"A",r,r,0,f,0,e.x,e.y].join(" "); }
  const needleLength=90; const rad=(angle-90)*Math.PI/180; const nx=120+needleLength*Math.cos(rad); const ny=120+needleLength*Math.sin(rad);
  const zones=[{label:"POOR",from:0,to:25,color:"#ef4444"},{label:"AVERAGE",from:25,to:50,color:"#f97316"},{label:"GOOD",from:50,to:75,color:"#facc15"},{label:"EXCELLENT",from:75,to:100,color:"#22c55e"}];
  const zone=zones.find(z=>v>=z.from&&v<=z.to)||zones[0];
  return (<div style={{width:260,margin:"0 auto"}}>
    <svg viewBox="0 0 240 140" width="100%" height="140">
      {arcDefs.map((a,i)=>(<path key={i} d={describeArc(120,120,100,a.start,a.end)} stroke={a.color} strokeWidth="28" fill="none" opacity="0.95" />))}
      <circle cx={120} cy={120} r={18} fill="#222" stroke="#fff" strokeWidth="4" />
      <line x1={120} y1={120} x2={nx} y2={ny} stroke="#222" strokeWidth="8" strokeLinecap="round" />
      <circle cx={120} cy={120} r={8} fill="#fff" />
    </svg>
    <div style={{textAlign:"center",marginTop:".5rem",fontWeight:700,fontSize:22,color:zone.color,letterSpacing:1}}>{zone.label}</div>
  </div>);
}

function RadarChart({ verbal=0, nonverbal=0, paraverbal=0 }){
  const vals=[Math.max(0,Math.min(100,Number(verbal||0))),Math.max(0,Math.min(100,Number(nonverbal||0))),Math.max(0,Math.min(100,Number(paraverbal||0)))];
  const labels=["Verbal","Non verbal","Paraverbal"]; const R=100,cx=130,cy=130;
  const pts=vals.map((v,i)=>{const a=(-90+(360/vals.length)*i)*Math.PI/180; const r=(v/100)*R; return{ x:cx+r*Math.cos(a), y:cy+R*Math.sin(a) };});
  const axes=labels.map((_,i)=>{const a=(-90+(360/vals.length)*i)*Math.PI/180; return{ x:cx+R*Math.cos(a), y:cy+R*Math.sin(a) };});
  const poly=pts.map(p=>`${p.x},${p.y}`).join(" ");
  return (<svg viewBox="0 0 260 260" width="100%" height="260" aria-label="Radar chart">
    {[0.25,0.5,0.75,1].map((k,i)=>(<circle key={i} cx={cx} cy={cy} r={R*k} fill="none" stroke="#e2e8f0" />))}
    {axes.map((p,i)=>(<line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#94a3b8" />))}
    <polygon points={poly} fill="#3b82f6" opacity=".25" stroke="#2563eb" strokeWidth="2" />
    {axes.map((p,i)=>(<text key={i} x={p.x} y={p.y} dy={p.y<cy?-6:14} textAnchor="middle" style={{fontSize:12,fill:'#334155',fontWeight:600}}>{labels[i]}</text>))}
  </svg>);
}

// ----------------- Component -----------------
const VoirEntretiens = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [offreFilter, setOffreFilter] = useState("all");
  const [uniqueOffres, setUniqueOffres] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const videoRef = useRef(null);

  // === AJOUT IA — états/refs analyse asynchrone
  const [iaOpen, setIaOpen] = useState(false);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState(null);
  const [iaData, setIaData] = useState(null);
  const iaTimerRef = useRef(null);
  const [iaCache, setIaCache] = useState({}); // cache analyses

  const iaScores = iaData?.analyse?.result_json?.scores ?? null;
  const iaSpeech = iaData?.analyse?.result_json?.speech ?? null;
  const iaNV     = iaData?.analyse?.result_json?.nonverbal ?? null;

  useEffect(() => {
    fetch("http://localhost:8000/api/entretiens/termine/")
      .then((res) => { if (!res.ok) throw new Error("Erreur lors du chargement des entretiens"); return res.json(); })
      .then((data) => {
        setInterviews(data || []);
        if (data && data.length > 0) setSelectedInterview(data[0]);
      })
      .catch((err) => setError(err.message || "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (interviews.length > 0) {
      const offres = [...new Set(interviews.map(i => i.offre_titre || i.offre?.titre))].filter(Boolean);
      setUniqueOffres(offres);
    }
  }, [interviews]);

  useEffect(() => {
    if (selectedInterview) {
      setFeedbackText(selectedInterview.feedback || "");
      setCurrentTime(0); setDuration(0); setPlayingIndex(null);
      if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
    } else {
      setFeedbackText("");
    }
  }, [selectedInterview]);

  const handlePlayPause = (id) => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setPlayingIndex(id); }
    else { videoRef.current.pause(); setPlayingIndex(null); }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const rect = e.target.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = percent * (videoRef.current.duration || 0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60) || 0;
    const secs = Math.floor(seconds % 60) || 0;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // PATCH score/feedback
  const saveEvaluation = async (entretienId, payload) => {
    try {
      const res = await fetch(`http://localhost:8000/api/entretiens/${entretienId}/evaluate/`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.detail || Object.values(data || {}).join(", ") || "Erreur lors de l'enregistrement."); return null; }
      setInterviews((prev) => prev.map((i) => (i.id === entretienId ? { ...i, ...data } : i)));
      if (selectedInterview?.id === entretienId) setSelectedInterview((prev) => ({ ...prev, ...data }));
      return data;
    } catch (err) {
      alert("Erreur serveur lors de la sauvegarde.");
      return null;
    }
  };

  const handleScore = async (id, value) => {
    setInterviews((prev) => prev.map((i) => (i.id === id ? { ...i, score: value } : i)));
    if (selectedInterview?.id === id) setSelectedInterview((prev) => ({ ...prev, score: value }));
    await saveEvaluation(id, { score: value });
  };

  const handleSaveFeedback = async () => {
    if (!selectedInterview) return;
    await saveEvaluation(selectedInterview.id, { feedback: feedbackText });
  };

  const updateStatus = async (offreId, candidatId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:8000/api/candidat/${candidatId}/offre/${offreId}/update-status/`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Erreur lors de la mise à jour du statut"); return; }
      setInterviews((prev) => prev.map((i) => i.candidat_id === candidatId ? { ...i, candidat_status: data.status, status: data.status } : i));
      if (selectedInterview?.candidat_id === candidatId) setSelectedInterview((prev) => ({ ...prev, candidat_status: data.status, status: data.status }));
      window.location.reload();
    } catch {
      alert("Erreur serveur lors de la mise à jour du statut");
    }
  };

  const handleDownload = (interview) => alert(`Téléchargement du rapport pour ${interview.candidat_nom}`);
  const handleShare = (interview) => alert(`Partager l'entretien de ${interview.candidat_nom} avec l'équipe`);

  // --------- Filtrage (avec filtre offre corrigé) ----------
  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch =
      interview.candidat_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.offre_titre?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter !== "all") {
      matchesStatus = interview.candidat_status === statusFilter || interview.status === statusFilter;
    }

    let matchesScore = true;
    if (scoreFilter !== "all") {
      if (scoreFilter === "rated") matchesScore = !!interview.score;
      if (scoreFilter === "unrated") matchesScore = !interview.score;
      if (scoreFilter === "highScore") matchesScore = interview.score >= 4;
    }

    let matchesOffre = true;
    if (offreFilter !== "all") {
      matchesOffre = (interview.offre_titre === offreFilter) || (interview.offre?.titre === offreFilter);
    }

    return matchesSearch && matchesStatus && matchesScore && matchesOffre;
  });

  // === IA: lancement + polling
  async function triggerAnalyzeIA() {
    if (!selectedInterview) return;
    const id = selectedInterview.id;

    const cached = iaCache[id];
    if (cached?.analyse?.statut === "done") {
      setIaData(cached); setIaOpen(true); setIaLoading(false); setIaError(null); return;
    }

    setIaOpen(true); setIaError(null); setIaLoading(true); setIaData(null);

    try { await fetch(`http://127.0.0.1:8000/api/entretiens/${id}/analyze/`, { method: "POST" }); }
    catch { setIaLoading(false); setIaError("Impossible de lancer l'analyse"); return; }

    if (iaTimerRef.current) window.clearInterval(iaTimerRef.current);
    const start = Date.now();
    iaTimerRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/entretiens/${id}/`);
        const data = await res.json();
        setIaData(data);
        if (data?.analyse?.statut === "done" || data?.analyse?.statut === "failed") {
          setIaLoading(false);
          setIaCache(prev => ({ ...prev, [id]: data }));
          if (iaTimerRef.current) window.clearInterval(iaTimerRef.current);
        }
      } catch {
        setIaLoading(false); setIaError("Erreur de récupération du statut");
        if (iaTimerRef.current) window.clearInterval(iaTimerRef.current);
      }
      if (Date.now() - start > 2 * 60 * 1000) {
        setIaLoading(false); setIaError("Temps d'attente dépassé, réessayez.");
        if (iaTimerRef.current) window.clearInterval(iaTimerRef.current);
      }
    }, 2000);
  }

  // Reset IA card au changement d’entretien & rechargement depuis cache/API
  useEffect(() => {
    if (!selectedInterview) return;
    if (iaTimerRef.current) window.clearInterval(iaTimerRef.current);
    setIaOpen(false); setIaLoading(false); setIaError(null); setIaData(null);
    setPlayingIndex(null);
    if (videoRef.current) { try { videoRef.current.pause(); } catch {} }

    const id = selectedInterview.id;
    const cached = iaCache[id];
    if (cached?.analyse?.statut === "done") { setIaData(cached); setIaOpen(true); return; }

    (async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/entretiens/${id}/`);
        const data = await res.json();
        if (data?.analyse?.statut === "done") {
          setIaCache(prev => ({ ...prev, [id]: data })); setIaData(data); setIaOpen(true);
        }
      } catch {}
    })();
  }, [selectedInterview?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (iaTimerRef.current) window.clearInterval(iaTimerRef.current); }, []);

  if (loading) {
    return (
      <Template>
        <GlobalStyle />
        <DashboardContainer>
          <LoadingContainer>
            <Spinner />
            <LoadingText>Chargement des entretiens...</LoadingText>
          </LoadingContainer>
        </DashboardContainer>
      </Template>
    );
  }

  if (error) {
    return (
      <Template>
        <GlobalStyle />
        <DashboardContainer>
          <EmptyState initial={{ opacity: 0.9 }} animate={{ opacity: 1 }}>
            <div>⚠️</div>
            <h3>{error}</h3>
            <p>Veuillez réessayer plus tard.</p>
          </EmptyState>
        </DashboardContainer>
      </Template>
    );
  }

  const currentIaStatus =
    iaData?.analyse?.statut ||
    (selectedInterview ? iaCache[selectedInterview.id]?.analyse?.statut : null) ||
    null;

  return (
    <Template>
      <GlobalStyle />
      <DashboardContainer>
        <Sidebar>
          <SidebarHeader>
            <SidebarTitle>Entretiens</SidebarTitle>
            <SearchContainer>
              <SearchIcon />
              <input
                type="text"
                placeholder="Rechercher un candidat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>
          </SidebarHeader>

          <FilterSection>
            <FilterTitle>Filtre par statut</FilterTitle>
            <FilterGroup>
              <FilterCheckbox>
                <input type="radio" name="status" value="all" checked={statusFilter === "all"} onChange={() => setStatusFilter("all")} />
                Tous les statuts
              </FilterCheckbox>
              <FilterCheckbox>
                <input type="radio" name="status" value="EnProcessus" checked={statusFilter === "EnProcessus"} onChange={() => setStatusFilter("EnProcessus")} />
                En processus
              </FilterCheckbox>
              <FilterCheckbox>
                <input type="radio" name="status" value="Retire" checked={statusFilter === "Retire"} onChange={() => setStatusFilter("Retire")} />
                Rejetés
              </FilterCheckbox>
            </FilterGroup>
          </FilterSection>

          <FilterSection>
            <FilterTitle>Filtre par score</FilterTitle>
            <FilterGroup>
              <FilterCheckbox>
                <input type="radio" name="score" value="all" checked={scoreFilter === "all"} onChange={() => setScoreFilter("all")} />
                Tous les scores
              </FilterCheckbox>
              <FilterCheckbox>
                <input type="radio" name="score" value="rated" checked={scoreFilter === "rated"} onChange={() => setScoreFilter("rated")} />
                Évalués
              </FilterCheckbox>
              <FilterCheckbox>
                <input type="radio" name="score" value="unrated" checked={scoreFilter === "unrated"} onChange={() => setScoreFilter("unrated")} />
                Non évalués
              </FilterCheckbox>
              <FilterCheckbox>
                <input type="radio" name="score" value="highScore" checked={scoreFilter === "highScore"} onChange={() => setScoreFilter("highScore")} />
                Score élevé (4+)
              </FilterCheckbox>
            </FilterGroup>
          </FilterSection>

          <FilterSection>
            <FilterTitle>Filtre par offre</FilterTitle>
            <FilterGroup>
              <FilterCheckbox>
                <input type="radio" name="offre" value="all" checked={offreFilter === "all"} onChange={() => setOffreFilter("all")} />
                Toutes les offres
              </FilterCheckbox>
              {uniqueOffres.map((offre, index) => (
                <FilterCheckbox key={index}>
                  <input type="radio" name="offre" value={offre} checked={offreFilter === offre} onChange={() => setOffreFilter(offre)} />
                  {offre}
                </FilterCheckbox>
              ))}
            </FilterGroup>
          </FilterSection>

          <FilterSection>
            <FilterTitle>Candidats ({filteredInterviews.length})</FilterTitle>
            <CandidateList>
              {filteredInterviews.map((interview) => (
                <CandidateListItem
                  key={interview.id}
                  active={selectedInterview && selectedInterview.id === interview.id}
                  onClick={() => setSelectedInterview(interview)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CandidateName>
                    {interview.candidat_nom}
                    {interview.score >= 4 && <span title="Candidat recommandé" style={{ marginLeft: "6.5rem", color: "#10b981" }}>✔️</span>}
                  </CandidateName>
                  <CandidatePosition>{interview.offre_titre || interview.offre?.titre}</CandidatePosition>
                  <CandidateMeta>
                    <CandidateDate>
                      <CalendarIcon style={{ width: 14, height: 14 }} />
                      {interview.date_limite ? new Date(interview.date_limite).toLocaleDateString("fr-FR") : ""}
                    </CandidateDate>
                    {interview.score ? (
                      <CandidateScore score={interview.score}>
                        <StarIcon style={{ width: 12, height: 12 }} />
                        {interview.score}/5
                      </CandidateScore>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Non évalué</span>
                    )}
                  </CandidateMeta>
                  {interview.candidat_status && (
                    <StatusBadge status={interview.candidat_status} style={{ marginTop: "0.5rem", display: "inline-block" }}>
                      {interview.candidat_status}
                    </StatusBadge>
                  )}
                </CandidateListItem>
              ))}
            </CandidateList>
          </FilterSection>
        </Sidebar>

        <MainContent>
          {selectedInterview ? (
            <>
              <ContentHeader>
                <div>
                  <ContentTitle>{selectedInterview.candidat_nom}</ContentTitle>
                  <p style={{ color: "#64748b", margin: "0.25rem 0 0 0" }}>
                    Poste: <span style={{ color: "#3b82f6", fontWeight: 500 }}>{selectedInterview.offre.titre}</span>
                  </p>
                </div>
                <ActionButtons>
                  <ControlButton onClick={() => handleDownload(selectedInterview)}>
                    <DownloadIcon /> Télécharger
                  </ControlButton>
                  <ControlButton primary onClick={() => handleShare(selectedInterview)}>
                    <ShareIcon /> Partager
                  </ControlButton>
                </ActionButtons>
              </ContentHeader>

              <InterviewContent initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <VideoSection>
                  <VideoContainer>
                    {selectedInterview.video_reponses ? (
                      <StyledVideo
                        key={selectedInterview.id}
                        ref={videoRef}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleTimeUpdate}
                        controls={false}
                      >
                        <source src={selectedInterview.video_reponses} type="video/mp4" />
                        Votre navigateur ne supporte pas la vidéo.
                      </StyledVideo>
                    ) : (
                      <p style={{ color: "#64748b" }}>Aucune vidéo disponible pour ce candidat.</p>
                    )}

                    <PlayOverlay visible={playingIndex !== selectedInterview.id} onClick={() => handlePlayPause(selectedInterview.id)}>
                      <PlayButton>{playingIndex === selectedInterview.id ? <PauseIcon /> : <PlayIcon />}</PlayButton>
                    </PlayOverlay>
                  </VideoContainer>

                  <VideoControls>
                    <TimeDisplay>{formatTime(currentTime)}</TimeDisplay>
                    <ProgressBar onClick={handleSeek}>
                      <Progress progress={duration > 0 ? (currentTime / duration) * 100 : 0} />
                    </ProgressBar>
                    <TimeDisplay>{formatTime(duration)}</TimeDisplay>
                  </VideoControls>
                </VideoSection>

                <QuestionsSection>
                  <SectionTitle>Questions de l'entretien</SectionTitle>
                  <QuestionList>
                    {/* Correction : afficher la liste des questions stockées côté candidat */}
                    {(selectedInterview.questions_selectionnees?.length > 0
                      ? selectedInterview.questions_selectionnees
                      : (
                        // fallback: tente de charger depuis localStorage si possible
                        (() => {
                          try {
                            const storageKey = `entretien_questions_${selectedInterview.token || selectedInterview.id}`;
                            const saved = localStorage.getItem(storageKey);
                            if (saved) {
                              const arr = JSON.parse(saved);
                              // On simule le format attendu pour l'affichage
                              return arr.map((q, i) => ({
                                question: q.question || q,
                                temps_attribue: q.temps_attribue || q.duree_limite || q.question__duree_limite || 60
                              }));
                            }
                          } catch {}
                          return [];
                        })()
                      )
                    ).map((qa, i) => (
                      <QuestionItem key={i} answeredWell={i % 4 === 0} answeredPoorly={i % 6 === 0} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                        <QuestionText><span>❓</span>{qa.question.texte}</QuestionText>
                        <QuestionMeta>
                          <TimeBadge><ClockIcon style={{ width: 14, height: 14 }} />{qa.question.duree_limite}s</TimeBadge>
                        </QuestionMeta>
                      </QuestionItem>
                    ))}
                  </QuestionList>
                </QuestionsSection>

                <EvaluationSection>
                  <EvaluationTitle><span style={{ fontSize: "1.5rem" }}>⭐</span>Évaluation du candidat</EvaluationTitle>

                  {selectedInterview.status === "Accepté" || selectedInterview.status === "Rejeté" ? (
                    <FinalResult status={selectedInterview.status}>
                      <FinalResultTitle status={selectedInterview.status}>
                        {selectedInterview.status === "Accepté" ? (<><CheckIcon style={{ width: 20, height: 20 }} />Candidat Accepté</>) : (<><XMarkIcon style={{ width: 20, height: 20 }} />Candidat Rejeté</>)}
                      </FinalResultTitle>
                      <FinalResultText status={selectedInterview.status}>
                        {selectedInterview.status === "Accepté" ? "Ce candidat a été accepté pour ce poste." : "Ce candidat a été rejeté pour ce poste."}
                      </FinalResultText>
                      {selectedInterview.score && (
                        <div style={{ marginTop: "1rem" }}>
                          <CandidateScore score={selectedInterview.score} style={{ margin: "0 auto" }}>
                            <StarIcon style={{ width: 12, height: 12 }} /> Note: {selectedInterview.score}/5
                          </CandidateScore>
                        </div>
                      )}
                    </FinalResult>
                  ) : (
                    <>
                      <StarRating>
                        <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>Note globale:</span>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {[1,2,3,4,5].map((val) => (
                            <Star key={val} active={selectedInterview.score === val} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => handleScore(selectedInterview.id, val)}>
                              {val}
                            </Star>
                          ))}
                        </div>
                      </StarRating>

                      <div>
                        <label htmlFor={`feedback-${selectedInterview.id}`} style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                          Feedback personnalisé:
                        </label>
                        <FeedbackInput
                          id={`feedback-${selectedInterview.id}`}
                          placeholder="Ajoutez vos commentaires sur ce candidat..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          onBlur={handleSaveFeedback}
                        />
                        <div style={{ marginTop: "0.5rem" }}>
                          <ControlButton onClick={handleSaveFeedback}><CheckIcon /> Enregistrer le feedback</ControlButton>
                        </div>
                      </div>
                    </>
                  )}

                  {(selectedInterview.statut === "TERMINER" || selectedInterview.statut === "COMPLETED") && (
                    selectedInterview.candidat_status === "Entretient" ? (
                      <DecisionButtons>
                        <RejectButton onClick={() => updateStatus(selectedInterview.offre_id || selectedInterview.offre?.id, selectedInterview.candidat_id, "Retire")}>
                          <XMarkIcon /> Retire
                        </RejectButton>
                        <AcceptButton onClick={() => updateStatus(selectedInterview.offre_id || selectedInterview.offre?.id, selectedInterview.candidat_id, "EnProcessus")}>
                          <CheckIcon /> En Processus d'entretien
                        </AcceptButton>
                      </DecisionButtons>
                    ) : (
                      <StatusBadge status={selectedInterview.candidat_status}>{selectedInterview.candidat_status || "—"}</StatusBadge>
                    )
                  )}

                  {/* === AJOUT IA — bouton qui ouvre si déjà fait, sinon lance */}
                  <IAButtonRow>
                    <IAButton
                      onClick={() => {
                        if (currentIaStatus === "done") {
                          const cached = iaCache[selectedInterview.id];
                          if (cached) setIaData(cached);
                          setIaOpen(true); setIaLoading(false); setIaError(null);
                        } else {
                          triggerAnalyzeIA();
                        }
                      }}
                      disabled={currentIaStatus === "processing"}
                      title={currentIaStatus === "processing" ? "Analyse en cours…" : currentIaStatus === "done" ? "Afficher l'analyse existante" : "Lancer l'analyse IA"}
                    >
                      {currentIaStatus === "processing" ? "⏳ Analyse en cours…" : currentIaStatus === "done" ? "📊 Afficher l'analyse" : "🤖 Analyser avec IA"}
                    </IAButton>
                  </IAButtonRow>
                </EvaluationSection>

                {/* === AJOUT IA — grande card "Analyse avec IA" */}
                {iaOpen && (
                  <IASection initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}>
                    <IATitle>🔎 Analyse avec IA</IATitle>

                    {iaLoading && (
                      <LoadingContainer style={{ padding: '3rem 1rem' }}>
                        <Spinner />
                        <LoadingText>Analyse en cours…</LoadingText>
                      </LoadingContainer>
                    )}

                    {!iaLoading && iaError && (
                      <InfoBlock style={{ borderColor:'#fecaca', background:'#fef2f2', color:'#991b1b' }}>
                        {iaError}
                      </InfoBlock>
                    )}

                    {!iaLoading && !iaError && iaData?.analyse?.statut === "done" && (
                      <IAGrid>
                        {/* Colonne gauche : total + jauge + qualité */}
                        <div>
                          <InfoBlock style={{ marginBottom:'1rem', textAlign:'center' }}>
                            <div style={{ color:'#64748b', fontWeight:600 }}>Score total (sur 100)</div>
                            {(() => {
                              const total = Number(iaScores?.total ?? 0);
                              const band = bandFor(total);
                              return <BigTotal color={band.color}>{total.toFixed(1)}</BigTotal>;
                            })()}
                            <div style={{ marginTop:'.5rem' }}>
                              <QualityBadge quality={iaScores?.quality} />
                            </div>
                          </InfoBlock>
                          <GaugeWrap>
                            <div style={{ fontWeight:700, marginBottom:'.5rem', color:'#1e293b' }}>Niveau</div>
                            <ScoreGauge value={Number(iaScores?.total ?? 0)} />
                          </GaugeWrap>
                        </div>

                        {/* Colonne droite : radar + détails */}
                        <div>
                          <RadarWrap>
                            <div style={{ fontWeight:700, marginBottom:'.25rem', color:'#1e293b' }}>Répartition des scores</div>
                            <RadarChart
                              verbal={Number(iaScores?.verbal ?? 0)}
                              nonverbal={Number(iaScores?.nonverbal ?? 0)}
                              paraverbal={Number(iaScores?.paraverbal ?? 0)}
                            />
                          </RadarWrap>

                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginTop:'1rem' }}>
                            <InfoBlock>
                              <div style={{ fontWeight:700, marginBottom:'.25rem', color:'#1e293b' }}>Parole</div>
                              <div>WPM : {iaSpeech?.wpm ?? "—"}</div>
                              <div>Silences (s) : {iaSpeech?.silence_sec ?? "—"}</div>
                              <div>Durée (s) : {iaSpeech?.duration_sec ?? "—"}</div>
                            </InfoBlock>
                            <InfoBlock>
                              <div style={{ fontWeight:700, marginBottom:'.25rem', color:'#1e293b' }}>Non verbal</div>
                              <div>Émotion dominante : {iaNV?.emotions?.dominant_emotion ?? "—"}</div>
                              <div>Eye contact ratio : {iaNV?.eye_contact_ratio ?? "—"}</div>
                            </InfoBlock>
                          </div>

                          {(iaScores?.reason || iaScores?.penalty) && (
                            <InfoBlock style={{ marginTop:'1rem' }}>
                              <div style={{ fontWeight:700, marginBottom:'.25rem', color:'#1e293b' }}>Contrôles qualité</div>
                              {iaScores?.penalty !== undefined && (
                                <div style={{ color:'#475569' }}>Pénalité appliquée : <b>{iaScores.penalty}</b></div>
                              )}
                              {iaScores?.reason && (
                                <div style={{ marginTop:'.25rem', color:'#475569' }}>
                                  {iaScores.reason.wpm !== undefined && <>WPM: <b>{iaScores.reason.wpm}</b><br/></>}
                                  {iaScores.reason.spoken_ratio !== undefined && <>Taux de parole: <b>{iaScores.reason.spoken_ratio}</b><br/></>}
                                  {iaScores.reason.duration_sec !== undefined && <>Durée: <b>{iaScores.reason.duration_sec}s</b></>}
                                </div>
                              )}
                            </InfoBlock>
                          )}
                        </div>
                      </IAGrid>
                    )}
                  </IASection>
                )}
              </InterviewContent>
            </>
          ) : (
            <EmptyState initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div>👥</div>
              <h3>Aucun candidat sélectionné</h3>
              <p>Sélectionnez un candidat dans la liste pour voir les détails de l'entretien.</p>
            </EmptyState>
          )}
        </MainContent>
      </DashboardContainer>
    </Template>
  );
};

export default VoirEntretiens;
