"""Testaa Discord-webhookin toimivuus.

Käynnistä:
    python test_webhook.py
"""

import requests

WEBHOOK_URL = "https://discord.com/api/webhooks/1483275207765393540/GnmRf8oe9Drlhx9DE7CPssZ9GLbOyvU5J2Ixy3B9HJn24QcvICJ2UJrSSn3CjBjxMDNi"

try:
    r = requests.post(WEBHOOK_URL, json={"content": "Webhook test from Gold Hunter Bot"}, timeout=10)
    r.raise_for_status()
    print("Webhook sent successfully! status=", r.status_code)
except Exception as e:
    print("Webhook send failed:", e)
    if hasattr(e, 'response') and e.response is not None:
        print('response:', e.response.status_code, e.response.text)
