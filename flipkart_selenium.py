from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
import time

ACCESSORY_KEYWORDS = [
    "ribbon", "cartridge", "ink", "toner", "refill",
    "cable", "wire", "stand", "holder", "cover",
    "case", "spare", "replacement", "plastic"
]

def is_accessory(title):
    title = title.lower()
    return any(w in title for w in ACCESSORY_KEYWORDS)

def scrape_flipkart(query):
    options = Options()
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )

    url = f"https://www.flipkart.com/search?q={query.replace(' ', '%20')}"
    driver.get(url)
    time.sleep(4)

    products = driver.find_elements(By.CSS_SELECTOR, "div._1AtVbE")
    best = None

    for p in products:
        try:
            title = p.find_element(By.CSS_SELECTOR, "a.s1Q9rs, div._4rR01T").text
            if is_accessory(title):
                continue

            price = p.find_element(By.CSS_SELECTOR, "div._30jeq3").text
            price = int(price.replace("₹", "").replace(",", ""))

            if best is None or price < best["price_inr"]:
                best = {
                    "title": title,
                    "price_raw": price,
                    "price_currency": "INR",
                    "price_inr": price,
                    "link": p.find_element(By.TAG_NAME, "a").get_attribute("href"),
                    "store": "Flipkart"
                }
        except:
            continue

    driver.quit()
    return best