import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 Error | Base Next.js App Landing Template",
  description: "This is Error page for Base Pro",
  // other metadata
};

export default function ErrorPage() {
  return (
    <>
      <section className="fixed left-0 top-0 z-99999 flex h-full min-h-screen w-full items-center justify-center overflow-hidden bg-whiter px-4 py-8 dark:bg-blacksection xl:py-20">
        <Image
          src="/images/shape/shape-06.svg"
          alt="Shape"
          className="absolute left-[2%] top-[30%] -z-1"
          width={43}
          height={86}
        />
        <Image
          src="/images/shape/shape-03.svg"
          alt="Shape"
          className="lg:blog absolute bottom-[40%] right-[15%] -z-1 hidden"
          width={85}
          height={46}
        />
        <Image
          src="/images/shape/shape-17.svg"
          alt="Shape"
          className="absolute bottom-[5%] right-[2%] -z-1"
          width={104}
          height={52}
        />
        <Image
          src="/images/shape/shape-18.svg"
          alt="Shape"
          className="absolute bottom-0 right-0 -z-1"
          width={447}
          height={711}
        />

        <div className="animate_top mx-auto max-w-[518px] overflow-y-auto text-center">
          <Image
            src="./images/shape/404.svg"
            alt="404"
            className="mx-auto mb-10"
            width={309}
            height={124}
          />

          <h2 className="mb-5 text-2xl font-medium text-black dark:text-white md:text-4xl">
            Sorry, the page can’t be found
          </h2>
          <p className="mb-8.5">
            The page you were looking for appears to have been moved, deleted or
            does not exist.
          </p>

          <Link
            href="/"
            className="inline-flex rounded-full bg-primary px-7.5 py-3 font-medium text-white duration-300 ease-in-out hover:shadow-1"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </>
  );
}
