import SectionTitle from "@/components/SectionTitle";
import ClientsWrapper from "@/components/Clients/ClientsWrapper";

const Clients = () => {
  return (
    <>
      <section className="pt-20 lg:pt-25 xl:pt-30">
        <SectionTitle
          title="Trusted by Global Brands"
          subtitle="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using."
        />

        <div className="mx-auto mt-15 max-w-1390 border-b border-strokedark px-4 pb-20 dark:border-stroke md:px-8 lg:pb-22.5 2xl:px-49">
          <ClientsWrapper />
        </div>
      </section>
    </>
  );
};

export default Clients;
