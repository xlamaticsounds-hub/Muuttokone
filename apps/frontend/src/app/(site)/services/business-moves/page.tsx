import React from "react";
import { Metadata } from "next";
import { NextPage } from "next";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "Business Moves - Muuttokone",
  description: "Our business moving services.",
};

const BusinessMovesPage: NextPage = () => {
  return (
    <section className="py-20 lg:py-25 xl:py-30">
      <div className="mx-auto max-w-c-1315 px-4 md:px-8 xl:px-0">
        <SectionTitle
          title="Business Moves"
          subtitle="We provide efficient and seamless moving services for your business. We understand the importance of minimizing downtime and ensuring a smooth transition. Our team is equipped to handle office furniture, IT equipment, and other commercial items with care and precision."
        />
      </div>
    </section>
  );
};

export default BusinessMovesPage;
