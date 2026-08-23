export type TeamMember = {
  id: string;
  name: string;
  fullName?: string;
  role: string;
  // Placeholder-esittelyteksti — korvataan myöhemmin oikealla, henkilökohtaisemmalla tekstillä.
  bio: string;
  // Lisää polku (esim. '/images/tiimi/dome.jpg') kun kuva on tallennettu
  // public/images/tiimi/-kansioon. Kunnes kuva löytyy, TeamCard näyttää initials-avatarin.
  photo?: string;
  initials: string;
  phone?: { display: string; tel: string };
};

const teamData: TeamMember[] = [
  {
    id: 'dome',
    name: 'Dome',
    fullName: 'Domenic Eklund',
    role: 'Toimitusjohtaja',
    bio: 'Vastaa siitä, että jokainen muutto sujuu suunnitelman mukaan alusta loppuun.',
    photo: '/images/tiimi/dome.jpg',
    initials: 'D',
    phone: { display: '+358 45 346 0072', tel: '+358453460072' },
  },
  {
    id: 'paavo',
    name: 'Paavo',
    fullName: 'Paavo Penttinen',
    role: 'Myyntipäällikkö',
    bio: 'Auttaa sinua löytämään juuri sinun muuttoosi sopivan ratkaisun ja hinnan.',
    photo: '/images/tiimi/paavo.jpg',
    initials: 'P',
    phone: { display: '+358 45 847 0755', tel: '+358458470755' },
  },
  {
    id: 'hugo',
    name: 'Hugo',
    fullName: 'Hugo Typpö',
    role: 'Työnjohtaja',
    bio: 'Johtaa muuttoryhmää paikan päällä ja varmistaa, että kaikki sujuu turvallisesti ja aikataulussa.',
    photo: '/images/tiimi/hugo.jpg',
    initials: 'H',
    phone: { display: '+358 40 169 5440', tel: '+358401695440' },
  },
];

export default teamData;
