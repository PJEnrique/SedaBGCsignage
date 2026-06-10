import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/NavDrawer.css';
import logo from '../images/image001.png';

function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 6);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    const confirmLogout = window.confirm('Are you sure you want to sign out?');

    if (!confirmLogout) return;

    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error.message);
    }
  };

  const getNavClass = ({ isActive }) =>
    isActive ? 'nav-button active' : 'nav-button';

  return (
    <div className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/user/Dashboard" className="navbar-brand">
          <img src={logo} alt="logo" className="navbar-logo" />
        </Link>

        <div className="navbar-menu">
          <nav className="navbar-actions">
            <NavLink to="/user/Dashboard" className={getNavClass}>
              Overview
            </NavLink>

            <NavLink to="/user/media" className={getNavClass}>
              Media
            </NavLink>

            <NavLink to="/user/playlists" className={getNavClass}>
              Playlists
            </NavLink>

            <NavLink to="/user/displays" className={getNavClass}>
              Displays
            </NavLink>

            <NavLink to="/user/pairing" className={getNavClass}>
              Pairing
            </NavLink>

            <NavLink to="/user/logs" className={getNavClass}>
              Logs
            </NavLink>
          </nav>

          <div className="navbar-right">
            <button className="signout-button" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NavBar;