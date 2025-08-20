"use client";

import { useState } from "react";
import PricingItem from "@/components/Pricing/PricingItem";
import { pricingData } from "@/stripe/pricingData";

export default function PricingContainer() {
  const [planTypeYearly, setPlanTypeYearly] = useState(false);

  return (
    <>
      <div className="mt-12.5 flex items-center justify-center space-x-4">
        <span className="font-medium text-black dark:text-white">
          Bill Monthly
        </span>

        <button
          aria-label="Pricing Toggler"
          className="relative rounded-full focus:outline-hidden"
          onClick={() => setPlanTypeYearly(!planTypeYearly)}
        >
          <div className="h-6 w-11 rounded-full bg-primary outline-hidden transition"></div>
          <div
            className={`${planTypeYearly ? "translate-x-4.5" : "translate-x-0"} absolute left-1 top-[3px] inline-flex h-4.5 w-4.5 transform items-center justify-center rounded-full bg-white shadow-xs transition-all duration-200 ease-in-out`}
          ></div>
        </button>

        <span className="font-medium text-black dark:text-white">
          Bill Annually
        </span>
      </div>

      <div className="relative z-10 mx-auto mt-15 max-w-1390 px-4 md:px-8 xl:px-21">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {pricingData &&
            pricingData.map((price, key) => (
              <PricingItem
                price={price}
                key={key}
                planTypeYearly={planTypeYearly}
              />
            ))}
        </div>
      </div>
    </>
  );
}
