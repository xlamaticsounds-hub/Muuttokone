export type TeamMember = {
  id: string;
  name: string;
  role: string;
  // Placeholder-esittelyteksti — korvataan myöhemmin oikealla, henkilökohtaisemmalla tekstillä.
  bio: string;
  // Lisää polku (esim. '/images/tiimi/dome.jpg') kun kuva on tallennettu
  // public/images/tiimi/-kansioon. Kunnes kuva löytyy, TeamCard näyttää initials-avatarin.
  photo?: string;
  initials: string;
};

const teamData: TeamMember[] = [
  {
    id: 'dome',
    name: 'Dome',
    role: 'Toimitusjohtaja',
    bio: 'Vastaa siitä, että jokainen muutto sujuu suunnitelman mukaan alusta loppuun.',
    photo: '/images/tiimi/dome.jpg',
    initials: 'D',
  },
  {
    id: 'paavo',
    name: 'Paavo',
    role: 'Myyntipäällikkö',
    bio: 'Auttaa sinua löytämään juuri sinun muuttoosi sopivan ratkaisun ja hinnan.',
    photo: '/images/tiimi/paavo.jpg',
    initials: 'P',
  },
];

export default teamData;
