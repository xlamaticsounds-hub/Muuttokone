import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 Error | Base Next.js App Landing Template',
  description: 'This is Error page for Base Pro',
  // other metadata
};

export default function ErrorPage() {
  return (
    <>
      <section className="bg-whiter dark:bg-blacksection fixed top-0 left-0 z-99999 flex h-full min-h-screen w-full items-center justify-center overflow-hidden px-4 py-8 xl:py-20">
        <Image
          src="/images/shape/shape-06.svg"
          alt="Shape"
          className="absolute top-[30%] left-[2%] -z-1"
          width={43}
          height={86}
        />
        <Image
          src="/images/shape/shape-03.svg"
          alt="Shape"
          className="lg:blog absolute right-[15%] bottom-[40%] -z-1 hidden"
          width={85}
          height={46}
        />
        <Image
          src="/images/shape/shape-17.svg"
          alt="Shape"
          className="absolute right-[2%] bottom-[5%] -z-1"
          width={104}
          height={52}
        />
        <Image
          src="/images/shape/shape-18.svg"
          alt="Shape"
          className="absolute right-0 bottom-0 -z-1"
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

          <h2 className="mb-5 text-2xl font-medium text-black md:text-4xl dark:text-white">
            Sorry, the page can’t be found
          </h2>
          <p className="mb-8.5">
            The page you were looking for appears to have been moved, deleted or does not exist.
          </p>

          <Link
            href="/"
            className="bg-primary hover:shadow-1 inline-flex rounded-full px-7.5 py-3 font-medium text-white duration-300 ease-in-out"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </>
  );
}
