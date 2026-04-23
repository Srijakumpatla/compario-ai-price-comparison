import requests

url = "https://bestbuy-product-data-api.p.rapidapi.com/bestbuy/"
params = {"page": "1", "keyword": "printer"}   # try same keyword as your app
headers = {
    "x-rapidapi-key": "e409981999mshc5c96a7ea48b0ccp1186fcjsn70a354bb85eb",
    "x-rapidapi-host": "bestbuy-product-data-api.p.rapidapi.com",
}

resp = requests.get(url, headers=headers, params=params, timeout=10, verify=False)
print("Status:", resp.status_code)
print("Body:", resp.text[:500])