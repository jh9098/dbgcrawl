import { useNavigate } from "react-router-dom";

export default function PublicLanding() {
  const navigate = useNavigate();
  return (
    <main style={styles.wrap}>
      <h1 style={styles.h1}>공개 캠페인 결과</h1>
      <button style={styles.btn} onClick={() => navigate("/public")}>
        결과 보기
      </button>
    </main>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "sans-serif",
  },
  h1: { fontSize: "2rem", fontWeight: 700 },
  btn: {
    padding: "0.8rem 2.4rem",
    fontSize: "1rem",
    fontWeight: 600,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};
