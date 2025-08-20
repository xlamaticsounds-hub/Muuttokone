import Image from "next/image";
import Link from "next/link";
import React from "react";

const PortfolioItem = ({ data }: any) => {
  return (
    <div className={`group relative z-1 overflow-hidden rounded-lg ${data.className}`}>
      <Image
        className="h-full w-full object-cover"
        src={data.img}
        alt={data.title}
        width={439}
        height={690}
      />

      <div className="absolute left-0 top-0 z-10 flex h-full w-full translate-y-full flex-col items-center justify-center rounded-lg bg-white/20 duration-300 ease-linear group-hover:translate-y-0">
        <div className="absolute left-0 top-0 -z-1 h-full w-full backdrop-blur-sm"></div>

        <h4 className="mb-0.5 text-2xl font-medium text-black">{data.title}</h4>
        <p>{data.desc}</p>
        <Link
          aria-label="Portfolio Details Link for Brand"
          className="group mt-4 flex h-10 w-10 items-center justify-center rounded-full border border-body bg-transparent duration-300 ease-in-out group-hover:border-primary group-hover:bg-primary"
          href={data.link}
        >
          <svg
            className="fill-body duration-300 ease-in-out group-hover:fill-white"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10.4763 6.16664L6.00634 1.69664L7.18467 0.518311L13.6663 6.99998L7.18467 13.4816L6.00634 12.3033L10.4763 7.83331H0.333008V6.16664H10.4763Z" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default PortfolioItem;
