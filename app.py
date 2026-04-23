import os, re, io, time, traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
from dotenv import load_dotenv

import requests
from transformers import ViTFeatureExtractor, ViTForImageClassification
from PIL import Image
import torch

# ---------------- ENV ----------------
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_WALMART_KEY = os.getenv("RAPIDAPI_WALMART_KEY")
RAPIDAPI_FLIPKART_KEY = os.getenv("RAPIDAPI_FLIPKART_KEY")

RAPIDAPI_AMAZON_HOST = "real-time-amazon-data.p.rapidapi.com"
RAPIDAPI_WALMART_HOST = "realtime-walmart-data.p.rapidapi.com"
RAPIDAPI_FLIPKART_HOST = "real-time-flipkart-data2.p.rapidapi.com"

# ---------------- APP ----------------
app = Flask(__name__)
CORS(app, supports_credentials=True)

client = MongoClient(MONGO_URI)
db = client.get_default_database()
users_coll = db["users"]

# ---------------- IMAGE MODEL ----------------
feature_extractor = ViTFeatureExtractor.from_pretrained(
    "google/vit-base-patch16-224"
)
model = ViTForImageClassification.from_pretrained(
    "google/vit-base-patch16-224"
)

# ---------------- HELPERS ----------------
_EX_RATE = {"rate": None, "ts": 0}

def usd_to_inr():
    if _EX_RATE["rate"] and time.time() - _EX_RATE["ts"] < 3600:
        return _EX_RATE["rate"]
    try:
        r = requests.get(
            "https://api.exchangerate.host/latest?base=USD&symbols=INR",
            timeout=6
        )
        rate = float(r.json()["rates"]["INR"])
        _EX_RATE.update({"rate": rate, "ts": time.time()})
        return rate
    except:
        return 83.0

def parse_price(val):
    if val is None:
        return None, None
    if isinstance(val, (int, float)):
        return float(val), "USD"
    val = str(val)
    if "₹" in val:
        return float(val.replace("₹", "").replace(",", "")), "INR"
    if "$" in val:
        return float(val.replace("$", "").replace(",", "")), "USD"
    try:
        return float(val), "USD"
    except:
        return None, None

def to_inr(amount, currency):
    if currency == "INR":
        return round(amount, 2)
    return round(amount * usd_to_inr(), 2)

def pick_lowest(items):
    return min(items, key=lambda x: x["price_inr"]) if items else None

# ---------------- NORMALIZATION + RELEVANCE ----------------
EXCLUDE_KEYWORDS = {
    "mouse": ["pad", "mat", "cover", "skin", "sticker", "protector"],
    "keyboard": ["cover", "skin"],
    "laptop": ["cover", "skin", "bag", "case"],
}

def normalize_label(label: str) -> str:
    label = label.lower()
    if "mouse" in label:
        return "mouse"
    if "keyboard" in label:
        return "keyboard"
    if "laptop" in label or "notebook" in label:
        return "laptop"
    return label.split(",")[0].strip()

def is_relevant_product(title: str, base_label: str) -> bool:
    if not title:
        return False
    title = title.lower()

    # must contain the main product keyword
    if base_label not in title:
        return False

    # exclude accessories
    for bad in EXCLUDE_KEYWORDS.get(base_label, []):
        if bad in title:
            return False

    return True

# ---------------- AUTH ----------------
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    user = users_coll.find_one({"email": data["email"]})
    if not user or not check_password_hash(user["password"], data["password"]):
        return jsonify({"message": "Invalid credentials"}), 400
    return jsonify({
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"]
        }
    })

@app.route("/api/change-password", methods=["POST"])
def change_password():
    data = request.json
    user = users_coll.find_one({"email": data["email"]})
    if not user or not check_password_hash(user["password"], data["currentPassword"]):
        return jsonify({"message": "Wrong password"}), 400
    users_coll.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": generate_password_hash(data["newPassword"])}}
    )
    return jsonify({"message": "Password updated"})

# ---------------- IMAGE CLASSIFY ----------------
@app.route("/api/classify-image", methods=["POST"])
def classify():
    img = Image.open(request.files["file"]).convert("RGB")
    inputs = feature_extractor(images=img, return_tensors="pt")
    with torch.no_grad():
        out = model(**inputs)
    idx = out.logits.argmax(-1).item()
    return jsonify({"label": model.config.id2label[idx]})

