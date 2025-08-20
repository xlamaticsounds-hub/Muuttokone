import type { Metadata } from "next";
import HeroArea from "@/components/HeroArea";
import Testimonials from "@/components/Testimonials";
import About from "@/components/About";
import Services from "@/components/Services";
import ServicesDivider from "@/components/ServicesDivider";
// import Pricing from "@/components/Pricing"; // Temporarily hidden per requirements
import SmallFeatures from "@/components/SmallFeatures";
import Contact from "@/components/Contact";
import Cta from "@/components/Cta";
import QuickQuote from "@/components/Forms/QuickQuote";
import { integrations } from "../../../integrations.config";
import { directusFetch, assetUrl } from "@/libs/directus";
import type { Service } from "@/types/service";
import staticServiceData from "@/components/Services/serviceData";

export const metadata: Metadata = {
  title: "Muuttokone.fi - Luotettava muuttopalvelu koko Suomessa",
  description:
    "Nopea, turvallinen ja läpinäkyvä muutto. Koti- ja yritysmuutot, pakkaus, varastointi ja siivous. Vakuutettu SMPY-jäsen. Pyydä maksuton tarjous!",
};

async function getServices(): Promise<Service[]> {
  try {
    const data = await directusFetch<{ data: any[] }>(
      "/items/services?fields=title,description,icon",
      { cache: "no-store" }
    );
    const items = (data?.data || []).map((item) => ({
      title: item.title,
      description: item.description,
      icon:
        typeof item.icon === "string" && item.icon.startsWith("http")
          ? item.icon
          : assetUrl(item.icon) || "/images/icon/icon-01.svg",
      bgClass: "hover:bg-primary/5",
    }));
    return items.length ? items : staticServiceData;
  } catch {
    return staticServiceData;
  }
}

export default async function Home() {
  const services = await getServices();
  return (
    <>
      <HeroArea />
      <ServicesDivider />
      <SmallFeatures />
      <QuickQuote />
      <ServicesDivider />
      <Services
        title="Palvelumme"
        subtitle="Tarjoamme kattavat muuttopalvelut kotitalouksille ja yrityksille koko Suomessa."
        items={services}
      />
      <About />
      {/* <Testimonials /> */}
  {/* <Pricing /> */}
      <Contact />
      <Cta />
    </>
  );
}
