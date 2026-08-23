import Image from 'next/image';
import { Phone } from 'lucide-react';
import type { TeamMember } from './teamData';

export default function TeamCard({ member }: { member: TeamMember }) {
  return (
    <div className="animate_top rounded-2xl bg-white p-7.5 text-center shadow-solid-8 xl:p-10 dark:border dark:border-strokedark dark:bg-blacksection">
      <div className="bg-primary/10 mx-auto mb-5 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full">
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.name}
            width={112}
            height={112}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-primary text-3xl font-semibold">{member.initials}</span>
        )}
      </div>
      <h3 className="text-xl font-semibold text-black dark:text-white">{member.name}</h3>
      {member.fullName && (
        <p className="text-body-color dark:text-body-color-dark text-sm">{member.fullName}</p>
      )}
      <p className="text-primary mb-3 text-sm font-medium">{member.role}</p>
      <p className="text-body-color dark:text-body-color-dark text-sm">{member.bio}</p>
      {member.phone && (
        <a
          href={`tel:${member.phone.tel}`}
          className="text-body-color dark:text-body-color-dark hover:text-primary mt-4 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Phone className="h-4 w-4" />
          {member.phone.display}
        </a>
      )}
    </div>
  );
}
