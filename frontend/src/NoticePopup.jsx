import { useEffect, useState } from "react";

export default function NoticePopup() {
  const [notice, setNotice] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/notice.json")
      .then((r) => r.json())
      .then((d) => {
        const dismissed = localStorage.getItem(`notice_${d.id}`);
        setNotice(d);
        setVisible(!dismissed);
      })
      .catch(() => {});
  }, []);

  const close = () => {
    if (notice?.id) localStorage.setItem(`notice_${notice.id}`, "1");
    setVisible(false);
  };

  if (!visible || !notice) return null;

  return (
    <div style={wrap}>
      <div style={box}>
        <h3>📢 공지</h3>
        <p>{notice.message}</p>
        <button onClick={close}>닫기</button>
      </div>
    </div>
  );
}

const wrap = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,.3)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};
const box = {
  background: "#fff",
  padding: "1.5rem 2rem",
  borderRadius: 8,
  maxWidth: 400,
  textAlign: "center",
};
