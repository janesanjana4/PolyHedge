import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Landing from "./pages/Landing";
import Sector from "./pages/Sector";
import Survey from "./pages/Survey";
import Login from "./pages/Login";
import HedgeCalculator from "./pages/HedgeCalculator";
import Dashboard from "./pages/Dashboard";

// ✅ session helper
import { getUser } from "./lib/userSession";

// ── Protected Route ─────────────────────────────
function ProtectedRoute({ children }) {
  const user = getUser();
  return user ? children : <Navigate to="/login" replace />;
}

// ── App ─────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/sector" element={<Sector />} />
        <Route path="/signup" element={<Survey />} />
        <Route path="/login" element={<Login />} />

        {/* ✅ Hedge = PUBLIC (important for demo) */}
        <Route path="/hedge" element={<HedgeCalculator />} />

        {/* ✅ Dashboard = PROTECTED */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
