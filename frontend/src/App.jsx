import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Landing from "./pages/Landing";
import Sector from "./pages/Sector";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sector" element={<Sector />} />
      </Routes>
    </BrowserRouter>
  );
}
