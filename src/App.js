import React from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toolbar } from "@mui/material";
import Dashboard from "./assets/pages/Dashboard.jsx";
import ABACA1 from "./assets/pages/ABACA1.jsx";
import ABACA2 from "./assets/pages/ABACA2.jsx";
import ABACA3 from "./assets/pages/ABACA3.jsx";
import ABEL from "./assets/pages/ABEL.jsx";
import JUSI from "./assets/pages/JUSI.jsx";
import NavDrawer from "./assets/layout/NavDrawer.jsx";
import Login from "./assets/pages/login.jsx";
import Register from "./assets/pages/register.jsx";
import { useAuth } from "./assets/context/AuthContext.jsx";

const AppContent = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const hideNavRoutes = [
    "/user/ABACA1",
    "/user/ABACA2",
    "/user/ABACA3",
    "/user/ABEL",
    "/user/JUSI",
  ];

  const shouldHideNav = hideNavRoutes.includes(location.pathname);

  return (
    <>
      {currentUser && !shouldHideNav && (
        <>
          <NavDrawer />
          <Toolbar />
        </>
      )}

      <Routes>
        <Route path="/" element={!currentUser ? <Login /> : <Navigate to="/user/Dashboard" />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/user/Dashboard" />} />

        <Route path="/user/Dashboard" element={currentUser ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/user/ABACA1" element={currentUser ? <ABACA1 /> : <Navigate to="/" />} />
        <Route path="/user/ABACA2" element={currentUser ? <ABACA2 /> : <Navigate to="/" />} />
        <Route path="/user/ABACA3" element={currentUser ? <ABACA3 /> : <Navigate to="/" />} />
        <Route path="/user/ABEL" element={currentUser ? <ABEL /> : <Navigate to="/" />} />
        <Route path="/user/JUSI" element={currentUser ? <JUSI /> : <Navigate to="/" />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;