import Link from "next/link";
import clientsData from "@/components/Clients/clientsData";
import Image from "next/image";

export default function ClientsWrapper() {
  return (
    <>
      <div className="grid grid-cols-3 items-center justify-center gap-7.5 md:grid-cols-6 lg:gap-12.5 xl:gap-17.5">
        {clientsData.map((client, index) => (
          <Link key={index} href={client.link} className="animate_top block">
            <Image
              className="opacity-85 duration-300 ease-in-out hover:opacity-100 dark:hidden"
              src={client.logo}
              alt={client.name}
              width={client.width}
              height={client.height}
            />
            <Image
              className="hidden opacity-50 duration-300 ease-in-out hover:opacity-100 dark:block"
              src={client.logoDark}
              alt={client.name}
              width={client.width}
              height={client.height}
            />
          </Link>
        ))}
      </div>
    </>
  );
}
