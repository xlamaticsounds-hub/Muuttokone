import requests
import re

url = 'https://www.tori.fi/bap/forsale/search.html'
print('fetching', url)
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=20)
print('status', r.status_code)
text = r.text
print('len', len(text))

keywords = ['window.__', 'dataLayer', 'initial', 'state', 'config', 'endpoint', 'search', 'api', 'graphql']
for kw in keywords:
    if kw in text:
        print('contains', kw)

match = re.search(r'window\.[^=]{1,80}=\s*\{', text)
print('window object snippet:', match.group(0) if match else 'none')

# Scan for URL-like strings that mention 'api', 'search', or 'v1'
found = []
for m in re.finditer(r'https?://[^"\s]{10,200}', text):
    s = m.group(0)
    if any(k in s for k in ('api', 'search', 'v1', 'ads', 'forsale', 'bap')):
        found.append(s)

print('possible URLs found:', len(found))
for u in found[:20]:
    print(' ', u)
