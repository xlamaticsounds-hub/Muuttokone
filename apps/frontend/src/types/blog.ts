// Local fallback for PortableTextBlock to avoid requiring 'sanity' types in this repo
export type PortableTextBlock = {
  _type?: string;
  _key?: string;
  children?: Array<{ _type?: string; text: string; marks?: string[] }>;
  [key: string]: any;
};

export type Author = {
  name: string;
  image: string;
  bio?: string;
  slug: {
    current: string;
  };
  _id?: number | string;
  _ref?: number | string;
};

export type Blog = {
  _id: number;
  title: string;
  slug: any;
  metadata: string;
  body: PortableTextBlock[];
  mainImage: any;
  author: Author;
  tags: string[];
  publishedAt: string;
};
