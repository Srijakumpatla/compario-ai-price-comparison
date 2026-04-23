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

def scrape_amazon(query):
    options = Options()
    options.add_argument("--disable-blink-features=AutomationControlled")

    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )

    url = f"https://www.amazon.in/s?k={query.replace(' ', '+')}"
    driver.get(url)
    time.sleep(4)

    products = driver.find_elements(
        By.CSS_SELECTOR,
        "div[data-component-type='s-search-result']"
    )

    best = None

    for p in products:
        try:
            title = p.find_element(By.TAG_NAME, "h2").text
            if is_accessory(title):
                continue

            price_whole = p.find_elements(By.CLASS_NAME, "a-price-whole")
            if not price_whole:
                continue

            price = int(price_whole[0].text.replace(",", ""))

            if best is None or price < best["price_inr"]:
                best = {
                    "title": title,
                    "price_raw": price,
                    "price_currency": "INR",
                    "price_inr": price,
                    "link": p.find_element(By.TAG_NAME, "a").get_attribute("href"),
                    "store": "Amazon"
                }
        except:
            continue

    driver.quit()
    return best