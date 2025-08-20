import React from "react";
import Image from "next/image";
import { getPosts } from "@/sanity/sanity-utils";
import { imageBuilder } from "@/sanity/sanity-utils";
import Link from "next/link";

const RelatedPost = async () => {
  const posts = await getPosts();

  return (
    <>
      <div>
        <h4 className="mb-7.5 text-2xl text-black dark:text-white">
          Related Posts
        </h4>

        <div>
          {posts.slice(0, 3).map((post, key) => (
            <div className="mb-7.5 flex gap-4 2xl:gap-6" key={key}>
              <div className="relative mr-5 h-[70px] w-full max-w-[90px] overflow-hidden rounded-[3px] lg:mb-3 xl:mb-0">
                {post.mainImage ? (
                  <Image
                    src={imageBuilder(post.mainImage).url()}
                    className="w-full object-cover object-center"
                    alt="blog"
                    fill
                    quality={100}
                  />
                ) : (
                  "No image"
                )}
              </div>

              <div className="w-full">
                <h5>
                  <Link
                    href={`/blog/${post.slug.current}`}
                    className="text-title-xsm text-black duration-300 ease-in-out hover:text-primary dark:text-white dark:hover:text-primary"
                  >
                    {post.title.slice(0, 40)}...
                  </Link>
                </h5>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default RelatedPost;
