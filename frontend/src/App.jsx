import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Landing from "./pages/Landing";
import Sector from "./pages/Sector";
// import Survey from "./pages/Survey";
import HedgeCalculator from "./pages/HedgeCalculator";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sector" element={<Sector />} />
        {/* <Route path="/signup" element={<Survey />} />*/}
        <Route path="/hedge-calculator" element={<HedgeCalculator />} />
      </Routes>
    </BrowserRouter>
  );
}

// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import "./App.css";
// import Landing from "./pages/Landing";
// import Sector from "./pages/Sector";
// import Survey from "./pages/Survey";

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Landing />} />
//         <Route path="/sector" element={<Sector />} />
//         <Route path="/signup" element={<Survey />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }
