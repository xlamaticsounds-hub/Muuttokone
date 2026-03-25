"""Gold Hunter Bot

Automatisoitu CLI-botti, joka skannaa "Tori.fi" -ilmoituksia, etsii kulta- ja
hopeadiilejä, laskee spot-hinnan perusteella tarjouksen ja potentiaalisen voiton,
ja ilmoittaa löydöksistä Discord-webhookilla.

Tämän botin logiikka on suunniteltu testattavaksi paikallisesti ja se ei tee
mitään toimia, jotka rikkovat markkinapaikkojen sääntöjä (ei ostoja, ei lomakkeiden
lähetyksiä, ei kirjautumisia).

Käyttö:
    python gold_bot.py --webhook <WEBHOOK_URL>

Ympäristömuuttujat (vapaaehtoisia):
    DISCORD_WEBHOOK_URL   Discord-webhook osoite
    METALS_API_KEY        (valinnainen) Metals API -avain spot-hintojen hakemiseen
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

import requests
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Konfiguraatio
# ---------------------------------------------------------------------------

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
)

# Pienin voitto euroissa, jotta ilmoitus lähetetään Discordiin / tulostetaan
DEFAULT_MIN_PROFIT_EUR = 20.0

# Jos webook ei ole annettu, käytetään tätä oletusta.
DEFAULT_DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1483275207765393540/GnmRf8oe9Drlhx9DE7CPssZ9GLbOyvU5J2Ixy3B9HJn24QcvICJ2UJrSSn3CjBjxMDNi"

# Käytämme spot-hintaa per gramma. Jos API ei toimi, käytetään fallback-arvoa
# 14K kullalle.
FALLBACK_SPOT_PRICE_14K_EUR_PER_G = 60.0

# Tiedosto, jossa pidetään kirjaa jo käsitellyistä URL:eista. Näin botin voi ajaa
# jatkuvasti ilman, että se ilmoittaa samoista diileistä uudestaan.
SEEN_URLS_PATH = "seen_urls.json"

# Käytetään tekstin skannauksessa näitä avainsanoja
GOLD_KEYWORDS = ["kulta", "gold", "kultar", "18k", "14k", "585", "750", "9k"]
SILVER_KEYWORDS = ["hopea", "silver", "925", "830"]

# Oletushakulauseet, joita käytetään jos ei anneta --query.
DEFAULT_QUERIES = [
    "kulta",
    "hopea",
    "kultaharkko",
    "kultarahat",
    "kullan hinta",
    "kulta spot-hinta",
    "puhdas kulta",
    "24 karaatin kulta",
    "Flippaus & kaupankäynti",
    "kullan ostaminen",
    "kullan myyminen",
    "kultakauppa",
    "kultasijoittaminen",
    "kullan nopea myynti",
    "kulta-arbitraasi",
    "kultaflippaus",
    "kultamarkkinat",
    "kultahintojen seuranta",
    "Sijoitus ja talous",
    "sijoituskulta",
    "kultapörssi",
    "kultafutuurit",
    "turvasijoitus kulta",
    "kullan arvo euroissa",
    "kullan kurssikehitys",
    "Kaivos ja fyysinen kulta",
    "kultakaivos",
    "kultalouhinta",
    "kultamalmi",
    "kultajyvä",
    "kullan paino ja puhtaus",
    "Korut ja keräily",
    "kultakoru",
    "kultaketju",
    "kultasormus",
    "kultariipus",
    "keräilykulta",
    # Hopea
    "hopea",
    "hopeakoru",
    "hopeaketju",
    "hopearaha",
    "hopeakorut",
    "hopeasormus",
]


# ---------------------------------------------------------------------------
# Datatyyppi
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Deal:
    title: str
    url: str
    price_eur: Optional[float]
    metal: str
    karat: Optional[float]
    weight_g: Optional[float]
    spot_price_per_g: Optional[float]
    offer_eur: Optional[float]
    profit_eur: Optional[float]
    source_text: str


# ---------------------------------------------------------------------------
# Apufunktiot
# ---------------------------------------------------------------------------

def _safe_get(url: str, **kwargs: Any) -> Optional[requests.Response]:
    """Lataa sivusisältö ja palauttaa vastausobjektin tai None virheessä."""

    headers = kwargs.pop("headers", {})
    headers.setdefault("User-Agent", DEFAULT_USER_AGENT)

    try:
        r = requests.get(url, headers=headers, timeout=15, **kwargs)
        r.raise_for_status()
        return r
    except requests.RequestException as e:
        # Debug: print error to help diagnose scraping issues
        print(f"[DEBUG] request failed: {e}")
        return None


def _parse_float_from_text(raw: str) -> Optional[float]:
    """Etsii ensimmäisen kelvollisen float-arvon tekstistä."""

    if not raw:
        return None

    # Korvaa pilkku desimaalierottimena sekä mahdolliset tuhaterottimet.
    raw = raw.replace("\u202f", "")  # non-breaking space
    raw = raw.replace("\xa0", "")
    raw = raw.replace(" ", "")
    raw = raw.replace(",", ".")

    match = re.search(r"([0-9]+(?:\.[0-9]+)?)", raw)
    if not match:
        return None

    try:
        return float(match.group(1))
    except ValueError:
        return None


def _parse_price_from_text(raw: str) -> Optional[float]:
    """Etsii hinnan (euroissa) tekstistä. Palauttaa None jos ei löydy."""

    if not raw:
        return None

    # Etsi merkintöjä kuten "120 €", "120e", "120euro", "120,00 €"
    match = re.search(r"([0-9][0-9\s\.,]*)\s*(?:€|eur|euro)\b", raw, flags=re.I)
    if not match:
        # Jos hinta on esimerkiksi "120" (ilmoitettu ilman yksikköä), hyväksytään
        # toki vain jos sivulta löytyy vahva indikointi, mutta listauksesta ei.
        return None

    return _parse_float_from_text(match.group(1))


def _normalize_url(href: str) -> Optional[str]:
    """Kasvattaa href:n täydelliseksi URLiksi Tori.fi:hin."""

    if not href:
        return None

    href = href.strip()
    if href.startswith("//"):
        href = "https:" + href
    if href.startswith("/"):
        href = "https://www.tori.fi" + href

    if href.startswith("http"):
        return href

    return None


def _extract_items_from_search_html(html: str) -> List[Dict[str, Any]]:
    """Etsii sivulta schema.org ItemList -datan ja palauttaa listan ilmoituksia."""

    # Etsi <script> -lohko, jossa on ItemList (schema.org).
    # Se näkyy esim. "@type":"ItemList" ja sisältää itemListElement-matriisin.
    scripts = re.findall(r"<script[^>]*>(.*?)</script>", html, flags=re.S)
    for block in scripts:
        if '@type":"ItemList' not in block:
            continue

        # Yritetään rajata JSON-objekti alkavasta '{' -merkistä ja tasapainottaa
        start = block.find("{")
        if start == -1:
            continue
        depth = 0
        end = None
        for i, ch in enumerate(block[start:], start=start):
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        if end is None:
            continue

        json_text = block[start:end]
        try:
            data = json.loads(json_text)
        except Exception:
            continue

        # Etsi ItemList-objekti, joka sisältää itemListElementin.
        def find_itemlist(obj: Any) -> Optional[dict]:
            if isinstance(obj, dict):
                if obj.get("@type") == "ItemList":
                    return obj
                for v in obj.values():
                    found = find_itemlist(v)
                    if found:
                        return found
            elif isinstance(obj, list):
                for v in obj:
                    found = find_itemlist(v)
                    if found:
                        return found
            return None

        itemlist = find_itemlist(data)
        if not itemlist:
            continue

        items = []
        for el in itemlist.get("itemListElement", []):
            item = el.get("item") if isinstance(el, dict) else None
            if not isinstance(item, dict):
                continue
            url = item.get("url")
            if not url:
                continue
            price = None
            offers = item.get("offers") or {}
            if isinstance(offers, dict):
                price_raw = offers.get("price")
                try:
                    price = float(price_raw)
                except Exception:
                    price = None
            items.append(
                {
                    "url": url,
                    "title": item.get("name") or item.get("description"),
                    "price": price,
                }
            )
        if items:
            return items

    return []


# ---------------------------------------------------------------------------
# Ilmoituksen tietojen purku
# ---------------------------------------------------------------------------

def extract_info(text: str) -> Tuple[Optional[str], Optional[float], Optional[float]]:
    """Etsii tekstistä metallin, karaatin ja painon.

    Palauttaa (metal, karat, weight_g). Jos arvoja ei löydy, palauttaa None-osuuden.
    """

    if not text:
        return None, None, None

    normalized = text.lower().replace("\u00a0", " ")

    # Etsi paino (grammat)
    weight = None
    # Esim. "3,5 g", "3.5g", "3 g"
    weight_match = re.search(r"([0-9]+(?:[\.,][0-9]+)?)\s*(g|gr|gramm)\b", normalized)
    if weight_match:
        weight = _parse_float_from_text(weight_match.group(1))

    # Etsi karaatit / puhtausaste
    karat = None
    metal = None

    # Etsi 14k/18k/9k jne.
    karat_match = re.search(r"\b([0-9]{1,2})\s*k\b", normalized)
    if karat_match:
        karat = _parse_float_from_text(karat_match.group(1))
        metal = "gold"

    # Etsi 585/750/925 yms.
    quality_match = re.search(r"\b(585|750|925|830|999|333|417)\b", normalized)
    if quality_match and karat is None:
        val = int(quality_match.group(1))
        if val in (925, 830):
            metal = "silver"
            karat = 999.0  # emme käytä karaattia hopeassa, mutta merkitään.
        else:
            metal = "gold"
            # Muunna 585 -> 14k (n. 14/24*24) - säilytetään autenttinen arvo
            # Jos halutaan tarkka karat, voidaan laskea 24 * (val / 1000).
            karat = (val / 1000.0) * 24.0

    # Lisätesti, jotta löydämme hopea-sanat vaikka laatumerkintää ei ole
    if not metal:
        if any(k in normalized for k in GOLD_KEYWORDS):
            metal = "gold"
        elif any(k in normalized for k in SILVER_KEYWORDS):
            metal = "silver"

    return metal, karat, weight


# ---------------------------------------------------------------------------
# Spot-hinnan hakeminen
# ---------------------------------------------------------------------------

def get_spot_price_per_gram(
    metal: str,
    karat: Optional[float] = None,
    api_key: Optional[str] = None,
    currency: str = "EUR",
) -> Tuple[float, str]:
    """Hakee spot-hinnan €/g ja kertoo, mistä se haettiin.

    Palauttaa (spot_price_per_g, source).
    Source voi olla "metals.live", "metals-api.com" tai "fallback".

    Jos API ei toimi, laskee hintan fallback-arvolla.
    """

    # Jos karat-määrä ei ole saatavilla, palauta fallback 14k (se on useimmin myyty)
    if karat is None:
        karat = 14.0

    # Yritä hakea spot-hintaa netistä. Ensisijaisesti käytetään metals.live -endpointia, joka ei vaadi avainta.
    try:
        url = "https://api.metals.live/v1/spot"
        r = _safe_get(url)
        if r is not None:
            data = r.json()
            # Etsi JSON-tuotteista kulta ja hopea.
            for item in data:
                if not isinstance(item, dict):
                    continue
                key = item.get("metal") or item.get("name")
                if not key:
                    continue
                key = key.lower()
                if metal == "gold" and "gold" in key:
                    # data esimerkki: {"metal":"gold","price":1934.21}
                    spot_oz = float(item.get("price"))
                    # metalli on per troy ounce (31.1034768 g)
                    spot_per_g = spot_oz / 31.1034768
                    # nivelöi karatin mukaan (14k jne.)
                    return spot_per_g * (karat / 24.0), "metals.live"
                if metal == "silver" and "silver" in key:
                    spot_oz = float(item.get("price"))
                    spot_per_g = spot_oz / 31.1034768
                    return spot_per_g, "metals.live"
    except Exception:
        pass

    # Jos metals.live ei toimi ja käyttäjä on antanut API-avaimen, yritetään käyttää vielä metals-api.com -serviceä.
    if api_key:
        try:
            # metals-api.com (requires API key)
            # Esimerkki: https://metals-api.com/
            url = f"https://metals-api.com/api/latest?access_key={api_key}&base=EUR&symbols=XAU,XAG"
            r = _safe_get(url)
            if r is not None:
                data = r.json()
                rates = data.get("rates") or {}
                if metal == "gold" and "XAU" in rates:
                    spot_oz = float(rates["XAU"])
                    spot_per_g = spot_oz / 31.1034768
                    return spot_per_g * (karat / 24.0), "metals-api.com"
                if metal == "silver" and "XAG" in rates:
                    spot_oz = float(rates["XAG"])
                    spot_per_g = spot_oz / 31.1034768
                    return spot_per_g, "metals-api.com"
        except Exception:
            pass

    # Fallback: 14K kullalle ~60 €/g. Lasketaan tästä 24K vastaava.
    if metal == "gold":
        base_24k = (FALLBACK_SPOT_PRICE_14K_EUR_PER_G * 24.0) / 14.0
        return base_24k * (karat / 24.0), "fallback"

    # Hopean fallback (toteutettu yksinkertaisesti)
    # Tämä on puhdas, luokittelematon arvio.
    return 0.7, "fallback"


def calculate_offer_and_profit(
    price_eur: Optional[float],
    weight_g: Optional[float],
    spot_price_per_g: Optional[float],
    offer_ratio: float = 0.7,
) -> Tuple[Optional[float], Optional[float]]:
    """Laskee tarjouksen ja voiton.

    Palauttaa (offer_eur, profit_eur). Jos laskentaan ei ole tarpeeksi tietoa,
    palauttaa (None, None).
    """

    if price_eur is None or weight_g is None or spot_price_per_g is None:
        return None, None

    offer = weight_g * spot_price_per_g * offer_ratio
    profit = price_eur - offer
    return offer, profit


def _evaluate_negotiation_opportunity(
    price_eur: Optional[float],
    spot_price_per_g: Optional[float],
    weight_g: Optional[float],
    min_profit_eur: float,
) -> Optional[str]:
    """Arvioi, onko listauksesta mahdollista neuvotella 10-20% alennusta ja silti tehdä voittoa.

    Palauttaa viestitekstin, jos tämä näyttää mahdolliselta, muuten None.
    """

    if price_eur is None or spot_price_per_g is None or weight_g is None:
        return None

    spot_value = spot_price_per_g * weight_g

    messages: List[str] = []

    for discount_pct in (0.10, 0.20):
        offer_price = price_eur * (1 - discount_pct)
        profit = spot_value - offer_price
        if profit >= min_profit_eur:
            messages.append(
                f"✅ Voisi tarjota {int(discount_pct*100)}% alle pyynnön ja silti voittoa (~{profit:.0f} €)."
            )

    if not messages:
        return None

    return "\n".join(messages) + f"\n(Spot-arvo arvioitu ~{spot_value:.2f} €)"


def _load_seen_urls(path: str) -> Set[str]:
    """Lataa tallennetut URL:t ja palauttaa setin."""

    p = Path(path)
    if not p.exists():
        return set()

    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return set(str(x) for x in data if x)
    except Exception:
        pass

    return set()


def _save_seen_urls(path: str, urls: Iterable[str]) -> None:
    """Tallentaa käsitellyt URL:t tiedostoon JSON-listana."""

    try:
        p = Path(path)
        p.write_text(json.dumps(sorted(set(urls)), ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass


def send_discord_webhook(
    webhook_url: str,
    content: str,
    username: str = "Gold Hunter Bot",
    avatar_url: Optional[str] = None,
) -> bool:
    """Lähettää Discord-webhook-viestin. Palauttaa True jos onnistui."""

    if not webhook_url:
        return False

    payload: Dict[str, Any] = {"content": content, "username": username}
    if avatar_url:
        payload["avatar_url"] = avatar_url

    try:
        r = requests.post(webhook_url, json=payload, timeout=10)
        r.raise_for_status()
        return True
    except requests.RequestException:
        return False


def notify_bot_stop(webhook_url: str, reason: str) -> None:
    """Ilmoittaa Discordiin, että botti lopetettiin."""

    if not webhook_url:
        return

    send_discord_webhook(
        webhook_url,
        f"⛔ Gold Hunter Bot pysäytettiin: {reason}",
    )


# ---------------------------------------------------------------------------
# Tori.fi -skannaus
# ---------------------------------------------------------------------------

def _extract_message_text_from_listing(soup: BeautifulSoup) -> str:
    """Rakentaa textikokonaisuuden ilmoituksesta, jota käytetään tunnistukseen."""

    # Yritä hakea otsikko ja kuvaus. Jos ei löydy, palauta koko teksti.
    parts: List[str] = []

    title = soup.find("h1")
    if title and title.text:
        parts.append(title.text.strip())

    # Tori.fi käyttää usein <div class="description"> tai <div id="description">
    desc = soup.find(class_=re.compile(r"description|desc"))
    if desc and desc.text:
        parts.append(desc.text.strip())

    # Fallback: ota koko sivun tekstisisältö
    if not parts:
        parts.append(soup.get_text(separator=" ", strip=True))

    return "\n".join(parts)


def fetch_listing_details(url: str) -> Tuple[str, Optional[float], str]:
    """Lataa ilmoituksen sivun ja palauttaa (title, price_eur, full_text)."""

    r = _safe_get(url)
    if r is None:
        return "", None, ""

    soup = BeautifulSoup(r.text, "html.parser")

    title = ""
    title_tag = soup.find("h1")
    if title_tag and title_tag.text:
        title = title_tag.text.strip()

    # Yritä löytää hinta sivulta
    price_eur = None
    price_candidates = soup.find_all(text=re.compile(r"[0-9]+[\s\.,]*[0-9]*\s*(€|eur|euro)", flags=re.I))
    for candidate in price_candidates:
        p = _parse_price_from_text(str(candidate))
        if p is not None and p > 0:
            price_eur = p
            break

    full_text = _extract_message_text_from_listing(soup)
    return title, price_eur, full_text


def scan_tori(
    query: str = "kulta",
    max_pages: int = 3,
    max_items: int = 20,
    min_profit_eur: float = DEFAULT_MIN_PROFIT_EUR,
    webhook_url: Optional[str] = None,
    metals_api_key: Optional[str] = None,
    seen_urls: Optional[Set[str]] = None,
) -> List[Deal]:
    """Skannaa Tori.fi:stä ja palauttaa listan kannattavista diileistä.

    Jos seen_urls annetaan, sitä käytetään suodattamaan uudelleen käsitellyt URL:t
    ja päivitetään käynnin aikana.
    """

    if seen_urls is None:
        seen_urls = set()

    found_deals: List[Deal] = []
    visited_urls = set(seen_urls)

    total_scanned = 0

    # Tori.fi-haku: käytetään rekonstrueitua hakupolkua, joka toimii nykyään
    # SPA:n kautta. Käytetään JSON-LD:ssä olevaa ItemList-dataa.
    # Esim. https://www.tori.fi/recommerce/forsale/search?q=kulta&page=1
    for page in range(1, max_pages + 1):
        search_url = (
            f"https://www.tori.fi/recommerce/forsale/search?q={requests.utils.quote(query)}&page={page}"
        )
        resp = _safe_get(search_url)
        print(f"[DEBUG] fetching: {search_url} -> {resp.status_code if resp else 'ERROR'}")
        if resp is None:
            break

        items = _extract_items_from_search_html(resp.text)
        print(f"[DEBUG] extracted items: {len(items)}")
        if not items:
            # Jos JSON-LD:stä ei löytynyt listauksia, yritetään perinteinen linkkihaku
            soup = BeautifulSoup(resp.text, "html.parser")
            items = []
            for a in soup.select("a"):
                href = a.get("href")
                if not href:
                    continue
                if "/ilmoitus/" in href or "/ilmoitus" in href or "/recommerce/forsale/item" in href:
                    normalized = _normalize_url(href)
                    if normalized and normalized not in visited_urls:
                        items.append({"url": normalized, "title": a.text.strip(), "price": None})

        # Skannaa jokainen löydetty ilmoitus
        for entry in items[: max_items - len(found_deals)]:
            url = entry.get("url")
            if not url:
                continue
            if url in visited_urls:
                continue
            visited_urls.add(url)

            seen_urls.add(url)
            total_scanned += 1

            title, price_eur, text = fetch_listing_details(url)
            # If the listing page didn't contain price, use price from search result metadata
            if price_eur is None:
                price_eur = entry.get("price")

            metal, karat, weight_g = extract_info(text)

            if metal is None or weight_g is None or karat is None:
                continue

            spot_price, spot_source = get_spot_price_per_gram(
                metal=metal, karat=karat, api_key=metals_api_key
            )
            offer_eur, profit_eur = calculate_offer_and_profit(
                price_eur, weight_g, spot_price
            )

            # Lähetetään ilmoitus, jos tästä voisi neuvotella 10-20% alle ja silti tulla voitolla.
            if webhook_url:
                negotiation = _evaluate_negotiation_opportunity(
                    price_eur, spot_price, weight_g, min_profit_eur
                )
                if negotiation:
                    send_discord_webhook(
                        webhook_url,
                        (
                            f"🤝 Neuvottelumahdollisuus: {title or '(ei otsikkoa)'}\n"
                            f"Link: {url}\n"
                            f"{negotiation}"
                        ),
                    )

            if profit_eur is None or profit_eur < min_profit_eur:
                continue

            deal = Deal(
                title=title or "(ei otsikkoa)",
                url=url,
                price_eur=price_eur,
                metal=metal,
                karat=karat,
                weight_g=weight_g,
                spot_price_per_g=spot_price,
                offer_eur=offer_eur,
                profit_eur=profit_eur,
                source_text=text,
            )

            found_deals.append(deal)

            message = (
                f"🚨 GOLD DEAL FOUND\n"
                f"Title: {deal.title}\n"
                f"Weight: {deal.weight_g:.2f}g\n"
                f"Karat: {deal.karat:.1f}\n"
                f"Spot price (per g): {deal.spot_price_per_g:.2f} €\n"
                f"Spot source: {spot_source}\n"
                f"Offer (70%): {deal.offer_eur:.2f} €\n"
                f"Potential profit: {deal.profit_eur:.2f} €\n"
                f"Link: {deal.url}"
            )

            print(message)

            if webhook_url:
                send_discord_webhook(webhook_url, message)

            if len(found_deals) >= max_items:
                break

        if len(found_deals) >= max_items:
            break

    if not found_deals:
        print("Ei sopivia diilejä löytynyt.")

    print(f"Skannattu ilmoituksia: {total_scanned}, löydetty diilejä: {len(found_deals)}")
    return found_deals


def scan_facebook_marketplace(
    query: str = "kulta",
    max_pages: int = 1,
    max_items: int = 20,
    min_profit_eur: float = DEFAULT_MIN_PROFIT_EUR,
    webhook_url: Optional[str] = None,
    seen_urls: Optional[Set[str]] = None,
) -> List[Deal]:
    """Skannaa Facebook Marketplacea (koko Suomi) ja ilmoittaa mahdollisista diileistä."""

    if seen_urls is None:
        seen_urls = set()

    found_deals: List[Deal] = []
    visited_urls = set(seen_urls)

    total_scanned = 0

    for page in range(1, max_pages + 1):
        search_url = (
            f"https://www.facebook.com/marketplace/finland/search?query={requests.utils.quote(query)}&page={page}"
        )
        resp = _safe_get(
            search_url,
            headers={"Accept-Language": "fi-FI,fi;q=0.9,en-US;q=0.8,en;q=0.7"},
        )
        print(f"[DEBUG] fetching (FB): {search_url} -> {resp.status_code if resp else 'ERROR'}")
        if resp is None:
            break

        soup = BeautifulSoup(resp.text, "html.parser")
        items = []
        for a in soup.select("a"):
            href = a.get("href")
            if not href:
                continue
            if "/marketplace/item/" not in href:
                continue

            url = _normalize_url(href)
            if not url:
                # FB links may be relative; prefix if needed
                if href.startswith("/"):
                    url = "https://www.facebook.com" + href

            if not url or url in visited_urls:
                continue

            visited_urls.add(url)
            items.append({"url": url, "title": a.get("aria-label") or a.get_text(strip=True), "price": None})

        for entry in items[: max_items - len(found_deals)]:
            url = entry.get("url")
            if not url:
                continue
            if url in seen_urls:
                continue
            seen_urls.add(url)
            total_scanned += 1

            title, price_eur, text = fetch_listing_details(url)
            if not title:
                title = entry.get("title") or ""

            if price_eur is None:
                price_eur = _parse_price_from_text(title)

            metal, karat, weight_g = extract_info((title or "") + "\n" + text)

            if metal and karat is not None and weight_g is not None and price_eur is not None:
                spot_price, spot_source = get_spot_price_per_gram(
                    metal=metal, karat=karat
                )
                offer_eur, profit_eur = calculate_offer_and_profit(
                    price_eur, weight_g, spot_price
                )

                if webhook_url:
                    negotiation = _evaluate_negotiation_opportunity(
                        price_eur, spot_price, weight_g, min_profit_eur
                    )
                    if negotiation:
                        send_discord_webhook(
                            webhook_url,
                            (
                                f"🤝 FB-neuvottelumahdollisuus: {title or '(ei otsikkoa)'}\n"
                                f"Link: {url}\n"
                                f"{negotiation}"
                            ),
                        )

                if profit_eur is not None and profit_eur >= min_profit_eur:
                    deal = Deal(
                        title=title or "(ei otsikkoa)",
                        url=url,
                        price_eur=price_eur,
                        metal=metal,
                        karat=karat,
                        weight_g=weight_g,
                        spot_price_per_g=spot_price,
                        offer_eur=offer_eur,
                        profit_eur=profit_eur,
                        source_text=text,
                    )
                    found_deals.append(deal)

                    message = (
                        f"🚨 FB GOLD/HOPEA DEAL FOUND\n"
                        f"Title: {deal.title}\n"
                        f"Weight: {deal.weight_g:.2f}g\n"
                        f"Karat: {deal.karat:.1f}\n"
                        f"Spot price (per g): {deal.spot_price_per_g:.2f} €\n"
                        f"Spot source: {spot_source}\n"
                        f"Offer (70%): {deal.offer_eur:.2f} €\n"
                        f"Potential profit: {deal.profit_eur:.2f} €\n"
                        f"Link: {deal.url}"
                    )
                    print(message)
                    if webhook_url:
                        send_discord_webhook(webhook_url, message)

            else:
                # Lähetä ilmoitus mahdollisesta listauksesta, vaikka emme osaa laskea voittoa.
                if any(k in (title or "").lower() for k in GOLD_KEYWORDS + SILVER_KEYWORDS):
                    fallback_message = (
                        f"🔎 FB: mahdollinen listaus (ei riittävästi tietoa voiton laskemiseen)\n"
                        f"Title: {title}\n"
                        f"Link: {url}\n"
                        f"Price: {price_eur or 'tuntematon'}"
                    )
                    print(fallback_message)
                    if webhook_url:
                        send_discord_webhook(webhook_url, fallback_message)

            if len(found_deals) >= max_items:
                break

        if len(found_deals) >= max_items:
            break

    if not found_deals:
        print("Ei sopivia FB-diilejä löytynyt.")

    print(f"FB-skannattu ilmoituksia: {total_scanned}, löydetty diilejä: {len(found_deals)}")
    return found_deals


def scan_huuto_net(
    query: str = "kulta",
    max_pages: int = 1,
    max_items: int = 20,
    min_profit_eur: float = DEFAULT_MIN_PROFIT_EUR,
    webhook_url: Optional[str] = None,
    seen_urls: Optional[Set[str]] = None,
) -> List[Deal]:
    """Skannaa Huuto.netiä (koko Suomi)."""

    if seen_urls is None:
        seen_urls = set()

    found_deals: List[Deal] = []
    visited_urls = set(seen_urls)

    total_scanned = 0

    for page in range(1, max_pages + 1):
        search_url = (
            f"https://www.huuto.net/haku/?q={requests.utils.quote(query)}&s={page}"
        )
        resp = _safe_get(
            search_url,
            headers={"Accept-Language": "fi-FI,fi;q=0.9,en-US;q=0.8,en;q=0.7"},
        )
        print(f"[DEBUG] fetching (Huuto): {search_url} -> {resp.status_code if resp else 'ERROR'}")
        if resp is None:
            break

        soup = BeautifulSoup(resp.text, "html.parser")
        items = []

        # Huuto.net käyttää <a class="h_item" ...> tai vastaavaa. Yritetään kerätä linkit.
        for a in soup.select("a.h_item, a[title]"):
            href = a.get("href")
            if not href:
                continue
            if "/kohde/" not in href and "/item/" not in href:
                continue

            url = _normalize_url(href)
            if not url:
                if href.startswith("/"):
                    url = "https://www.huuto.net" + href

            if not url or url in visited_urls:
                continue

            visited_urls.add(url)
            items.append({"url": url, "title": a.get("title") or a.get_text(strip=True), "price": None})

        for entry in items[: max_items - len(found_deals)]:
            url = entry.get("url")
            if not url:
                continue
            if url in seen_urls:
                continue
            seen_urls.add(url)
            total_scanned += 1

            title, price_eur, text = fetch_listing_details(url)
            if not title:
                title = entry.get("title") or ""

            if price_eur is None:
                price_eur = _parse_price_from_text(title)

            metal, karat, weight_g = extract_info((title or "") + "\n" + text)

            if metal and karat is not None and weight_g is not None and price_eur is not None:
                spot_price, spot_source = get_spot_price_per_gram(
                    metal=metal, karat=karat
                )
                offer_eur, profit_eur = calculate_offer_and_profit(
                    price_eur, weight_g, spot_price
                )

                if webhook_url:
                    negotiation = _evaluate_negotiation_opportunity(
                        price_eur, spot_price, weight_g, min_profit_eur
                    )
                    if negotiation:
                        send_discord_webhook(
                            webhook_url,
                            (
                                f"🤝 Huuto-neuvottelumahdollisuus: {title or '(ei otsikkoa)'}\n"
                                f"Link: {url}\n"
                                f"{negotiation}"
                            ),
                        )

                if profit_eur is not None and profit_eur >= min_profit_eur:
                    deal = Deal(
                        title=title or "(ei otsikkoa)",
                        url=url,
                        price_eur=price_eur,
                        metal=metal,
                        karat=karat,
                        weight_g=weight_g,
                        spot_price_per_g=spot_price,
                        offer_eur=offer_eur,
                        profit_eur=profit_eur,
                        source_text=text,
                    )
                    found_deals.append(deal)

                    message = (
                        f"🚨 HUUTO GOLD/HOPEA DEAL FOUND\n"
                        f"Title: {deal.title}\n"
                        f"Weight: {deal.weight_g:.2f}g\n"
                        f"Karat: {deal.karat:.1f}\n"
                        f"Spot price (per g): {deal.spot_price_per_g:.2f} €\n"
                        f"Spot source: {spot_source}\n"
                        f"Offer (70%): {deal.offer_eur:.2f} €\n"
                        f"Potential profit: {deal.profit_eur:.2f} €\n"
                        f"Link: {deal.url}"
                    )
                    print(message)
                    if webhook_url:
                        send_discord_webhook(webhook_url, message)

            else:
                if any(k in (title or "").lower() for k in GOLD_KEYWORDS + SILVER_KEYWORDS):
                    fallback_message = (
                        f"🔎 Huuto: mahdollinen listaus (ei riittävästi tietoa voiton laskemiseen)\n"
                        f"Title: {title}\n"
                        f"Link: {url}\n"
                        f"Price: {price_eur or 'tuntematon'}"
                    )
                    print(fallback_message)
                    if webhook_url:
                        send_discord_webhook(webhook_url, fallback_message)

            if len(found_deals) >= max_items:
                break

        if len(found_deals) >= max_items:
            break

    if not found_deals:
        print("Ei sopivia Huuto-diilejä löytynyt.")

    print(f"Huuto-skannattu ilmoituksia: {total_scanned}, löydetty diilejä: {len(found_deals)}")
    return found_deals


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _parse_pages(value: str) -> int:
    """Parser for --pages: 1..9999 (9999 acting as "effectively unlimited")."""

    try:
        v = int(value)
    except ValueError:
        raise argparse.ArgumentTypeError("pages must be a number")

    if v < 1 or v > 9999:
        raise argparse.ArgumentTypeError("pages must be between 1 and 9999")
    return v


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Gold Hunter Bot - skannaa Tori.fi:stä kulta- ja hopeadiilejä")
    parser.add_argument(
        "--webhook",
        help="Discord-webhook-URL (voi myös lukea ympäristömuuttujasta DISCORD_WEBHOOK_URL)",
    )
    parser.add_argument(
        "--query",
        default=None,
        help=(
            "Hakulauseke (esim. 'kulta' tai 'hopea'). "
            "Voit antaa useita pilkulla eroteltuna: 'kulta,hopea,kultakoru'"
        ),
    )
    parser.add_argument(
        "--min-profit",
        type=float,
        default=DEFAULT_MIN_PROFIT_EUR,
        help="Minimivoitto euroissa, jotta diili ilmoitetaan",
    )
    parser.add_argument(
        "--pages",
        type=_parse_pages,
        default=1,
        help="Kuinka monta hakusivua skannataan (1..9999).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Maksimi löydettyjen diilien määrä per skannaus",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=300,
        help="Kuinka monta sekuntia odotetaan kahden skannauksen välillä (jos käynnistetään jatkuvaksi)",
    )
    parser.add_argument(
        "--run-forever",
        action="store_true",
        help="Aja botin skannaus jatkuvasti; odottaa --interval sekuntia skannausten välillä.",
    )
    parser.add_argument(
        "--seen-file",
        default=SEEN_URLS_PATH,
        help="Tiedosto, jossa pidetään kirjaa jo käsitellyistä ilmoituksista",
    )
    parser.add_argument(
        "--metals-api-key",
        help="(Valinnainen) Metals API -avain spot-hintojen hakemiseen",
    )

    args = parser.parse_args(argv)

    webhook = (
        args.webhook
        or os.environ.get("DISCORD_WEBHOOK_URL")
        or DEFAULT_DISCORD_WEBHOOK_URL
    )
    metals_api_key = args.metals_api_key or os.environ.get("METALS_API_KEY")

    seen_file = args.seen_file
    seen_urls = _load_seen_urls(seen_file)

    query_values: List[str]
    if args.query:
        extra_queries = [q.strip() for q in re.split(r"[,;]", args.query) if q.strip()]
        # DEFAULT_QUERIES ovat prioriteetti 1; lisätään käyttäjän hakusanat niiden perään.
        query_values = list(dict.fromkeys(DEFAULT_QUERIES + extra_queries))
    else:
        query_values = list(DEFAULT_QUERIES)

    # Lähetetään Discordiin käynnistysviesti, jotta tiedetään että botti on käynnissä.
    if webhook:
        start_msg = (
            "🚀 Gold Hunter Bot käynnistetty!\n"
            f"Haku: {', '.join(query_values[:5])}{'...' if len(query_values) > 5 else ''}\n"
            f"Sivuja per haku: {args.pages}, maksimidiilejä per haku: {args.limit}\n"
            f"Minimivoitto: {args.min_profit:.2f} €"
        )
        send_discord_webhook(webhook, start_msg)

    stopped_reason: Optional[str] = None

    try:
        while True:
            # Lähetetään yksi yhteenvetoilmoitus per skannauskierros (ei per hakusana).
            if webhook:
                gold_spot, gold_source = get_spot_price_per_gram(
                    metal="gold", karat=14.0, api_key=metals_api_key
                )
                silver_spot, silver_source = get_spot_price_per_gram(
                    metal="silver", karat=None, api_key=metals_api_key
                )
                send_discord_webhook(
                    webhook,
                    (
                        "🔎 Skannaus alkaa!\n"
                        f"Hakuja: {len(query_values)}, sivuja per haku: {args.pages}, max diilejä per haku: {args.limit}\n"
                        f"Minimivoitto: {args.min_profit:.2f} €\n"
                        f"Spot-hinnat: kulta {gold_spot:.2f} €/g ({gold_source}), hopea {silver_spot:.2f} €/g ({silver_source})\n"
                        f"Ensimmäiset hakulauseet: {', '.join(query_values[:5])}{'...' if len(query_values) > 5 else ''}"
                    )
                )

            for query in query_values:
                scan_tori(
                    query=query,
                    max_pages=args.pages,
                    max_items=args.limit,
                    min_profit_eur=args.min_profit,
                    webhook_url=webhook,
                    metals_api_key=metals_api_key,
                    seen_urls=seen_urls,
                )

                scan_facebook_marketplace(
                    query=query,
                    max_pages=args.pages,
                    max_items=args.limit,
                    min_profit_eur=args.min_profit,
                    webhook_url=webhook,
                    seen_urls=seen_urls,
                )

                scan_huuto_net(
                    query=query,
                    max_pages=args.pages,
                    max_items=args.limit,
                    min_profit_eur=args.min_profit,
                    webhook_url=webhook,
                    seen_urls=seen_urls,
                )

            _save_seen_urls(seen_file, seen_urls)

            if webhook:
                send_discord_webhook(
                    webhook,
                    f"✅ Skannaus valmis. Odotetaan {args.interval} sekuntia ennen seuraavaa kierrosta."
                )

            if not args.run_forever:
                stopped_reason = "suoritus valmis"
                break

            print(f"Odota {args.interval} sekuntia ennen seuraavaa skannausta...")
            time.sleep(args.interval)

    except KeyboardInterrupt:
        stopped_reason = "keskeytetty käyttäjän toimesta"
        print("Keskeytetty käyttäjän toimesta.")

    finally:
        if webhook and stopped_reason:
            notify_bot_stop(webhook, stopped_reason)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
