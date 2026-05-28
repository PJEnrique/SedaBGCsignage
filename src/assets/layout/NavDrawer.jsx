import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/NavDrawer.css';
import logo from '../images/image001.png';

function NavBar() {
  const [isScrolled, setIsScrolled] =
    useState(false);

  const { signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 6);
    };

    window.addEventListener(
      'scroll',
      handleScroll
    );

    return () =>
      window.removeEventListener(
        'scroll',
        handleScroll
      );
  }, []);

  const handleSignOut = async () => {
    const confirmLogout = window.confirm(
      'Are you sure you want to sign out?'
    );

    if (!confirmLogout) return;

    try {
      await signOut();
    } catch (error) {
      console.error(
        'Sign out error:',
        error.message
      );
    }
  };

  return (
    <div
      className={`navbar ${
        isScrolled ? 'scrolled' : ''
      }`}
    >
      <div className="navbar-container">

        {/* LOGO */}
        <Link
          to="/user/Dashboard"
          className="navbar-brand"
        >
          <img
            src={logo}
            alt="logo"
            className="navbar-logo"
          />
        </Link>

        {/* RIGHT SIDE */}
        <div className="navbar-right">
          <button
            className="signout-button"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}

export default NavBar;