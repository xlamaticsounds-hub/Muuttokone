# Muuttokone.fi

[![Deploy to Cloud Run](https://github.com/alex-amper/muuttokone/actions/workflows/deploy.yaml/badge.svg)](https://github.com/alex-amper/muuttokone/actions/workflows/deploy.yaml)

Muuttokone.fi on nykyaikainen muuttopalvelualusta, joka yhdistää helpon tarjouspyyntöprosessin ja tehokkaan hallintatyökalun.

## 🚀 Ominaisuudet
- **Muuttolaskuri**: Älykäs laskuri hinta-arvion saamiseksi.
- **Hallintapaneeli**: Täysi hallinta liideille, diileille ja blogisisällölle.
- **AI-Avustaja**: GPT-pohjainen asiakaspalvelubotti.
- **Bloggen**: Automaattinen sisällöntuotanto hakukoneoptimointia varten.

## 🛠 Kehitys

### Esivaatimukset
- Node.js 20+
- pnpm (suositeltu 10x nopeus)
- PostgreSQL

### Asennus
1. Kopioi `.env.example` tiedostoksi `.env` ja täytä tarvittavat tiedot.
2. Asenna riippuvuudet:
   ```bash
   pnpm install
   ```
3. Aja tietokantamigraatiot:
   ```bash
   pnpm prisma migrate dev
   ```
4. Käynnistä kehityspalvelin:
   ```bash
   pnpm dev
   ```

## 🚢 Käyttöönotto (Deployment)

Käyttöönotto tapahtuu Google Cloud Platformiin:
```bash
./deploy.sh
```
Tämä skripti rakentaa Docker-imagen Cloud Buildilla ja päivittää Cloud Run -palvelun.

## 🏗 Teknologiat
- **Frontend**: Next.js 16, Tailwind CSS, Framer Motion
- **Backend**: Prisma ORM, NextAuth, AI SDK
- **Infra**: Google Cloud Run, Artifact Registry, Cloud Build

---
© 2025 Muuttokone.fi
