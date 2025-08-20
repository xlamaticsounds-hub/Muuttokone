import Graphics from "@/components/Team/Graphics";
import SectionTitle from "@/components/SectionTitle";
import teamData from "@/components/Team/teamData";
import TeamItem from "@/components/Team/TeamItem";

export default function Team() {
  return (
    <>
      <section
        id="team"
        className="relative z-1 overflow-hidden py-20 lg:py-25 xl:py-30"
      >
        <Graphics />

        <SectionTitle
          title="Meet With Our Creative Dedicated Team"
          subtitle="Lorem ipsum dolor sit amet, consectetur adipiscing elit. In convallis tortor eros. Donec vitae tortor lacus. Phasellus aliquam ante in maximus."
        />

        <div className="relative z-10 mx-auto mt-12.5 max-w-1390 px-4 md:px-8 lg:mt-17.5 xl:px-26">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12.5">
            {teamData.map((team, index) => (
              <TeamItem key={index} team={team} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
