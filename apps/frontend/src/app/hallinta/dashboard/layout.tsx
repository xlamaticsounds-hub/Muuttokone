import { requirePageAccess } from '@/server/access';

// Osion oikeustarkistus (säännöt: lib/access.ts). Ajetaan aina, kun osioon tullaan toisesta osiosta;
// tiimirajatut sivut tarkistavat lisäksi itse (requirePageAccess palauttaa käyttäjän).
export default async function SectionLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess('/hallinta/dashboard');
  return <>{children}</>;
}
