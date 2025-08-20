"use client";
import { useState } from "react";
import PortfolioItem from "./PortfolioItem";

const tabs = [
  {
    name: "All",
    key: "all",
  },
  {
    name: "Branding Strategy",
    key: "branding",
  },
  {
    name: "Digital Experiences",
    key: "digital",
  },
  {
    name: "Ecommerce",
    key: "ecommerce",
  },
];

const portfolioItems = [
  {
    img: "/images/projects/project-01.png",
    key: ["branding", "digital"],
    title: "Photo Retouching",
    desc: "Branded Ecommerce",
    link: "#",
    className: "col-span-2 row-span-1", // Wide item
  },
  {
    img: "/images/projects/project-02.png",
    key: ["branding", "ecommerce"],
    title: "Photo Retouching",
    desc: "Branded Ecommerce",
    link: "#",
    className: "col-span-1 row-span-1", // Standard item
  },
  {
    img: "/images/projects/project-04.png",
    key: ["branding", "ecommerce", "digital"],
    title: "Photo Retouching",
    desc: "Branded Ecommerce",
    link: "#",
    className: "col-span-1 row-span-2", // Tall item
  },
  {
    img: "/images/projects/project-03.png",
    key: ["digital"],
    title: "Photo Retouching",
    desc: "Branded Ecommerce",
    link: "#",
    className: "col-span-3 row-span-1", // Wide item
  },
];

export default function PortfolioContainer() {
  const [filterKey, setFilterKey] = useState("all");

  const filteredItems =
    filterKey === "all"
      ? portfolioItems
      : portfolioItems.filter((item) => item.key.includes(filterKey));

  const handleFilterKeyChange = (key: string) => () => {
    setFilterKey(key);
  };

  return (
    <>
      <div className="mx-auto mt-12.5 max-w-1390 px-4 md:px-8 2xl:px-0">
        <div className="projects-tab mx-auto mb-17.5 flex max-w-fit flex-wrap items-center justify-center gap-5 rounded-full bg-white px-2.5 py-2 shadow-3 dark:bg-blacksection dark:shadow-none">
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={`project-tab-btn rounded-full px-6 py-1.5 font-medium duration-300 ease-in-out ${filterKey === tab.key && "bg-primary text-white"}`}
              onClick={handleFilterKeyChange(tab.key)}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map((item, i) => (
            <PortfolioItem data={item} key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
