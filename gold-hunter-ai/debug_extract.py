import requests
from gold_bot import _extract_items_from_search_html, fetch_listing_details, extract_info

url = 'https://www.tori.fi/recommerce/forsale/search?q=kulta&page=1'
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=20)
items = _extract_items_from_search_html(r.text)
print('items count', len(items))
print(items[:5])

if items:
    first = items[0]
    url = first['url']
    print('first url', url)
    title, price, text = fetch_listing_details(url)
    print('title', title)
    print('price', price)
    m = extract_info(text)
    print('extract_info', m)
