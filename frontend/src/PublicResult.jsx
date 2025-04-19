import { useState, useEffect } from "react";

export default function PublicResult() {
  const [rawRows, setRawRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [site, setSite] = useState("dbg");
  const [status, setStatus] = useState("⏳ 불러오는 중...");
  const [selectedDates, setSelectedDates] = useState([]);
  const [mallFilter, setMallFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [priceSort, setPriceSort] = useState(null);
  const [mallDropdown, setMallDropdown] = useState(false);
  const [typeDropdown, setTypeDropdown] = useState(false);

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
        setRawRows(data);
        setStatus(`✅ 총 ${data.length}건`);
      } catch (err) {
        console.error(err);
        setStatus("❌ 로드 실패");
      }
    };

    fetchData();
  }, [site]);

  useEffect(() => {
    const now = new Date();
    const filtered = rawRows.filter((row) => {
      const timeMatch = row.participation_time.match(/(\d{2})월 (\d{2})일 (\d{2})시 (\d{2})분/);
      if (!timeMatch) return false;
      const [_, mm, dd, hh, min] = timeMatch.map(Number);
      const rowDate = new Date(2025, mm - 1, dd, hh, min);
      if (rowDate <= now) return false;
      const day = dd;
      if (selectedDates.length && !selectedDates.includes(day)) return false;
      if (mallFilter.length && !mallFilter.includes(row.mall)) return false;
      if (typeFilter.length && !typeFilter.includes(row.type)) return false;
      return true;
    });

    if (priceSort) {
      filtered.sort((a, b) => {
        const pa = parseInt(a.price.replace(/[^\d]/g, "")) || 0;
        const pb = parseInt(b.price.replace(/[^\d]/g, "")) || 0;
        return priceSort === "asc" ? pa - pb : pb - pa;
      });
    }

    setFilteredRows(filtered);
  }, [rawRows, selectedDates, mallFilter, typeFilter, priceSort]);

  const uniqueValues = (key) => [...new Set(rawRows.map((r) => r[key]).filter(Boolean))];
  const toggleArrayFilter = (value, array, setter) => {
    if (array.includes(value)) setter(array.filter((v) => v !== value));
    else setter([...array, value]);
  };

  const toggleDate = (day) => toggleArrayFilter(day, selectedDates, setSelectedDates);
  const toggleMall = (mall) => toggleArrayFilter(mall, mallFilter, setMallFilter);
  const toggleType = (type) => toggleArrayFilter(type, typeFilter, setTypeFilter);

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

      <div style={{ marginBottom: 10 }}>
        <label>날짜 필터: </label>
        {[...Array(31)].map((_, i) => (
          <button
            key={i + 1}
            style={{ marginRight: 4, background: selectedDates.includes(i + 1) ? "#4caf50" : "#ccc" }}
            onClick={() => toggleDate(i + 1)}
          >
            {i + 1}일
          </button>
        ))}
      </div>

      <p>{status}</p>

      <table border="1" cellPadding="8" style={{ width: "100%", fontSize: "0.9rem", position: "relative" }}>
        <thead>
          <tr>
            <th>번호</th>
            <th>제목</th>
            <th>리뷰</th>
            <th
              style={{ cursor: "pointer", position: "relative" }}
              onClick={() => setMallDropdown(!mallDropdown)}
            >
              몰 ⏷
              {mallDropdown && (
                <div style={{ position: "absolute", top: "100%", left: 0, background: "white", border: "1px solid #ccc", zIndex: 10 }}>
                  {uniqueValues("mall").map((mall) => (
                    <div key={mall}>
                      <label>
                        <input
                          type="checkbox"
                          checked={mallFilter.includes(mall)}
                          onChange={() => toggleMall(mall)}
                        /> {mall}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </th>
            <th onClick={() => setPriceSort(priceSort === "asc" ? "desc" : "asc")} style={{ cursor: "pointer" }}>
              가격 {priceSort === "asc" ? "⬆️" : priceSort === "desc" ? "⬇️" : ""}
            </th>
            <th>포인트</th>
            <th
              style={{ cursor: "pointer", position: "relative" }}
              onClick={() => setTypeDropdown(!typeDropdown)}
            >
              유형 ⏷
              {typeDropdown && (
                <div style={{ position: "absolute", top: "100%", left: 0, background: "white", border: "1px solid #ccc", zIndex: 10 }}>
                  {uniqueValues("type").map((type) => (
                    <div key={type}>
                      <label>
                        <input
                          type="checkbox"
                          checked={typeFilter.includes(type)}
                          onChange={() => toggleType(type)}
                        /> {type}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </th>
            <th>시간</th>
            <th>검색어 추천</th>
            <th>검색어복사</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row, i) => (
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
                <button onClick={() => navigator.clipboard.writeText(row.keyword)}>복사</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
