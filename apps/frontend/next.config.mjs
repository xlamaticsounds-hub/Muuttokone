import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      // @.muuttokone.fi redirect -> www.muuttokone.fi
      { source: "/", has: [{ type: "host", value: "muuttokone.fi" }], destination: "https://www.muuttokone.fi/", permanent: true },
      {
        source: "/:path*",
        has: [{ type: "host", value: "muuttokone.fi" }],
        destination: "https://www.muuttokone.fi/:path*",
        permanent: true,
      },

  // Legacy quotes route
  { source: "/pyyda-tarjous", destination: "/tarjouspyynto", permanent: true },
      // Legacy EN -> FI route alignment
      { source: "/services", destination: "/palvelut", permanent: true },
      { source: "/contact", destination: "/yhteystiedot", permanent: true },

      // Finnish aliases
      { source: "/blogi", destination: "/blog", permanent: true },
      { source: "/ota-yhteytta", destination: "/yhteystiedot", permanent: true },
  { source: "/ukk", destination: "/usein-kysytyt-kysymykset", permanent: true },

    ];
  },
  images: {
    remotePatterns: [],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"]
  
  
};



export { nextConfig };

/** @type {import('next').NextConfig} */
const config  = {
  // Configure `pageExtensions` to include markdown and MDX files
  ...nextConfig,
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // Optionally, add any other Next.js config below
}
 
const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});
 
// Merge MDX config with Next.js config
export default withMDX(config)