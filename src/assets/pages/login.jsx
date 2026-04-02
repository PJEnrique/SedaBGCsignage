import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate, Link } from "react-router-dom";
import "../css/login.css"; // Import the CSS file for styling

const Login = () => {
  const { signInWithEmailAndPassword, currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(email, password);
      setIsLoggedIn(true); // Set isLoggedIn to true after successful login
    } catch (error) {
      setError(error.message);
    }
  };

  if (isLoggedIn || currentUser) {
    return <Navigate to="/user/Dashboard" />;
  }

  return (
    <div className="container">
      <div className="form-container">
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
        {error && <p className="error-message">{error}</p>}
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
