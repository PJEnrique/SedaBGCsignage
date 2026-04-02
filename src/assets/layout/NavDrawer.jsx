import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/NavDrawer.css';
import logo from '../images/image001.png'; // 🔥 make sure path is correct

const navItems = [
  { label: 'Dashboard', path: '/user/Dashboard' },
  { label: 'ABACA 1', path: '/user/ABACA1' },
  { label: 'ABACA 2', path: '/user/ABACA2' },
  { label: 'ABACA 3', path: '/user/ABACA3' },
  { label: 'ABEL', path: '/user/ABEL' },
  { label: 'JUSI', path: '/user/JUSI' },
];

function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { signOut } = useAuth();
  const location = useLocation();

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

  return (
    <div className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        
        {/* LEFT SIDE (LOGO + TEXT) */}
        <Link to="/user/Dashboard" className="navbar-brand">
          <img src={logo} alt="logo" className="navbar-logo" />
          <span>Tower 1 Signage</span>
        </Link>

        {/* RIGHT SIDE */}
        <div className="navbar-menu">
          
          {/* NAV ITEMS */}
          <div className="navbar-actions">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-button ${
                  location.pathname === item.path ? 'active' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* SEPARATED SIGN OUT */}
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