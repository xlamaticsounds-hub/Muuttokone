import React from "react";
import Link from "next/link";

const categoriesData = ["Blog", "Events", "Grids", "News", "Rounded"];

const Categories = () => {
  return (
    <div className="mb-10">
      <h4 className="mb-7.5 text-2xl text-black dark:text-white">Categories</h4>

      <ul>
        {categoriesData.map((item, index) => (
          <li
            key={index}
            className="mb-3 duration-300 ease-in-out last:mb-0 hover:text-primary"
          >
            <Link href="#">{item}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Categories;
