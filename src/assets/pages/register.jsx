import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/login.css';

const Register = () => {
  const { signUp, currentUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [showSecretCode, setShowSecretCode] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ALLOWED_DOMAIN = '@ayalalandhospitality.com';
  const REQUIRED_SECRET_CODE = 'X8GZ&Zq6pNdH#!Ya';

  const hasSecretCode = secretCode.trim().length > 0;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanSecretCode = secretCode.trim();

    setError('');

    if (!cleanEmail) {
      setError('Please enter your email.');
      return;
    }

    if (!cleanEmail.endsWith(ALLOWED_DOMAIN)) {
      setError(`Only ${ALLOWED_DOMAIN} email accounts are allowed.`);
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (cleanSecretCode !== REQUIRED_SECRET_CODE) {
      setError('Incorrect secret code.');
      return;
    }

    try {
      setLoading(true);

      await signUp(cleanEmail, password);

      navigate('/user/Dashboard');
    } catch (error) {
      console.error('Register error:', error);
      setError(error.message || 'Failed to create an account.');
    } finally {
      setLoading(false);
    }
  };

  const handleSecretCodeChange = (event) => {
    const value = event.target.value;

    setSecretCode(value);

    if (value.trim().length === 0) {
      setShowSecretCode(false);
    }
  };

  const showSecret = () => {
    if (hasSecretCode) {
      setShowSecretCode(true);
    }
  };

  const hideSecret = () => {
    setShowSecretCode(false);
  };

  if (currentUser) {
    return <Navigate to="/user/Dashboard" />;
  }

  return (
    <div className="container">
      <form className="form-container register-form" onSubmit={handleSubmit}>
        <h2>Create Account</h2>

        <p className="auth-subtitle">
          Use your Ayala Land Hospitality email to register.
        </p>

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoFocus
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        <div className="secret-code-wrapper">
          <input
            type={showSecretCode ? 'text' : 'password'}
            placeholder="Enter Secret Code"
            value={secretCode}
            onChange={handleSecretCodeChange}
            autoComplete="off"
          />

          {hasSecretCode && (
            <button
              type="button"
              className="secret-toggle-button"
              onMouseDown={showSecret}
              onMouseUp={hideSecret}
              onMouseLeave={hideSecret}
              onTouchStart={showSecret}
              onTouchEnd={hideSecret}
              onTouchCancel={hideSecret}
              onBlur={hideSecret}
              onContextMenu={(event) => event.preventDefault()}
            >
              Show
            </button>
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        <p>
          Already have an account?{' '}
          <Link to="/">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;