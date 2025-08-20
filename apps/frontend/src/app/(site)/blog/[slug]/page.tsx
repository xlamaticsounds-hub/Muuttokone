import React from "react";
import { getPost, getPosts, imageBuilder } from "@/sanity/sanity-utils";
import RenderBodyContent from "@/components/Blog/RenderBodyContent";
import Link from "next/link";
import Image from "next/image";
import { structuredAlgoliaHtmlData } from "@/libs/crawlIndex";
import SocialShare from "@/components/Blog/SocialShare";
import Cta from "@/components/Cta";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(props: Props) {
  const params = await props.params;
  const { slug } = params;
  const post = await getPost(slug);
  const siteURL = process.env.SITE_URL;
  const siteName = process.env.SITE_NAME;
  const authorName = process.env.AUTHOR_NAME;

  if (post) {
    return {
      title: `${post.title || "Single Post Page"} | ${siteName}`,
      description: `${post.metadata?.slice(0, 136)}...`,
      author: authorName,

      robots: {
        index: true,
        follow: true,
        nocache: true,
        googleBot: {
          index: true,
          follow: false,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },

      openGraph: {
        title: `${post.title} | ${siteName}`,
        description: post.metadata,
        url: `${siteURL}/blog/${post?.slug?.current}`,
        siteName: siteName,
        images: [
          {
            url: imageBuilder(post.mainImage).url(),
            width: 1800,
            height: 1600,
            alt: post.title,
          },
        ],
        locale: "en_US",
        type: "article",
      },

      twitter: {
        card: "summary_large_image",
        title: `${post.title} | ${siteName}`,
        description: `${post.metadata?.slice(0, 136)}...`,
        creator: `@${authorName}`,
        site: `@${siteName}`,
        images: [imageBuilder(post?.mainImage).url()],
        // @ts-ignore
        url: `${siteURL}/blog/${post?.slug?.current}`,
      },
    };
  } else {
    return {
      title: "Not Found",
      description: "No blog article has been found",
    };
  }
}

const SingleBlog = async (props: Props) => {
  const params = await props.params;
  const { slug } = params;
  const post = await getPost(slug);
  const posts = await getPosts();

  await structuredAlgoliaHtmlData({
    type: "blog",
    title: post?.title || "",
    htmlString: post?.metadata || "",
    pageUrl: `${process.env.SITE_URL}blog/${post?.slug?.current}`,
    imageURL: imageBuilder(post?.mainImage).url() as string,
  });

  return (
    <>
      {/* <!-- ===== Blog Details Section Start ===== --> */}
      <section className="pt-35 pb-20 lg:pt-45 lg:pb-25 xl:pt-50 xl:pb-30">
        <div className="mx-auto max-w-1390 px-4 md:px-8 2xl:px-0">
          <div className="flex flex-col gap-7.5 lg:flex-row xl:gap-17.5">
            <div className="mx-auto w-full max-w-[945px]">
              <div className="animate_top">
                <div className="w-full overflow-hidden rounded-lg">
                  <Image
                    className="h-full w-full rounded-lg object-cover object-center"
                    src={imageBuilder(post.mainImage).url() as string}
                    alt={post.title}
                    width={946}
                    height={480}
                  />
                </div>

                <h2 className="2xl:text-title-lg mt-11 mb-5 text-3xl font-medium text-black dark:text-white">
                  {post.title}
                </h2>

                <ul className="mb-10 flex flex-wrap gap-5 2xl:gap-15">
                  <li>
                    <span className="block text-black dark:text-white">
                      Author:{" "}
                    </span>{" "}
                    <Link href={`/blog/author/${post?.author?.slug?.current}`}>
                      {post?.author?.name}
                    </Link>
                  </li>
                  <li>
                    <span className="block text-black dark:text-white">
                      Published On:{" "}
                    </span>{" "}
                    <Link href={`/blog/author/${post?.author?.slug?.current}`}>
                      {new Date(post?.publishedAt as string)
                        .toDateString()
                        .split(" ")
                        .slice(1)
                        .join(" ")}
                    </Link>
                  </li>
                  <li>
                    <span className="block text-black dark:text-white">
                      Category:{" "}
                    </span>{" "}
                    Events
                  </li>
                </ul>

                <div>
                  <article className="prose dark:prose-invert max-w-none">
                    <RenderBodyContent post={post as any} />
                  </article>

                  <SocialShare url={posts} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Cta />
    </>
  );
};

export default SingleBlog;
