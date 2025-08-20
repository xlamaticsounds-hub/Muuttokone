import { getPostsByAuthor } from "@/sanity/sanity-utils";
import BlogItem from "@/components/Blog/BlogItem";
import Pagination from "@/components/Pagination";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(props: Props) {
  const params = await props.params;
  const { slug } = params;

  return {
    title: `Author: ${slug} | Blog`,
    description: `Author: ${slug} | Blog`,
  };
}

const BlogGrid = async (props: Props) => {
  const params = await props.params;

  const { slug } = params;

  const posts = await getPostsByAuthor(slug);

  return (
    <>
      <section className="py-20 lg:py-25 xl:py-30">
        <div className="mx-auto mt-12.5 max-w-1280 px-4 md:px-8 lg:mt-17.5 xl:px-0">
          <div className="grid grid-cols-1 gap-7.5 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
            {/* Blog Item */}
            {posts?.length ? (
              posts?.map((item, key) => <BlogItem key={key} blog={item} />)
            ) : (
              <p>No posts available!</p>
            )}
          </div>

          <Pagination totalPages={12} />
        </div>
      </section>
    </>
  );
};

export default BlogGrid;
