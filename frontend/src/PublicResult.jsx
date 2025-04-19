import { useState, useEffect } from "react";

export default function PublicResult() {
  const [rows, setRows] = useState([]);
  const [site, setSite] = useState("dbg");
  const [status, setStatus] = useState("⏳ 불러오는 중...");

  const API_BASE = "https://dbgcrawl.onrender.com";

  const DATA_URLS = {
    dbg: `${API_BASE}/static/public_campaigns.json`,
    gtog: `${API_BASE}/static/public_campaigns_gtog.json`,
  };

  useEffect(() => {
    const fetchData = async () => {
      setStatus("⏳ 불러오는 중...");
      try {
        const res = await fetch(DATA_URLS[site]);
        const data = await res.json();
        setRows(data);
        setStatus(`✅ 총 ${data.length}건`);
      } catch (err) {
        console.error(err);
        setStatus("❌ 로드 실패");
      }
    };

    fetchData();
  }, [site]);

  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>
        공개 캠페인 리스트
      </h1>

      <div style={{ marginBottom: 20 }}>
        <label>사이트 선택: </label>
        <select value={site} onChange={(e) => setSite(e.target.value)}>
          <option value="dbg">dbg</option>
          <option value="gtog">gtog</option>
        </select>
      </div>

      <p>{status}</p>

      <table border="1" cellPadding="8" style={{ width: "100%", fontSize: "0.9rem" }}>
        <thead>
          <tr>
            <th>번호</th>
            <th>제목</th>
            <th>리뷰</th>
            <th>몰</th>
            <th>가격</th>
            <th>포인트</th>
            <th>유형</th>
            <th>시간</th>
            <th>검색어 추천</th>
            <th>링크</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.csq}>
              <td>{i + 1}</td>
              <td>{row.title}</td>
              <td>{row.review}</td>
              <td>{row.mall}</td>
              <td>{row.price}</td>
              <td>{row.point}</td>
              <td>{row.type}</td>
              <td>{row.participation_time}</td>
              <td>{row.keyword}</td>
              <td>
                <a href={row.url} target="_blank" rel="noreferrer">
                  열기
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
