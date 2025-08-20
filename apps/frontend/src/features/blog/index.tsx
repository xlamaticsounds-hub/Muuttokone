import React from "react";
import BlogItem from "@/components/Blog/BlogItem";
import { getPosts } from "@/sanity/sanity-utils";
import SectionTitle from "@/components/SectionTitle";

const Blog = async () => {
  const posts = await getPosts();

  return (
    <section className="py-20 lg:py-25 xl:py-30">
      <SectionTitle
        title="Latest Blogs & News"
        subtitle="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using."
      />

      <div className="mx-auto mt-12.5 max-w-1280 px-4 md:px-8 lg:mt-17.5 xl:px-0">
        <div className="grid grid-cols-1 gap-7.5 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
          {/* <!-- blog item --> */}
          {posts?.length > 0 ? (
            posts
              ?.slice(0, 3)
              .map((item, key: number) => <BlogItem blog={item} key={key} />)
          ) : (
            <p>No posts found</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Blog;
