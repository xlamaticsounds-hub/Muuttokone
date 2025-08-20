"use client";

import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";
import testimonialData from "@/components/Testimonials/testimonialData";

export default function TestimonialSlider() {
  return (
    <>
      <div className="animate_top -m-20">
        <Swiper
          className="swiper mySwiper relative z-20 p-20!"
          modules={[Navigation]}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          }}
          loop={true}
          slidesPerView={1}
          spaceBetween={80}
        >
          {testimonialData.map((testimonial, index) => (
            <SwiperSlide key={index}>
              <div className="relative rounded-lg bg-white p-9 pr-10 dark:bg-blacksection">
                <span className="absolute right-0 top-0 block h-1/2 w-1.5 rounded-tr-lg bg-primary"></span>
                <span className="absolute bottom-0 right-0 block h-1/2 w-1.5 rounded-br-lg bg-secondary"></span>

                <div className="flex flex-col gap-7.5 md:flex-row md:items-center md:justify-between lg:gap-12">
                  <Image
                    className="shrink-0"
                    src={testimonial.authorImage}
                    alt="User"
                    width={300}
                    height={300}
                  />

                  <div>
                    <Image
                      src="/images/icon/icon-quote.svg"
                      alt="Quote"
                      width={56}
                      height={56}
                    />
                    <p className="mb-10 mt-5.5 text-lg font-medium italic lg:text-2xl">
                      {testimonial.quote}
                    </p>

                    <div className="flex items-end justify-between">
                      <div>
                        <span className="mb-1 block text-lg font-medium text-black dark:text-white">
                          {testimonial.authorName}
                        </span>
                        <span className="block">{testimonial.authorRole}</span>
                      </div>

                      <Image
                        className="opacity-100"
                        src="/images/brand/brand-light-02.svg"
                        alt="Brand"
                        width={133}
                        height={26}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="-mt-7.5 flex items-center justify-center gap-4">
          <button
            aria-label="Testimonial prev arrow"
            className="swiper-button-prev group"
          >
            <svg
              className="fill-body group-hover:fill-white"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.52366 7.83336L7.99366 12.3034L6.81533 13.4817L0.333663 7.00002L6.81533 0.518357L7.99366 1.69669L3.52366 6.16669L13.667 6.16669L13.667 7.83336L3.52366 7.83336Z"
                fill=""
              />
            </svg>
          </button>
          <button
            aria-label="Testimonial next arrow"
            className="swiper-button-next group"
          >
            <svg
              className="fill-body group-hover:fill-white"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.4763 6.16664L6.00634 1.69664L7.18467 0.518311L13.6663 6.99998L7.18467 13.4816L6.00634 12.3033L10.4763 7.83331H0.333008V6.16664H10.4763Z"
                fill=""
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
