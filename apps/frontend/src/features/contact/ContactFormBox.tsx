"use client";
import React, { useState } from "react";
import formData from "@/features/contact/formData";
import toast from "react-hot-toast";
import z from "zod";

const schema = z.object({
  name: z.string().min(3, "Anna nimesi."),
  email: z.string().email("Anna kelvollinen sähköpostiosoite."),
  subject: z.string().min(3, "Anna aihe."),
  message: z.string().min(3, "Kirjoita viesti."),
});

export default function ContactFormBox() {
  const [data, setData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: any) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    const result = schema.safeParse(data);

    if (!result.success) {
      result.error.errors.forEach((error) => {
        toast.error(error.message);
      });
      return;
    }
  };

  return (
    <>
      <div className="animate_top w-full rounded-lg bg-white p-7.5 shadow-3 dark:bg-black md:w-3/5 lg:w-2/3 xl:p-14">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 flex-col gap-7.5 lg:grid-cols-2 lg:gap-10 lg:gap-y-7.5">
            {formData.map((item, index) =>
              item.type === "message" ? (
                <div key={index} className="col-span-2 mb-10">
                  <label htmlFor={item.name} className="mb-4 block">
                    {item.label}
                  </label>

                  <textarea
                    rows={4}
                    id={item.name}
                    placeholder={item.placeholder}
                    name={item.name}
                    onChange={(e) => handleChange(e)}
                    required
                    className="w-full rounded-lg border border-strokedark bg-transparent p-6 shadow-4 placeholder:text-body/50 focus:border-primary focus:shadow-5 focus-visible:outline-hidden dark:border-stroke dark:shadow-none dark:focus:border-primary"
                  ></textarea>
                </div>
              ) : (
                <div key={index} className="w-full ">
                  <label htmlFor={item.name} className="mb-4 block">
                    {item.label}
                  </label>

                  <input
                    type={item.type}
                    id={item.name}
                    name={item.name}
                    placeholder={item.placeholder}
                    onChange={(e) => handleChange(e)}
                    required
                    className="w-full rounded-lg border border-strokedark bg-transparent px-6 py-3.5 shadow-4 placeholder:text-body/50 focus:border-primary focus:shadow-5 focus-visible:outline-hidden dark:border-stroke dark:shadow-none dark:focus:border-primary"
                  />
                </div>
              ),
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="inline-flex rounded-full bg-primary px-7.5 py-3 text-white duration-300 ease-in-out hover:shadow-1"
            >
              Lähetä viesti
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
