import React from "react";
import { Metadata } from "next";
import { NextPage } from "next";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "Residential Moves - Muuttokone",
  description: "Our residential moving services.",
};

const ResidentialMovesPage: NextPage = () => {
  return (
    <section className="py-20 lg:py-25 xl:py-30">
      <div className="mx-auto max-w-c-1315 px-4 md:px-8 xl:px-0">
        <SectionTitle
          title="Residential Moves"
          subtitle="We offer professional and reliable moving services for your home. Our team is experienced in handling all types of residential moves, from small apartments to large houses. We take great care in packing and transporting your belongings to ensure they arrive safely at your new home."
        />
      </div>
    </section>
  );
};

export default ResidentialMovesPage;
