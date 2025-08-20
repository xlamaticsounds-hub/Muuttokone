import { getPosts } from "@/sanity/sanity-utils";

export const getFirstBlogRoute = async (): Promise<string> => {
  const posts = await getPosts();
  const firstPostSlug = posts?.[0]?.slug?.current || "no-post-found"; // Fallback if no posts
  return `/blog/${firstPostSlug}`;
};