# ---------------- PRICE COMPARE ----------------
@app.route("/api/compare-prices", methods=["POST"])
def compare_prices():
    try:
        raw_label = (request.json.get("product_name") or "").strip()
        if not raw_label:
            return jsonify({"error": "product_name required"}), 400

        base_label = normalize_label(raw_label)

        results = {"amazon": [], "walmart": [], "flipkart": []}

        # ================= AMAZON =================
        try:
            r = requests.get(
                "https://real-time-amazon-data.p.rapidapi.com/search",
                headers={
                    "x-rapidapi-key": RAPIDAPI_KEY,
                    "x-rapidapi-host": RAPIDAPI_AMAZON_HOST,
                },
                params={"query": base_label, "page": 1, "country": "IN"},
                timeout=15,
            )

            products = r.json().get("data", {}).get("products", [])

            for p in products:
                title = p.get("product_title")
                if not is_relevant_product(title, base_label):
                    continue

                price_raw = (
                    p.get("product_minimum_offer_price")
                    or p.get("product_price")
                    or p.get("product_original_price")
                )

                amount, currency = parse_price(price_raw)
                if not amount:
                    continue

                results["amazon"].append({
                    "title": title,
                    "link": p.get("product_url"),
                    "rating": p.get("product_star_rating"),
                    "num_ratings": p.get("product_num_ratings"),
                    "delivery": p.get("delivery"),
                    "price_inr": to_inr(amount, currency),
                })

        except Exception:
            print("AMAZON ERROR:", traceback.format_exc())

        # ================= WALMART =================
        try:
            r = requests.get(
                "https://realtime-walmart-data.p.rapidapi.com/search",
                headers={
                    "x-rapidapi-key": RAPIDAPI_WALMART_KEY,
                    "x-rapidapi-host": RAPIDAPI_WALMART_HOST,
                },
                params={"keyword": base_label, "page": 1},
                timeout=15,
            )

            products = r.json().get("results", [])

            for p in products:
                title = p.get("name")
                if not is_relevant_product(title, base_label):
                    continue

                raw = p.get("price")
                if isinstance(raw, dict):
                    amount = raw.get("price")
                    currency = raw.get("currency", "USD")
                else:
                    amount, currency = parse_price(raw)

                if not amount:
                    continue

                results["walmart"].append({
                    "title": title,
                    "link": p.get("canonicalUrl"),
                    "rating": p.get("averageRating"),
                    "num_ratings": p.get("numberOfReviews"),
                    "delivery": p.get("availabilityStatus"),
                    "price_inr": to_inr(float(amount), currency),
                })

        except Exception:
            print("WALMART ERROR:", traceback.format_exc())

        # ================= FLIPKART =================
        try:
            r = requests.get(
                "https://real-time-flipkart-data2.p.rapidapi.com/product-search",
                headers={
                    "x-rapidapi-key": RAPIDAPI_FLIPKART_KEY,
                    "x-rapidapi-host": RAPIDAPI_FLIPKART_HOST,
                },
                params={"q": base_label, "page": 1},
                timeout=15,
            )

            for p in r.json().get("products", []):
                title = p.get("title")
                if not is_relevant_product(title, base_label):
                    continue

                amount, _ = parse_price(p.get("price"))
                if not amount:
                    continue

                results["flipkart"].append({
                    "title": title,
                    "link": p.get("url"),
                    "rating": p.get("rating"),
                    "num_ratings": p.get("rating_count"),
                    "delivery": p.get("delivery"),
                    "price_inr": round(amount, 2),
                })

        except Exception:
            print("FLIPKART ERROR:", traceback.format_exc())

        # ================= LOWEST & BEST =================
        lowest_per_site = {
            site: pick_lowest(items)
            for site, items in results.items()
        }

        candidates = [v for v in lowest_per_site.values() if v]
        best_deal = min(candidates, key=lambda x: x["price_inr"]) if candidates else None

        return jsonify({
            "site_results": results,
            "lowest_per_site": lowest_per_site,
            "best_deal": best_deal,
        })

    except Exception:
        print("COMPARE ERROR:", traceback.format_exc())
        return jsonify({"error": "Server error"}), 500

# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(port=5001, debug=True)