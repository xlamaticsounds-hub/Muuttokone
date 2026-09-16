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
      { source: "/blog", destination: "/blogi", permanent: true },
      { source: "/blog/:path*", destination: "/blogi/:path*", permanent: true },
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
  // discord.js's WebSocket layer (@discordjs/ws) does an optional, lazily-
  // resolved `import("zlib-sync")` for compression — a native addon that
  // isn't installed (it's an optional perf enhancement, discord.js falls
  // back to no compression without it). The bundler tries to resolve it at
  // build time anyway and fails the whole build; marking the package
  // external makes Next leave it as a real Node import resolved at runtime
  // instead, same as any other server-only dependency with native pieces.
  serverExternalPackages: ["discord.js"],
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