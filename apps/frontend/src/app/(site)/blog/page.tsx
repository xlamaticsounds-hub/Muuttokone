import { getPosts } from "@/sanity/sanity-utils";
import BlogItem from "@/components/Blog/BlogItem";
import { Metadata } from "next";
import Cta from "@/components/Cta";
import { integrations, messages } from "../../../../integrations.config";

export const metadata: Metadata = {
  title: `Blog - ${process.env.SITE_NAME}`,
  description: `This is Blog page for ${process.env.SITE_NAME}`,
};

const BlogGrid = async () => {
  const posts = integrations?.isSanityEnabled ? await getPosts() : [];

  return (
    <>
      <section className="py-20 lg:py-25 xl:py-30">
        <div className="mx-auto mt-12.5 max-w-1280 px-4 md:px-8 lg:mt-17.5 xl:px-0">
          <div className="grid grid-cols-1 gap-7.5 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
            {integrations?.isSanityEnabled ? (
              posts?.map((item, key) => <BlogItem key={key} blog={item} />)
            ) : (
              <p>{messages?.sanity}</p>
            )}
          </div>
        </div>
      </section>

      <Cta />
    </>
  );
};

export default BlogGrid;
