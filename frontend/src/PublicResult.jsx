import { useEffect, useState } from "react";
import NoticePopup from "./NoticePopup";
import "./publicresult.css";

/* ───────── JSON 경로만 수정 ───────── */
const DATA_URLS = {
  dbg:  "https://raw.githubusercontent.com/<YOUR_ID>/<REPO>/main/public_campaigns.json",
  gtog: "https://raw.githubusercontent.com/<YOUR_ID>/<REPO>/main/public_campaigns_gtog.json",
};

export default function PublicResult() {
  /* ───────── 상태 ───────── */
  const [publicRows, setPublicRows] = useState([]);
  const [favorites, setFavorites] = useState(() =>
    JSON.parse(localStorage.getItem("favorites") || "[]")
  );
  const [filter, setFilter]       = useState("");
  const [status, setStatus]       = useState("⏳ 데이터 불러오는 중...");
  const [typeFilter, setTypeFilter] = useState("전체");
  const [mallFilter, setMallFilter] = useState("전체");
  const [sortPrice, setSortPrice]   = useState(null);
  const [targetSite, setTargetSite] = useState(
    localStorage.getItem("target_site_public") || "dbg"
  );

  const [alarmMinutes, setAlarmMinutes] = useState(3);
  const [alarmNewTab, setAlarmNewTab]   = useState(true);
  const [alarmList, setAlarmList]       = useState(() =>
    JSON.parse(localStorage.getItem("campaign_alarms") || "[]")
  );

  /* ───────── 시간 파싱 ───────── */
  const parseKoreanTime = (str) => {
    const m = str?.match(/(\d{2})월 (\d{2})일 (\d{2})시 (\d{2})분/);
    if (!m) return null;
    const [_, mm, dd, hh, min] = m.map(Number);
    return new Date(new Date().getFullYear(), mm - 1, dd, hh, min);
  };

  /* ───────── 알람 트리거 ───────── */
  const triggerAlarms = () => {
    const now = new Date();
    const ready = alarmList.filter(({ time, offset }) => {
      const t = parseKoreanTime(time);
      if (!t) return false;
      return Math.floor((t - now) / 60000) === offset;
    });

    ready.forEach(({ title, url, newTab, csq }) => {
      new Notification("⏰ 캠페인 알림", { body: title });
      if (newTab && url) {
        navigator.clipboard.writeText(url);
        window.open(url, "_blank");
      }
    });

    if (ready.length) {
      const remain = alarmList.filter((a) => !ready.some((r) => r.csq === a.csq));
      setAlarmList(remain);
      localStorage.setItem("campaign_alarms", JSON.stringify(remain));
    }
  };
  useEffect(() => {
    if (Notification.permission !== "granted") Notification.requestPermission();
    const id = setInterval(triggerAlarms, 30000);
    return () => clearInterval(id);
  }, [alarmList]);

  /* ───────── 데이터 로드 ───────── */
  useEffect(() => {
    let stop = false;
    async function load() {
      setStatus("⏳ 데이터 불러오는 중...");
      try {
        const res  = await fetch(DATA_URLS[targetSite], { cache: "no-cache" });
        const data = await res.json();
        const now  = new Date();
        const rows = data.filter((d) => {
          const t = parseKoreanTime(d.participation_time);
          return !t || t > now;        // 지난 캠페인 숨김
        });
        if (!stop) {
          setPublicRows(rows);
          setStatus(`✅ ${targetSite.toUpperCase()} ${rows.length}건`);
        }
      } catch (e) {
        if (!stop) setStatus("❌ 로드 오류: " + e.message);
      }
    }
    load();
    const id = setInterval(load, 60000);   // 1분마다 갱신
    return () => { stop = true; clearInterval(id); };
  }, [targetSite]);

  /* ───────── 즐겨찾기 ───────── */
  const toggleFavorite = (row) => {
    const exists  = favorites.find((f) => f.csq === row.csq);
    const updated = exists ? favorites.filter((f) => f.csq !== row.csq)
                           : [...favorites, row];
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };
  const isFav = (csq) => favorites.some((f) => f.csq === csq);

  /* ───────── 알람 ───────── */
  const isAlarmSet = (csq) => alarmList.some((a) => a.csq === csq);
  const toggleAlarm = (row) => {
    const exists  = alarmList.find((a) => a.csq === row.csq);
    const updated = exists
      ? alarmList.filter((a) => a.csq !== row.csq)
      : [
          ...alarmList,
          {
            csq: row.csq,
            time: row.participation_time,
            title: row.title,
            url: row.url,
            offset: alarmMinutes,
            newTab: alarmNewTab,
          },
        ];
    setAlarmList(updated);
    localStorage.setItem("campaign_alarms", JSON.stringify(updated));
  };

  /* ───────── 링크 복사 ───────── */
  const handleCopy = (url) =>
    navigator.clipboard.writeText(url).then(() => alert("링크가 복사되었습니다!"));

  /* ───────── 테이블 렌더 ───────── */
  const renderTable = (rows, showFavCol = false, favSection = false) => {
    const filtered = rows
      .filter(
        (r) =>
          r &&
          r.title &&
          (r.title.includes(filter) ||
            r.review?.includes(filter) ||
            r.mall?.includes(filter))
      )
      .filter((r) => typeFilter === "전체" || r.type?.includes(typeFilter))
      .filter((r) => mallFilter === "전체" || r.mall === mallFilter);

    if (sortPrice === "asc")
      filtered.sort(
        (a, b) =>
          parseInt(a.price.replace(/[^\d]/g, "")) -
          parseInt(b.price.replace(/[^\d]/g, ""))
      );
    else if (sortPrice === "desc")
      filtered.sort(
        (a, b) =>
          parseInt(b.price.replace(/[^\d]/g, "")) -
          parseInt(a.price.replace(/[^\d]/g, ""))
      );

    return (
      <div style={{ marginBottom: 40 }}>
        <h3>
          {favSection ? "🌟 즐겨찾기 캠페인" : "🌐 캠페인"} ({filtered.length}건)
        </h3>

        {/* ─── 필터 바 ─── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="🔎 키워드 필터"
            style={{ width: 200 }}
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="전체">전체</option>
            <option value="빈">빈</option>
            <option value="실">실</option>
          </select>
          <select value={mallFilter} onChange={(e) => setMallFilter(e.target.value)}>
            <option value="전체">전체 쇼핑몰</option>
            {[...new Set(publicRows.map((r) => r.mall).filter(Boolean))].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <select
            value={sortPrice || "정렬없음"}
            onChange={(e) =>
              setSortPrice(e.target.value === "정렬없음" ? null : e.target.value)
            }
          >
            <option value="정렬없음">가격 정렬 없음</option>
            <option value="asc">가격 ↑</option>
            <option value="desc">가격 ↓</option>
          </select>
        </div>

        {/* ─── 알람 옵션 ─── */}
        <div style={{ marginBottom: 10 }}>
          ⏰ 알람 시간:
          {[1, 2, 3, 4, 5].map((m) => (
            <label key={m} style={{ marginRight: 8 }}>
              <input
                type="radio"
                name="alarmMin"
                value={m}
                checked={alarmMinutes === m}
                onChange={() => setAlarmMinutes(m)}
              />{" "}
              {m}분전
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={alarmNewTab}
              onChange={(e) => setAlarmNewTab(e.target.checked)}
            />{" "}
            새 탭 열기 + 링크 복사
          </label>
        </div>

        {/* ─── 데이터 테이블 ─── */}
        <table
          className="campaign-table"
          border="1"
          cellPadding="6"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              {showFavCol && <th>⭐</th>}
              <th>구분</th>
              <th className="col-review">리뷰</th>
              <th>쇼핑몰</th>
              <th>가격</th>
              <th className="col-point">포인트</th>
              <th>시간</th>
              <th className="col-title">상품명</th>
              <th className="col-link">링크</th>
              <th>알람</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.csq}>
                {showFavCol && (
                  <td>
                    <button onClick={() => toggleFavorite(row)}>
                      {isFav(row.csq) ? "★" : "☆"}
                    </button>
                  </td>
                )}
                <td>{row.type}</td>
                <td className="col-review">{row.review}</td>
                <td>{row.mall}</td>
                <td>
                  {Number(row.price.replace(/[^\d]/g, "")).toLocaleString("ko-KR")}
                </td>
                <td className="col-point">{row.point}</td>
                <td>{row.participation_time}</td>
                <td className="col-title">{row.title}</td>
                <td className="col-link">
                  <button onClick={() => handleCopy(row.url)}>복사</button>
                </td>
                <td>
                  <button onClick={() => toggleAlarm(row)}>
                    {isAlarmSet(row.csq) ? "🔕" : "🔔"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  /* ───────── UI ───────── */
  return (
    <>
      <NoticePopup />
      <div style={{ padding: 20 }}>
        <h2>🌐 캠페인 목록</h2>
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => {
              const next = targetSite === "dbg" ? "gtog" : "dbg";
              localStorage.setItem("target_site_public", next);
              setTargetSite(next);
            }}
          >
            🔁 현재 사이트: {targetSite.toUpperCase()} (전환)
          </button>
        </div>
        <p style={{ color: "green" }}>{status}</p>
        {renderTable(favorites, true, true)}
        {renderTable(publicRows, true, false)}
      </div>
    </>
  );
}
