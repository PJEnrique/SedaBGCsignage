import React from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toolbar } from "@mui/material";

import Dashboard from "./assets/pages/Dashboard.jsx";
import ABACA1 from "./assets/pages/ABACA1.jsx";
import ABACA2 from "./assets/pages/ABACA2.jsx";
import ABACA3 from "./assets/pages/ABACA3.jsx";
import ABEL from "./assets/pages/ABEL.jsx";
import JUSI from "./assets/pages/JUSI.jsx";
import LOBBY from "./assets/pages/LOBBY.jsx";
import PlayerPairing from "./assets/pages/PlayerPairing.jsx";

import NavDrawer from "./assets/layout/NavDrawer.jsx";
import Login from "./assets/pages/login.jsx";
import Register from "./assets/pages/register.jsx";
import { useAuth } from "./assets/context/AuthContext.jsx";

const AppContent = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const hideNavRoutes = [
    "/player",
    "/user/ABACA1",
    "/user/ABACA2",
    "/user/ABACA3",
    "/user/ABEL",
    "/user/JUSI",
    "/user/LOBBY",
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
        <Route
          path="/"
          element={!currentUser ? <Login /> : <Navigate to="/user/Dashboard" />}
        />

        <Route
          path="/register"
          element={!currentUser ? <Register /> : <Navigate to="/user/Dashboard" />}
        />

        <Route
          path="/user/Dashboard"
          element={currentUser ? <Dashboard /> : <Navigate to="/" />}
        />

        {/* PUBLIC PLAYER PAIRING */}
        <Route path="/player" element={<PlayerPairing />} />

        {/* PUBLIC DISPLAY ROUTES */}
        <Route path="/user/ABACA1" element={<ABACA1 />} />
        <Route path="/user/ABACA2" element={<ABACA2 />} />
        <Route path="/user/ABACA3" element={<ABACA3 />} />
        <Route path="/user/ABEL" element={<ABEL />} />
        <Route path="/user/JUSI" element={<JUSI />} />
        <Route path="/user/LOBBY" element={<LOBBY />} />
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