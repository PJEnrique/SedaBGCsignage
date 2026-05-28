import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate, Link } from "react-router-dom";
import "../css/login.css";

const Login = () => {
  const { signInWithEmailAndPassword, currentUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const ALLOWED_DOMAIN = "@ayalalandhospitality.com";

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.endsWith(ALLOWED_DOMAIN)) {
      setError(
        `Only ${ALLOWED_DOMAIN} email accounts are allowed`
      );
      return;
    }

    try {
      setError(null);

      await signInWithEmailAndPassword(
        cleanEmail,
        password
      );
    } catch (error) {
      setError(error.message);
    }
  };

  if (currentUser) {
    return <Navigate to="/user/Dashboard" />;
  }

  return (
    <div className="container">
      <div className="form-container">
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>
          Login
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
      </div>
    </div>
  );
};

export default Login;