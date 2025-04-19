# main.py (FastAPI + HTML 업로드 기반 크롤링)

import os
import re
import json
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from bs4 import BeautifulSoup
from datetime import datetime

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)

@app.post("/api/upload-html")
async def upload_html(file: UploadFile = File(...), site: str = Form(...)):
    try:
        html = (await file.read()).decode("utf-8")
        rows = parse_campaigns(html, site)

        out_file = os.path.join(STATIC_DIR, f"public_campaigns{'' if site == 'dbg' else '_gtog'}.json")
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)

        return {"status": "success", "count": len(rows)}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

def parse_campaigns(html: str, site: str):
    soup = BeautifulSoup(html, "lxml")
    rows = []
    base_url = f"https://{site}.shopreview.co.kr/usr/campaign_detail?csq="

    items = soup.select("div.review_item")

    for item in items:
        try:
            csq = item.get("data-csq")
            raw_time = item.get("data-time")
            dt = datetime.strptime(raw_time, "%Y-%m-%d %H:%M:%S")
            time_fmt = f"{dt:%m}월 {dt:%d}일 {dt:%H}시 {dt:%M}분"

            title_tag = item.select_one("p span.ctooltip")
            title = title_tag.get_text(strip=True) if title_tag else ""
            keyword_hint = title[:15]
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
