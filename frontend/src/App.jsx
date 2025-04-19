import { Routes, Route } from "react-router-dom";
import PublicLanding from "./PublicLanding.jsx";
import PublicResult from "./PublicResult.jsx";
import InternalUploader from "./Internal.jsx"; // 따로 분리한 자동 업로드 UI

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLanding />} />
      <Route path="/public" element={<PublicResult />} />
      <Route path="/internal" element={<InternalUploader />} />
    </Routes>
  );
}
