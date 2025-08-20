"use client";

import axios from "axios";
import Link from "next/link";
import { integrations, messages } from "../../../integrations.config";
import toast from "react-hot-toast";

export default function PricingItem({ price, planTypeYearly }: any) {
  const handleSubscription = async (e: any) => {
    e.preventDefault();

    if (!integrations?.isStripeEnabled) {
      toast.error(messages.stripe);
      return;
    }

    const { data } = await axios.post(
      "/api/payment",
      {
        priceId: price.stripePriceId,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    window.location.assign(data);
  };

  return (
    <>
      <div className="animate_top rounded-lg bg-white px-7.5 pb-10 pt-11 text-center shadow-3 dark:bg-black dark:shadow-none">
        <h4 className="mb-10 text-title-xsm text-black dark:text-white">
          {price.packName}
        </h4>

        <div className="mb-1.5 flex items-center justify-center gap-1.5">
          <h2 className="text-title-lg font-semibold text-black dark:text-white">
            ${planTypeYearly ? price.unit_amount * 12 : price.unit_amount}
          </h2>
          <span className="inline-block text-sm text-black dark:text-white">
            {planTypeYearly ? "/per year" : "/per month"}
          </span>
        </div>

        <p className="text-xm mb-9.5">No credit card required</p>

        <Link
          href="#"
          onClick={handleSubscription}
          className={`rounded-full px-13 py-3 font-medium text-white duration-300 ease-in-out ${price.packName === "Growth Plan" ? "bg-primary hover:bg-secondary" : "bg-secondary hover:bg-primary"}`}
        >
          Try for free
        </Link>

        <ul className="mb-10 mt-7.5 flex flex-col gap-3">
          {price.features.map((feature: string, featureIndex: number) => (
            <li key={featureIndex}>{feature}</li>
          ))}
        </ul>

        <p className="text-black dark:text-white">7-day free trial</p>
      </div>
    </>
  );
}
