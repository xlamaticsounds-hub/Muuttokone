import SectionTitle from '@/components/SectionTitle';
import PortfolioContainer from './PortfolioContainer';

export default function Portfolio() {
  return (
    <>
      <section className="overflow-hidden pt-20 pb-10 lg:pt-25 lg:pb-15 xl:pt-30 xl:pb-20">
        <SectionTitle
          title="Our Latest Projects"
          subtitle="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using. "
        />

        <PortfolioContainer />
      </section>
    </>
  );
}
