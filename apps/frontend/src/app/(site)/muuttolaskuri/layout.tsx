import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Muuttolaskuri – Saa tarkka hinta heti | Muuttokone.fi',
  description: 'Laske muuttosi hinta heti – tarkka hinta-arvio sekunneissa, ei piilokuluja. Suomen tarkin muuttolaskuri perustuu oikeaan tavaramäärään, ei arvioihin.',
};

export default function MuuttolaskuriLayout({ children }: { children: React.ReactNode }) {
  return children;
}
