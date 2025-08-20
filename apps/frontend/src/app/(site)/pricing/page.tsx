import React from "react";
import { Metadata } from "next";
import { NextPage } from "next";
import Pricing from "@/components/Pricing";
import SectionTitle from "@/components/SectionTitle";
import Cta from "@/components/Cta";
import ContactFormBox from "@/components/Contact/ContactFormBox";

export const metadata: Metadata = {
  title: "Pricing - Muuttokone",
  description: "Our pricing information.",
};

const PricingPage: NextPage = () => {
  return (
    <>
      <Pricing />

      <section className="py-12">
        <SectionTitle
          title="Price examples"
          subtitle="Representative price ranges for typical moves to help you budget. Exact quotes are free and tailored to your needs."
        />

        <div className="mx-auto mt-8 max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-3 dark:bg-black">
              <h4 className="mb-2 font-medium">Studio / Small apartment</h4>
              <p className="text-body">Example: €230 – €350 (local)</p>
              <p className="mt-3 text-sm text-body">Includes 2 movers, van, basic packing and 1 hour loading/unloading.</p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-3 dark:bg-black">
              <h4 className="mb-2 font-medium">2-room apartment</h4>
              <p className="text-body">Example: €540 – €670 (local)</p>
              <p className="mt-3 text-sm text-body">Includes 3 movers, medium truck, packing on request, and insurance.</p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-3 dark:bg-black">
              <h4 className="mb-2 font-medium">Family home</h4>
              <p className="text-body">Example: €860 – €1,075 (local)</p>
              <p className="mt-3 text-sm text-body">Includes 4 movers, large truck, packing service and optional storage.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-whiter dark:bg-blacksection">
        <SectionTitle
          title="Get a free, no‑obligation quote"
          subtitle="Fill the form and our team will provide a tailored estimate or schedule a free virtual/on-site survey."
        />

        <div className="mx-auto mt-8 flex justify-center px-4 md:px-8 xl:px-21">
          <ContactFormBox />
        </div>
      </section>

      <Cta />
    </>
  );
};

export default PricingPage;
