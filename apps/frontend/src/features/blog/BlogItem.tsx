import React from "react";
import { Blog } from "@/types/blog";
import Image from "next/image";
import { imageBuilder } from "@/sanity/sanity-utils";
import Link from "next/link";
import { CalendarIcon, UserIcon } from "@/assets/icons";

const BlogItem = ({ blog }: { blog: Blog }) => {
  return (
    <article className="animate_top overflow-hidden rounded-lg shadow-3 dark:bg-blacksection dark:shadow-none">
      <div className="group relative z-1 block overflow-hidden">
        <div className="relative h-[200px] overflow-hidden xl:h-[260px]">
          <Image
            src={imageBuilder(blog?.mainImage).url()}
            alt="blog"
            className="w-full object-cover object-center"
            fill
            quality={100}
          />
        </div>

        <div className="absolute left-0 top-0 z-10 flex h-full w-full translate-y-full items-center justify-center rounded-t-lg bg-white/20 duration-300 ease-linear group-hover:translate-y-0">
          <div className="absolute left-0 top-0 -z-1 h-full w-full backdrop-blur-sm duration-100 ease-linear"></div>

          <Link
            href={`/blog/${blog?.slug.current}`}
            className="inline-flex rounded-full bg-primary px-7.5 py-3 font-medium text-white duration-300 ease-in-out hover:bg-secondary"
          >
            Read More
          </Link>
        </div>
      </div>

      <div className="relative p-7.5">
        <dl className="flex flex-wrap items-center gap-2 xl:gap-5">
          <dt className="sr-only">Author</dt>

          <dd>
            <Link
              href={`/blog/author/${blog?.author?.slug?.current}`}
              className="relative z-10 flex items-center gap-2"
            >
              <UserIcon />

              <span>{blog.author.name}</span>
            </Link>
          </dd>

          <dt className="sr-only">Published At</dt>
          <dd className="flex items-center gap-2">
            <CalendarIcon />

            <time dateTime={blog.publishedAt}>
              {new Date(blog?.publishedAt)
                .toDateString()
                .split(" ")
                .slice(1)
                .join(" ")}
            </time>
          </dd>
        </dl>

        <h4 className="mt-3 text-2xl font-medium text-black duration-300 ease-in-out hover:text-primary dark:text-white dark:hover:text-primary xl:w-[90%]">
          <Link href={`/blog/${blog?.slug.current}`} className="line-clamp-2">
            <span className="absolute inset-0"></span>
            {blog?.title}
          </Link>
        </h4>
      </div>
    </article>
  );
};

export default BlogItem;
