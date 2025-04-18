import { Routes, Route } from "react-router-dom";
import PublicLanding from "./PublicLanding.jsx";
import PublicResult from "./PublicResult.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLanding />} />
      <Route path="/public" element={<PublicResult />} />
    </Routes>
  );
}
