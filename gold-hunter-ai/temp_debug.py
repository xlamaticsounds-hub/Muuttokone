import requests
from bs4 import BeautifulSoup

url = 'https://www.tori.fi/koko_suomi?q=kulta&page=1'
print('Fetching', url)
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=20)
print('Status', r.status_code)
soup = BeautifulSoup(r.text, 'html.parser')
links = [a.get('href') for a in soup.select('a') if a.get('href')]
print('a tags', len(links))
listing = [h for h in links if '/ilmoitus/' in h or '/ilmoitus' in h]
print('cand', len(listing))
print(listing[:10])
