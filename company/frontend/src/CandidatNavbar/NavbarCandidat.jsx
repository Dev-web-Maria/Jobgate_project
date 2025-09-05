import React, { useState } from 'react';
import styled from 'styled-components';
import logo from '../Logo/image.png'; // Your logo path
import { Link } from 'react-router-dom';

const NavContainer = styled.nav`
  background-color: #fff;
  border-bottom: 1px solid #f3f4f6;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const NavContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
`;

const LogoLink = styled.a`
  display: flex;
  align-items: center;
  z-index: 60;
`;

const LogoImg = styled.img`
  height: 2.5rem;
  width: auto;
`;

const NavList = styled.ul`
  display: none;
  list-style: none;
  margin: 0;
  padding: 0;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);

  @media (min-width: 768px) {
    display: flex;
    gap: 2rem;
  }
`;

const NavItem = styled.li`
  position: relative;
`;

const NavLink = styled.a`
  color: #4b5563;
  font-weight: 500;
  text-decoration: none;
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: color 0.2s ease;

  &:hover {
    color: #2563eb;
  }
`;

const NavUnderline = styled.span`
  position: absolute;
  bottom: 0;
  height: 2px;
  background-color: #2563eb;
  width: 0;
  transition: width 0.2s ease;

  ${NavItem}:hover & {
    width: 100%;
  }
`;

/* Dropdown styles */
const DropdownMenu = styled.ul`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background-color: #ffffff;
  list-style: none;
  padding: 0.75rem 0;
  margin-top: 0.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  min-width: 200px;
  opacity: ${({ open }) => (open ? '1' : '0')};
  visibility: ${({ open }) => (open ? 'visible' : 'hidden')};
  transition: all 0.3s ease;
  z-index: 20;

  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 0 6px 6px 6px;
    border-style: solid;
    border-color: transparent transparent #ffffff transparent;
  }
`;


const DropdownItem = styled.li`
  padding: 0.5rem 1.25rem;
  transition: background 0.2s ease;

  &:hover {
    background-color: #f9fafb;
  }

  a {
    color: #374151;
    text-decoration: none;
    font-weight: 500;
    display: block;
    transition: color 0.2s ease;

    &:hover {
      color: #2563eb;
    }
  }
`;


const RightSection = styled.div`
  display: none;
  align-items: center;

  @media (min-width: 768px) {
    display: flex;
  }
`;

const MiniLogo = styled.img`
  height: 2.5rem;
  width: 2.5rem;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const MobileMenuButton = styled.button`
  display: block;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #4b5563;
  cursor: pointer;
  z-index: 60;

  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 1rem 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 50;

  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileMenuItem = styled.li`
  list-style: none;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
`;

const MobileMenuLink = styled.a`
  color: #4b5563;
  text-decoration: none;
  font-weight: 500;
  display: block;

  &:hover {
    color: #2563eb;
  }
`;

const NavbarCandidat = ( { messagerieEntretiens } ) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);

  return (
    <NavContainer>
      <NavContent>
        <LogoLink href="/">
          <LogoImg src={logo} alt="JobGate Logo" />
        </LogoLink>

        <NavList>
          <NavItem
            onMouseEnter={() => setDashboardDropdownOpen(true)}
            onMouseLeave={() => setDashboardDropdownOpen(false)}
          >
            <NavLink href="#">Tableau de bord</NavLink>
            <NavUnderline />
            <DropdownMenu open={dashboardDropdownOpen}>
              <DropdownItem><a href="/ExplorerOffres">Explorer les offres</a></DropdownItem>
              <DropdownItem><a href="/sauvegardées">Offres sauvegardées</a></DropdownItem>
              <DropdownItem><a href="/candidatures">Mes candidatures</a></DropdownItem>
              <DropdownItem><Link to="/candidat/dashboard/messagerie" state={{ entretiens: messagerieEntretiens }} >Messagerie</Link></DropdownItem>
            </DropdownMenu>
          </NavItem>

          <NavItem>
            <NavLink href="#">Offre d'emploi</NavLink>
            <NavUnderline />
          </NavItem>

          <NavItem>
            <NavLink href="#">Conseils de carrière</NavLink>
            <NavUnderline />
          </NavItem>
        </NavList>

        <RightSection>
          <MiniLogo src="https://i.pravatar.cc/100" alt="User Profile" />
        </RightSection>

        <MobileMenuButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <>&#10005;</> : <>&#9776;</>}
        </MobileMenuButton>
      </NavContent>

      {mobileMenuOpen && (
        <MobileMenu>
          <MobileMenuItem>
            <Link to="/candidat/dashboard">Tableau de bord</Link>
          </MobileMenuItem>
          <MobileMenuItem><MobileMenuLink href="#">Offre d'emploi</MobileMenuLink></MobileMenuItem>
          <MobileMenuItem><MobileMenuLink href="#">Conseils de carrière</MobileMenuLink></MobileMenuItem>
        </MobileMenu>
      )}
    </NavContainer>
  );
};

export default NavbarCandidat;
