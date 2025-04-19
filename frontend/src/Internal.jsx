import { useState } from "react";
import axios from "axios";

export default function InternalUploader() {
  const [sessionCookie, setSessionCookie] = useState("");
  const [site, setSite] = useState("dbg");
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!sessionCookie || !site) {
      setStatus("❗ 쿠키값과 사이트를 입력해주세요.");
      return;
    }

    try {
      setStatus("⏳ 업로드 중...");
      const res = await axios.post("https://dbgcrawl.onrender.com/api/upload", {
        session_cookie: sessionCookie,
        site: site,
      });
      setStatus(`✅ ${res.data.count}건 업로드 완료`);
    } catch (err) {
      console.error(err);
      setStatus("❌ 업로드 실패: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <main style={{ maxWidth: 500, margin: "0 auto", padding: 40 }}>
      <h1 style={{ fontSize: "1.6rem", marginBottom: 30 }}>
        공개 캠페인 자동 업로드
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>PHPSESSID:</label>
        <input
          type="text"
          value={sessionCookie}
          onChange={(e) => setSessionCookie(e.target.value)}
          style={{ padding: "8px 12px", fontSize: "1rem" }}
          placeholder="로그인 후 복사한 PHPSESSID"
        />

        <label>사이트 선택:</label>
        <select
          value={site}
          onChange={(e) => setSite(e.target.value)}
          style={{ padding: "8px 12px", fontSize: "1rem" }}
        >
          <option value="dbg">dbg</option>
          <option value="gtog">gtog</option>
        </select>

        <button
          style={{
            marginTop: 10,
            padding: "10px 16px",
            fontSize: "1rem",
            fontWeight: "bold",
            backgroundColor: "#2f80ed",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
          onClick={handleUpload}
        >
          실행
        </button>
      </div>

      <p style={{ marginTop: 20, fontSize: "1rem", color: "#333" }}>{status}</p>
    </main>
  );
}
