import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavbarCandidat from "../CandidatNavbar/NavbarCandidat";
import { FaCalendarAlt, FaClock, FaSearch, FaCheck, FaBell } from "react-icons/fa";

// ----------------- helpers -----------------
const LS_READ = (t) => `invite_read_${t}`;
const LS_STARTED = (t) => `invite_started_${t}`;

// Format date (FR)
function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Initiales
function getInitials(name) {
  if (!name) return "CO";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Messagerie() {
  const location = useLocation();
  const navigate = useNavigate();

  const colors = {
    blue: "#004085",
    blueLight: "#e9f2fb",
    blueHover: "#e1f0ff",
    yellow: "#f5bb0c",
    red: "#dc3545",
    green: "#28a745",
    gray: "#f6f8fa",
    border: "#e3e8ee",
    text: "#222",
    textLight: "#888",
  };

  // données issues de la page précédente
  const entretiens = location.state?.entretiens || [];

  const [invitations, setInvitations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("tous");
  const [searchText, setSearchText] = useState("");

  // ----------- construction + personnalisation + persistance ------------
  useEffect(() => {
    if (!entretiens.length) return;

    const nowIso = new Date().toISOString();

    const formatted = entretiens.map((e) => {
      const token = e.token;
      const entreprise =
        e.offre__entreprise__nom ||
        e.entreprise__nom ||
        e.offre?.entreprise?.nom ||
        "Entreprise";
      const candidatNom =
        e.candidat?.nomComplet ||
        e.candidat_nomComplet ||
        "Candidat";

      const read = localStorage.getItem(LS_READ(token)) === "1";
      const startedAt = localStorage.getItem(LS_STARTED(token)); // ISO string or null

      const dateFin = e.date_limite || e.dateFinDisponibilite;
      const expiredByDate = dateFin ? new Date(dateFin) < new Date() : false;
      const expiré = !!startedAt || expiredByDate;

      // date à afficher sous le bouton :
      // - si déjà lancé une fois -> date du premier clic
      // - sinon -> date limite fixée par le recruteur
      const expiredAt = startedAt || dateFin || null;

      return {
        id: token,                // id stable = token
        token,
        nomEntreprise: entreprise,
        candidatNom,
        objet: "Invitation à entretien vidéo différé",
        dateReception: e.date_reception || e.date_creation || nowIso,
        lu: read,
        dateDebutDisponibilite: e.date_debut || e.date_creation || nowIso,
        dateFinDisponibilite: dateFin || null,
        startedAt,                // si non null => l’entretien a déjà été lancé une fois
        expiredAt,
        expiré,
        poste: e.offre__titre || e.offre?.titre || "Poste",
        status: (e.statut || "PENDING").toLowerCase(),
      };
    });

    setInvitations(formatted);
    if (formatted.length && !selectedId) {
      setSelectedId(formatted[0].id);
    }
  }, [entretiens]); // eslint-disable-line

  // ----------- actions -----------
  const selectInvitation = (id) => {
    setSelectedId(id);
    // marquer comme lu (persistant)
    setInvitations((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, lu: true } : inv
      )
    );
    localStorage.setItem(LS_READ(id), "1");
  };

  const markAllRead = () => {
    setInvitations((prev) =>
      prev.map((inv) => ({ ...inv, lu: true }))
    );
    invitations.forEach((inv) => localStorage.setItem(LS_READ(inv.id), "1"));
  };

  // règle métier : si déjà lancé une fois OU date > limite => bouton désactivé
  const isExpired = (inv) => inv.expiré;

  const handleViewInterview = (token) => {
    // si jamais l’utilisateur clique pour la première fois, on “fige” l’invitation :
    const already = localStorage.getItem(LS_STARTED(token));
    if (!already) {
      const ts = new Date().toISOString();
      localStorage.setItem(LS_STARTED(token), ts);
      localStorage.setItem(LS_READ(token), "1"); // aussi lu

      setInvitations((prev) =>
        prev.map((inv) =>
          inv.token === token
            ? {
                ...inv,
                lu: true,
                startedAt: ts,
                expiré: true,       // à partir de maintenant, le lien est expiré
                expiredAt: ts,      // date “où le bouton a été cliqué”
              }
            : inv
        )
      );
    } else {
      // déjà lancé → s’assurer que l’état local est bien cohérent
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.token === token
            ? { ...inv, lu: true, expiré: true, expiredAt: already }
            : inv
        )
      );
      localStorage.setItem(LS_READ(token), "1");
    }

    // navigation vers la page d’instructions
    navigate(`/candidat/dashboard/messagerie/instructions/${token}`);
  };

  // ------------- filtres / sélection -------------
  const filteredInvitations = invitations.filter((inv) => {
    if (filter === "nonlus" && inv.lu) return false;
    if (filter === "actifs" && isExpired(inv)) return false;
    if (filter === "expires" && !isExpired(inv)) return false;
    if (searchText && !inv.nomEntreprise.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const selectedInvitation = invitations.find((inv) => inv.id === selectedId);

  const countNonLus = invitations.filter((inv) => !inv.lu).length;
  const countActifs = invitations.filter((inv) => !isExpired(inv)).length;
  const countExpires = invitations.filter((inv) => isExpired(inv)).length;

  const filterTabs = [
    { key: "tous", label: `Tous (${invitations.length})` },
    { key: "nonlus", label: `Non lus (${countNonLus})` },
    { key: "actifs", label: `Actifs (${countActifs})` },
    { key: "expires", label: `Expirés (${countExpires})` },
  ];

  // ------------- rendu -------------
  if (invitations.length === 0) {
    return (
      <>
        <NavbarCandidat />
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          height: "calc(100vh - 80px)", backgroundColor: colors.gray, flexDirection: "column"
        }}>
          <div style={{ fontSize: "1.5rem", color: colors.blue, marginBottom: 20, fontWeight: "bold" }}>
            Aucune invitation disponible
          </div>
          <div style={{ color: colors.textLight, fontSize: "1.1rem" }}>
            Vous n'avez pas encore reçu d'invitations d'entretien.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavbarCandidat />
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 80px)",
          background: colors.gray,
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: colors.text,
        }}
      >
        {/* ---------- liste gauche ---------- */}
        <aside
          style={{
            width: 370,
            minWidth: 260,
            maxWidth: 420,
            borderRight: `1.5px solid ${colors.border}`,
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            padding: 0,
            height: "100%",
          }}
        >
          {/* recherche + actions */}
          <div
            style={{
              padding: "18px 20px 10px 20px",
              borderBottom: `1.5px solid ${colors.border}`,
              background: colors.gray,
            }}
          >
            <div style={{ position: "relative" }}>
              <FaSearch
                style={{
                  position: "absolute",
                  left: 14,
                  top: "38%",
                  transform: "translateY(-50%)",
                  color: colors.textLight,
                }}
              />
              <input
                type="text"
                placeholder="Rechercher une entreprise..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: "85%",
                  padding: "10px 14px 10px 40px",
                  borderRadius: 8,
                  border: `1.5px solid ${colors.border}`,
                  fontSize: 15,
                  marginBottom: 12,
                  background: "#fff",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  color: colors.textLight,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flex: 1,
                }}
              >
                {invitations.length} message{invitations.length !== 1 ? "s" : ""}

                <span style={{ position: "relative", display: "inline-block" }}
                  title={countNonLus > 0 ? `${countNonLus} message${countNonLus > 1 ? "s" : ""} non lu${countNonLus > 1 ? "s" : ""}` : ""}>
                  <FaBell size={18} color="#4B5563" />
                  {countNonLus > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -5,
                        right: -5,
                        background: "#ef4444",
                        color: "white",
                        borderRadius: "50%",
                        padding: "2px 6px",
                        fontSize: 10,
                        fontWeight: 600,
                        lineHeight: 1,
                      }}
                    >
                      {countNonLus}
                    </span>
                  )}
                </span>
              </span>

              <button
                onClick={markAllRead}
                disabled={countNonLus === 0}
                style={{
                  padding: "7px 14px",
                  backgroundColor: countNonLus === 0 ? colors.border : colors.blue,
                  border: "none",
                  borderRadius: 7,
                  color: "white",
                  fontWeight: 600,
                  cursor: countNonLus === 0 ? "not-allowed" : "pointer",
                  fontSize: 14,
                  transition: "background 0.2s",
                  opacity: countNonLus === 0 ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <FaCheck size={12} />
                Tout marquer comme lu
              </button>
            </div>
          </div>

          {/* onglets */}
          <nav
            style={{
              display: "flex",
              gap: 8,
              padding: "12px 20px 8px 20px",
              borderBottom: `1.5px solid ${colors.border}`,
              background: colors.gray,
              overflowX: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  backgroundColor: filter === tab.key ? colors.blue : "transparent",
                  color: filter === tab.key ? "#fff" : colors.blue,
                  padding: "5px 18px",
                  borderRadius: 10,
                  border: `1px solid ${filter === tab.key ? colors.blue : colors.blueHover}`,
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: 12,
                  transition: "all 0.2s",
                  outline: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* liste d'invitations */}
          <div style={{ overflowY: "auto", flex: 1, padding: 0, background: "#fff" }}>
            <div style={{ padding: "10px 0 0 0" }}>
              <div
                style={{
                  fontWeight: 700,
                  color: colors.blue,
                  fontSize: "1.08rem",
                  padding: "0 20px 8px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                Invitations d'entretien
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: 13,
                    color: colors.blue,
                    backgroundColor: colors.blueHover,
                    padding: "2px 10px",
                    borderRadius: 12,
                  }}
                >
                  {countNonLus} non lu{countNonLus !== 1 ? "s" : ""}
                </span>
              </div>

              {filteredInvitations.length === 0 ? (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: colors.textLight,
                    fontStyle: "italic",
                  }}
                >
                  Aucune invitation ne correspond à vos critères
                </div>
              ) : (
                filteredInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => selectInvitation(inv.id)}
                    style={{
                      cursor: "pointer",
                      borderRadius: 12,
                      border:
                        selectedId === inv.id
                          ? `2px solid ${colors.blue}`
                          : `1.5px solid ${colors.border}`,
                      background:
                        selectedId === inv.id
                          ? colors.blueLight
                          : inv.lu
                          ? "#fff"
                          : "#f1f7ff",
                      margin: "0 14px 12px 14px",
                      padding: "16px 18px",
                      boxShadow:
                        selectedId === inv.id ? `0 2px 8px ${colors.blue}22` : "none",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      position: "relative",
                      transition: "all 0.2s",
                    }}
                  >
                    {/* avatar */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "#cce5ff",
                        color: colors.blue,
                        fontWeight: 700,
                        fontSize: "1.15rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 8,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(inv.nomEntreprise)}
                    </div>

                    {/* infos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: colors.blue,
                            fontSize: "1.07rem",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 160,
                          }}
                        >
                          {inv.nomEntreprise}
                        </span>

                        {/* point jaune seulement si non-lu */}
                        {!inv.lu && (
                          <span
                            style={{
                              display: "inline-block",
                              width: 8,
                              height: 8,
                              backgroundColor: colors.yellow,
                              borderRadius: "50%",
                            }}
                            title="Non lu"
                          />
                        )}

                        {isExpired(inv) ? (
                          <span
                            style={{
                              background: colors.red,
                              color: "#fff",
                              fontSize: 11,
                              borderRadius: 10,
                              padding: "2px 8px",
                              fontWeight: 600,
                              marginLeft: "auto",
                            }}
                          >
                            Expiré
                          </span>
                        ) : !inv.lu ? (
                          <span
                            style={{
                              background: colors.yellow,
                              color: colors.text,
                              fontSize: 11,
                              borderRadius: 10,
                              padding: "2px 8px",
                              fontWeight: 600,
                              marginLeft: "auto",
                            }}
                          >
                            Nouveau
                          </span>
                        ) : null}

                        <span
                          style={{
                            color: colors.textLight,
                            fontSize: 13,
                            marginLeft: "auto",
                          }}
                        >
                          {formatDate(inv.dateReception)}
                        </span>
                      </div>

                      <div
                        style={{
                          fontWeight: 700,
                          color: colors.blue,
                          fontSize: "1.01rem",
                          margin: "2px 0",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {inv.objet}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          color: colors.text,
                          fontWeight: 500,
                          marginBottom: 2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {inv.poste}
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: colors.textLight,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FaCalendarAlt size={13} />
                        {inv.startedAt
                          ? `A expiré le ${formatDate(inv.expiredAt)}`
                          : `Jusqu'au ${formatDate(inv.dateFinDisponibilite)}`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* ---------- panneau droit ---------- */}
        <section
          style={{
            flex: 1,
            minWidth: 0,
            background: colors.gray,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: 0,
          }}
        >
          {!selectedInvitation ? (
            <div
              style={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                color: colors.blue,
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: 10 }}>
                Messagerie des invitations
              </div>
              <div style={{ color: colors.textLight, fontSize: "1.1rem" }}>
                Sélectionnez une invitation pour afficher les détails.
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "32px 40px 24px 40px",
                background: colors.gray,
                minWidth: 0,
                height: "100%",
                boxSizing: "border-box",
                maxWidth: 950,
                margin: "0 auto",
                overflowY: "auto",
              }}
            >
              {/* entête entreprise */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#fff",
                  borderRadius: 5,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                  padding: "22px 28px 18px 28px",
                  marginBottom: 22,
                  gap: 18,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    background: "#cce5ff",
                    color: colors.blue,
                    fontWeight: 700,
                    fontSize: "1.35rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 18,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(selectedInvitation.nomEntreprise)}
                </div>

                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 700, color: colors.blue, fontSize: "1.18rem" }}>
                    {selectedInvitation.nomEntreprise}
                  </div>
                  <div style={{ color: colors.text, fontWeight: 600, fontSize: "1.05rem", marginTop: 2 }}>
                    {selectedInvitation.objet}
                  </div>
                  <div style={{ color: colors.textLight, fontSize: "0.98rem", marginTop: 2 }}>
                    {selectedInvitation.poste}
                  </div>
                  <div style={{ color: colors.textLight, fontSize: "0.98rem", marginTop: 2 }}>
                    Reçu le {formatDate(selectedInvitation.dateReception)}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  {!selectedInvitation.lu && !isExpired(selectedInvitation) && (
                    <span
                      style={{
                        background: colors.yellow,
                        color: colors.text,
                        fontSize: 12,
                        borderRadius: 10,
                        padding: "3px 12px",
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      Nouveau
                    </span>
                  )}
                  {isExpired(selectedInvitation) && (
                    <span
                      style={{
                        background: colors.red,
                        color: "#fff",
                        fontSize: 12,
                        borderRadius: 10,
                        padding: "3px 12px",
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      Expiré
                    </span>
                  )}
                </div>
              </div>

              {/* message “e-mail” avec instructions */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 5,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                  padding: "28px 28px 18px 28px",
                  marginBottom: 22,
                  fontSize: "1.08rem",
                  color: colors.text,
                  lineHeight: 1.7,
                  width: "93%",
                }}
              >
                <div style={{ fontWeight: 700, color: colors.blue, fontSize: "1.13rem", marginBottom: 10 }}>
                  Message de l'entreprise
                </div>

                <div
                  style={{
                    background: colors.gray,
                    borderRadius: 8,
                    padding: "18px 18px 14px 18px",
                    marginBottom: 18,
                    color: colors.text,
                    fontSize: "1.05rem",
                    borderLeft: `4px solid ${colors.blue}`,
                  }}
                >
                  Bonjour <b>{selectedInvitation.candidatNom}</b>,<br /><br />
                  Votre candidature a retenu notre attention. Nous vous invitons à réaliser
                  un entretien vidéo différé pour le poste de <b>{selectedInvitation.poste}</b>.<br /><br />
                  Merci pour l’intérêt porté à <b>{selectedInvitation.nomEntreprise}</b>. Vous trouverez
                  ci-dessous les informations et instructions pour bien préparer votre passage.
                </div>

                <div style={{ fontWeight: 700, color: colors.text, fontSize: "1.09rem", margin: "18px 0 10px 0" }}>
                  Détails de l'entretien vidéo différé
                </div>

                <div style={{ display: "flex", gap: 22, marginBottom: 18, flexWrap: "wrap" }}>
                  <div
                    style={{
                      background: "#f8f9fa",
                      borderRadius: 10,
                      padding: "18px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      minWidth: 220,
                      flex: 1,
                      border: `1.5px solid ${colors.border}`,
                    }}
                  >
                    <FaCalendarAlt style={{ color: colors.blue, fontSize: 22 }} />
                    <div>
                      <div style={{ color: colors.textLight, fontSize: "0.98rem" }}>Disponible du</div>
                      <div style={{ fontWeight: 600, color: colors.text, fontSize: "1.05rem" }}>
                        {formatDate(selectedInvitation.dateDebutDisponibilite)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#f8f9fa",
                      borderRadius: 10,
                      padding: "18px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      minWidth: 220,
                      flex: 1,
                      border: `1.5px solid ${colors.border}`,
                    }}
                  >
                    <FaClock style={{ color: colors.blue, fontSize: 22 }} />
                    <div>
                      <div style={{ color: colors.textLight, fontSize: "0.98rem" }}>
                        {selectedInvitation.startedAt ? "Expiré le" : "Jusqu'au"}
                      </div>
                      <div style={{ fontWeight: 600, color: colors.text, fontSize: "1.05rem" }}>
                        {formatDate(selectedInvitation.expiredAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* instructions (phrases + liste) */}
                <div style={{ fontWeight: 700, color: colors.text, fontSize: "1.09rem", margin: "18px 0 10px 0" }}>
                  Instructions
                </div>
                <ol style={{ paddingLeft: 24, color: colors.text, fontSize: "1.03rem", marginBottom: 18 }}>
                  <li style={{ marginBottom: 7 }}>
                    Choisissez un endroit calme et bien éclairé, avec une connexion internet stable.
                  </li>
                  <li style={{ marginBottom: 7 }}>
                    Vérifiez que votre <b>caméra</b> et votre <b>microphone</b> fonctionnent correctement.
                  </li>
                  <li style={{ marginBottom: 7 }}>
                    Préparez quelques exemples concrets de vos réalisations en lien avec le poste.
                  </li>
                  <li style={{ marginBottom: 7 }}>
                    L’entretien se réalise en une seule fois. Une fois lancé, vous ne pourrez plus le relancer.
                  </li>
                </ol>

                {/* CTA */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 18 }}>
                  <button
                    onClick={() => handleViewInterview(selectedInvitation.token)}
                    disabled={isExpired(selectedInvitation)}
                    style={{
                      backgroundColor: isExpired(selectedInvitation) ? "#bfc9d1" : colors.blue,
                      color: "#fff",
                      border: "none",
                      padding: "13px 38px",
                      borderRadius: 30,
                      marginTop: 50,
                      fontWeight: 600,
                      fontSize: "1.13rem",
                      cursor: isExpired(selectedInvitation) ? "not-allowed" : "pointer",
                      marginBottom: 10,
                      boxShadow: isExpired(selectedInvitation) ? "none" : `0 2px 8px ${colors.blue}22`,
                      transition: "background 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    {isExpired(selectedInvitation) ? (
                      <>
                        <FaClock size={18} />
                        Entretien expiré
                      </>
                    ) : (
                      "Lancer l'entretien"
                    )}
                  </button>

                  {isExpired(selectedInvitation) && (
                    <div style={{ color: colors.textLight, fontSize: "1.01rem", marginTop: 2 }}>
                      Cette invitation a expiré le {formatDate(selectedInvitation.expiredAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
