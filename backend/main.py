# main.py (FastAPI 백엔드 + 쿠키 기반 크롤링 + 정적 JSON 저장)

import os
import re
import json
import requests
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from bs4 import BeautifulSoup
from datetime import datetime
from fastapi.staticfiles import StaticFiles
app.mount("/static", StaticFiles(directory="static"), name="static")

app = FastAPI()

# CORS 허용 (Netlify에서 호출 가능하도록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 저장 경로
STATIC_DIR = "static"
os.makedirs(STATIC_DIR, exist_ok=True)

@app.post("/api/upload")
async def upload_campaigns(req: Request):
    data = await req.json()
    session_cookie = data.get("session_cookie")
    site = data.get("site")  # dbg or gtog

    if not session_cookie or site not in ("dbg", "gtog"):
        return JSONResponse(status_code=400, content={"error": "Invalid input"})

    try:
        html = fetch_campaign_html(session_cookie, site)
        rows = parse_campaigns(html, site)

        out_file = os.path.join(STATIC_DIR, f"public_campaigns{'' if site == 'dbg' else '_gtog'}.json")
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)

        return {"status": "success", "count": len(rows)}

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

    for item in soup.select("div.review_item"):
        try:
            csq = item["data-csq"]
            dt = datetime.strptime(item["data-time"], "%Y-%m-%d %H:%M:%S")
            time_fmt = f"{dt:%m}월 {dt:%d}일 {dt:%H}시 {dt:%M}분"

            title = item.select_one("p").get_text(strip=True)
            typ = item.select_one(".type_box").get_text(strip=True)

            price_raw = item.select_one("span.h6").get_text(" ", strip=True)
            price = re.search(r"[\d,]+원", price_raw).group(0) if price_raw else ""

            mall = item.select_one(".store span.text-black").get_text(strip=True)

            matches = re.findall(r"(\d+\s*/\s*\d+)명", item.get_text())
            today = matches[0].replace(" ", "") if matches else ""
            total = matches[1].replace(" ", "") if len(matches) > 1 else ""
            review = f"오늘 {today}, 전체 {total}" if total else f"오늘 {today}"

            join_pt = item.select_one(".join_point_box")
            point_box = item.select_one(".point_box")
            point = ""
            if join_pt:
                point = join_pt.get_text(strip=True).lstrip("+ ").replace(" ", "")
            elif point_box:
                point = point_box.get_text(strip=True).lstrip("+ ").replace(" ", "")

            rows.append({
                "csq": csq,
                "title": title,
                "review": review,
                "mall": mall,
                "price": price,
                "point": point,
                "type": typ,
                "participation_time": time_fmt,
                "url": base_url + csq
            })
        except Exception:
            continue

    return rows
