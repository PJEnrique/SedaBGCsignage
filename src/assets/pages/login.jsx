import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import { Navigate, Link } from "react-router-dom";
import "../css/login.css";

const Login = () => {
  const { signInWithEmailAndPassword, currentUser } = useAuth();

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");

  const ALLOWED_DOMAIN = "@ayalalandhospitality.com";

  const cleanEmail = (value) => value.trim().toLowerCase();

  const validateDomain = (value) => {
    if (!value) return false;
    return value.endsWith(ALLOWED_DOMAIN);
  };

  useEffect(() => {
    const syncAutofillValues = () => {
      const autofilledEmail = emailRef.current?.value || "";
      const autofilledPassword = passwordRef.current?.value || "";

      if (autofilledEmail) {
        setEmail(autofilledEmail);
      }

      if (autofilledPassword) {
        setPassword(autofilledPassword);
      }
    };

    const timerOne = setTimeout(syncAutofillValues, 300);
    const timerTwo = setTimeout(syncAutofillValues, 1000);

    return () => {
      clearTimeout(timerOne);
      clearTimeout(timerTwo);
    };
  }, []);

  const handleLogin = async (event) => {
    if (event) {
      event.preventDefault();
    }

    const emailValue = emailRef.current?.value || email;
    const passwordValue = passwordRef.current?.value || password;

    const clean = cleanEmail(emailValue);

    setError(null);

    if (!clean) {
      setError("Enter email first");
      return;
    }

    if (!validateDomain(clean)) {
      setError(`Only ${ALLOWED_DOMAIN} emails allowed`);
      return;
    }

    if (!passwordValue) {
      setError("Enter password");
      return;
    }

    try {
      await signInWithEmailAndPassword(clean, passwordValue);
    } catch (err) {
      setError(err.message);
    }
  };

  const openResetModal = () => {
    const emailValue = emailRef.current?.value || email;

    setResetEmail(emailValue);
    setResetSuccess("");
    setError(null);
    setShowResetModal(true);
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetEmail("");
    setResetSuccess("");
    setResetSending(false);
  };

  const handleResetPassword = async (event) => {
    if (event) {
      event.preventDefault();
    }

    const clean = cleanEmail(resetEmail);

    setError(null);
    setResetSuccess("");

    if (!clean) {
      setError("Enter email");
      return;
    }

    if (!validateDomain(clean)) {
      setError(`Only ${ALLOWED_DOMAIN} emails allowed`);
      return;
    }

    try {
      setResetSending(true);

      await auth.sendPasswordResetEmail(clean);

      setResetSuccess("Reset link sent. Check your email inbox.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResetSending(false);
    }
  };

  if (currentUser) {
    return <Navigate to="/user/Dashboard" />;
  }

  return (
    <div className="container">
      <form
        className="form-container"
        onSubmit={handleLogin}
        autoComplete="on"
        method="post"
        name="login"
      >
        <h2>Login</h2>

        <input
          ref={emailRef}
          id="login-email"
          name="username"
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          inputMode="email"
        />

        <div className="password-field-wrapper">
          <input
            ref={passwordRef}
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          {password && (
            <button
              type="button"
              className="password-toggle-button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          )}
        </div>

        <button type="submit">
          Login
        </button>

        <button
          type="button"
          className="forgot-password-button"
          onClick={openResetModal}
        >
          Forgot Password?
        </button>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        <p>
          Don't have an account?{" "}
          <Link to="/register">
            Register
          </Link>
        </p>
      </form>

      {showResetModal && (
        <div className="modal-overlay" onClick={closeResetModal}>
          <form
            className="modal-box"
            onSubmit={handleResetPassword}
            onClick={(event) => event.stopPropagation()}
            autoComplete="on"
          >
            <h3>Reset Password</h3>

            <input
              id="reset-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
            />

            <button type="submit" disabled={resetSending}>
              {resetSending ? "Sending..." : "Send Reset Link"}
            </button>

            <button
              type="button"
              className="modal-cancel"
              onClick={closeResetModal}
            >
              Cancel
            </button>

            {resetSuccess && (
              <p className="success-message">
                {resetSuccess}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default Login;