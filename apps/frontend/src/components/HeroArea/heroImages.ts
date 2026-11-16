// Herojen vaihtuvat työkuvat (etusivu ja kaupunkisivut). UUSI KUVA: tallenna se kansioon
// public/images/webp/hero/ ja lisää polku tähän listaan, niin se tulee kiertoon kaikkialla.
// Kuvasuhteet vaihtelevat (3:4 ja 9:16), joten kuvat näytetään kiinteässä laatikossa object-coverilla.
// hero.webp säilytetään kansiossa mutta ei ole kierrossa. Poistettu 2026-11-15: hero-3/4/5 (jääkaappi ulkona, shortsit sisällä).
export const HERO_IMAGES = [
  '/images/webp/hero/hero-2.jpg',
  '/images/webp/hero/hero-6.jpg',
  '/images/webp/hero/hero-7.jpg',
  '/images/webp/hero/hero-8.jpg',
  '/images/webp/hero/hero-9.jpg',
  '/images/webp/hero/hero-10.jpg',
  '/images/webp/hero/hero-11.jpg',
  '/images/webp/hero/hero-12.jpg', // kierrätysasemalla (2026-11-15)
  '/images/webp/hero/hero-13.jpg', // muuttoauto kantakaupungin kadulla (2026-11-15)
  '/images/webp/hero/hero-14.jpg', // astianpesukoneen asennus keittiössä (2026-11-15)
] as const;
