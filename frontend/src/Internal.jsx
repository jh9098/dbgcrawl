import { useState } from "react";
import axios from "axios";

export default function InternalUploader() {
  const [htmlText, setHtmlText] = useState("");
  const [site, setSite] = useState("dbg");
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!htmlText || !site) {
      setStatus("❗ HTML 내용과 사이트를 입력해주세요.");
      return;
    }

    try {
      setStatus("⏳ 업로드 중...");
      const res = await axios.post("https://dbgcrawl.onrender.com/api/upload-html", htmlText, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          site,
        },
      });

      setStatus(`✅ ${res.data.count}건 업로드 완료`);
    } catch (err) {
      console.error(err);
      setStatus("❌ 업로드 실패: " + (err.response?.data?.error || err.message));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // 텍스트를 Blob으로 감싸서 File처럼 전송
    const formData = new FormData();
    const blob = new Blob([htmlText], { type: "text/html" });
    formData.append("file", blob, "campaign.html");
    formData.append("site", site);

    try {
      setStatus("⏳ 업로드 중...");
      const res = await axios.post("https://dbgcrawl.onrender.com/api/upload-html", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus(`✅ ${res.data.count}건 업로드 완료`);
    } catch (err) {
      console.error(err);
      setStatus("❌ 업로드 실패: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 40 }}>
      <h1 style={{ fontSize: "1.6rem", marginBottom: 30 }}>
        복붙 기반 공개 캠페인 업로드
      </h1>

      <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label>사이트 선택:</label>
        <select
          value={site}
          onChange={(e) => setSite(e.target.value)}
          style={{ padding: "8px 12px", fontSize: "1rem" }}
        >
          <option value="dbg">dbg</option>
          <option value="gtog">gtog</option>
        </select>

        <label>HTML 전체 붙여넣기:</label>
        <textarea
          value={htmlText}
          onChange={(e) => setHtmlText(e.target.value)}
          placeholder="크롬 개발자도구에서 전체 HTML 복사 후 여기에 붙여넣으세요."
          rows={20}
          style={{ width: "100%", fontSize: "0.9rem", fontFamily: "monospace", padding: 12 }}
        />

        <button
          type="submit"
          style={{
            padding: "10px 16px",
            fontSize: "1rem",
            fontWeight: "bold",
            backgroundColor: "#2f80ed",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          실행
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: "1rem", color: "#333" }}>{status}</p>
    </main>
  );
}
