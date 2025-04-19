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
        const pa = parseInt(a.price.replace(/[^0-9]/g, "")) || 0;
        const pb = parseInt(b.price.replace(/[^0-9]/g, "")) || 0;
        return priceSort === "asc" ? pa - pb : pb - pa;
      });
    }

    setFilteredRows(filtered);
  }, [rawRows, selectedDates, mallFilter, typeFilter, priceSort]);

  const uniqueValues = (key) => [...new Set(rawRows.map((r) => r[key]).filter(Boolean))];

  const toggleArrayFilter = (value, array, setter, fullList) => {
    if (value === "전체 선택") {
      if (array.length === fullList.length) setter([]);
      else setter(fullList);
    } else {
      if (array.includes(value)) setter(array.filter((v) => v !== value));
      else setter([...array, value]);
    }
  };

  const toggleDate = (day) => toggleArrayFilter(day, selectedDates, setSelectedDates);
  const toggleMall = (mall) => toggleArrayFilter(mall, mallFilter, setMallFilter, uniqueValues("mall"));
  const toggleType = (type) => toggleArrayFilter(type, typeFilter, setTypeFilter, uniqueValues("type"));

  const switchSite = () => setSite(site === "dbg" ? "굿투리뷰" : "또바기리뷰");

  const tableStyle = {
    width: "100%",
    fontSize: "0.9rem",
    tableLayout: "fixed",
  };

  const thStyle = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const renderFilterDropdown = (options, selected, toggleFn, title) => (
    <div style={{ position: "absolute", top: "100%", left: 0, background: "white", border: "1px solid #ccc", zIndex: 10, padding: "4px" }}>
      {["전체 선택", ...options].map((option) => (
        <div key={option} onClick={() => toggleFn(option)} style={{ cursor: "pointer", padding: "4px 6px" }}>
          <label style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={option === "전체 선택" ? selected.length === options.length : selected.includes(option)}
              readOnly
              style={{ marginRight: 6 }}
            />
            {option}
          </label>
        </div>
      ))}
    </div>
  );

  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>
        캠페인 리스트
      </h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={switchSite} style={{ padding: "6px 14px", fontSize: "0.95rem" }}>
          현재 사이트: {site} (클릭 전환)
        </button>
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

      <table border="1" cellPadding="8" style={tableStyle}>
        <colgroup>
          <col style={{ width: "2%" }} />
          <col style={{ width: "54%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "5%" }} />
          <col style={{ width: "5%" }} />
          <col style={{ width: "3%" }} />
          <col style={{ width: "4%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "4%" }} />
        </colgroup>
        <thead>
          <tr>
            <th style={thStyle}>번호</th>
            <th style={thStyle}>상품명</th>
            <th style={thStyle}>참여가능인원</th>
            <th
              style={{ position: "relative", cursor: "pointer" }}
              onClick={() => setMallDropdown(!mallDropdown)}
            >
              쇼핑몰 ⏷
              {mallDropdown && renderFilterDropdown(uniqueValues("mall"), mallFilter, toggleMall, "쇼핑몰")}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={togglePriceSort}
            >
              가격 {priceSort === "asc" ? "⬆️" : priceSort === "desc" ? "⬇️" : "↕️"}
            </th>
            <th style={thStyle}>포인트</th>
            <th
              style={{ position: "relative", cursor: "pointer" }}
              onClick={() => setTypeDropdown(!typeDropdown)}
            >
              유형 ⏷
              {typeDropdown && renderFilterDropdown(uniqueValues("type"), typeFilter, toggleType, "유형")}
            </th>
            <th style={thStyle}>시간</th>
            <th style={thStyle}>검색어 추천</th>
            <th style={thStyle}>검색어복사</th>
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
