import os
import re
import json
import requests
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from bs4 import BeautifulSoup
from datetime import datetime

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 저장 경로
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)

@app.post("/api/upload")
async def upload_campaigns(req: Request):
    data = await req.json()
    session_cookie = data.get("session_cookie")
    site = data.get("site")

    if not session_cookie or site not in ("dbg", "gtog"):
        return JSONResponse(status_code=400, content={"error": "Invalid input"})

    try:
        html = fetch_campaign_html(session_cookie, site)

        # ✅ 1. 디버깅을 위한 HTML 반환만 하고 싶다면 아래 줄 사용 (나머지 코드 생략됨)
        return JSONResponse(content={"html": html[:2000]})

        # ✅ 2. 또는 아래 코드까지 실행하고 싶다면 이 줄을 '주석 처리'
        # with open(...)...
        # rows = parse_campaigns(...)
        # return {"status": "success", ...}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

def fetch_campaign_html(phpsessid: str, site: str) -> str:
    url = f"https://{site}.shopreview.co.kr/usr"
    session = requests.Session()
    session.cookies.set("PHPSESSID", phpsessid)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
        "Referer": url
    }
    resp = session.get(url, headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.text


def parse_campaigns(html: str, site: str):
    soup = BeautifulSoup(html, "lxml")
    rows = []
    base_url = f"https://{site}.shopreview.co.kr/usr/campaign_detail?csq="

    items = soup.select("div.review_item")
    print(f"🔍 리뷰 아이템 수: {len(items)}")  # 디버깅용

    for item in items:
        try:
            csq = item.get("data-csq")
            raw_time = item.get("data-time")
            dt = datetime.strptime(raw_time, "%Y-%m-%d %H:%M:%S")
            time_fmt = f"{dt:%m}월 {dt:%d}일 {dt:%H}시 {dt:%M}분"

            title_tag = item.select_one("p span.ctooltip")
            title = title_tag.get_text(strip=True) if title_tag else ""
            keyword_hint = title[:10]
            typ = item.select_one(".type_box").get_text(strip=True)

            point = ""
            if item.select_one(".join_point_box"):
                point = item.select_one(".join_point_box").get_text(strip=True).lstrip("+ ").replace(" ", "")
            elif item.select_one(".point_box"):
                point = item.select_one(".point_box").get_text(strip=True).lstrip("+ ").replace(" ", "")

            price_text = item.select_one("span.h6").get_text(" ", strip=True)
            price_match = re.search(r"[\d,]+원", price_text)
            price = price_match.group(0) if price_match else ""

            mall = item.select_one(".store span.text-black")
            mall = mall.get_text(strip=True) if mall else ""

            review_boxes = item.select("div.row > div.col-6 div:nth-of-type(2)")
            review_today = re.search(r"\d+\s*/\s*\d+", review_boxes[0].get_text(strip=True)) if len(review_boxes) > 0 else None
            review_total = re.search(r"\d+\s*/\s*\d+", review_boxes[1].get_text(strip=True)) if len(review_boxes) > 1 else None

            review = ""
            if review_today:
                review += f"오늘 {review_today.group(0).replace(' ', '')}"
            if review_total:
                review += f", 전체 {review_total.group(0).replace(' ', '')}"

            rows.append({
                "csq": csq,
                "title": title,
                "review": review,
                "mall": mall,
                "price": price,
                "point": point,
                "type": typ,
                "participation_time": time_fmt,
                "url": base_url + csq,
                "keyword": keyword_hint
            })

        except Exception:
            continue

    return rows
