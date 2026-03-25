import requests
import re

url = 'https://www.tori.fi/recommerce/forsale/search?q=kulta'
print('fetching', url)
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=20)
print('status', r.status_code)
text = r.text

# Find all script blocks and locate any that include ItemList
script_blocks = re.findall(r'<script[^>]*>(.*?)</script>', text, re.S)
print('script blocks:', len(script_blocks))
for idx, block in enumerate(script_blocks):
    if 'ItemList' in block and 'offers' in block:
        print('--- script block', idx, 'contains ItemList/offer ---')
        snippet = block
        # show a short excerpt
        start = snippet.find('ItemList')
        print(snippet[start:start+800].replace('\n',' ')[0:800])
        break

# find embedded JSON-like state or initial data
m = re.search(r'(window\.[A-Za-z0-9_]+\s*=\s*\{)', text)
print('window var snippet:', m.group(1) if m else 'none')

# Search for keywords that could indicate listing data (items, ads, listings)
for keyword in ['"items"', '"listings"', '"ads"', '"offers"', '"sales"']:
    idx = text.find(keyword)
    if idx != -1:
        start = max(0, idx - 200)
        end = min(len(text), idx + 200)
        snippet = text[start:end].replace('\n', ' ')
        print(f"\n-- context for {keyword} --")
        print(snippet[:500])
