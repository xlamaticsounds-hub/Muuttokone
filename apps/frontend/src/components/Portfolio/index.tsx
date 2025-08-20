import SectionTitle from "@/components/SectionTitle";
import PortfolioContainer from "./PortfolioContainer";

export default function Portfolio() {
  return (
    <>
      <section className="overflow-hidden pb-10 pt-20 lg:pb-15 lg:pt-25 xl:pb-20 xl:pt-30">
        <SectionTitle
          title="Our Latest Projects"
          subtitle="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using. "
        />

        <PortfolioContainer />
      </section>
    </>
  );
}
