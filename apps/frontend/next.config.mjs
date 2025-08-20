/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
  // Legacy quotes route
  { source: "/pyyda-tarjous", destination: "/tarjouspyynto", permanent: true },
      // Legacy EN -> FI route alignment
      { source: "/services", destination: "/palvelut", permanent: true },
      { source: "/services/residential-moves", destination: "/kotimuutto", permanent: true },
      { source: "/services/business-moves", destination: "/yritysmuutto", permanent: true },
      { source: "/pricing", destination: "/hinnat", permanent: true },
      { source: "/contact", destination: "/yhteystiedot", permanent: true },

      // Finnish aliases
      { source: "/blogi", destination: "/blog", permanent: true },
      { source: "/ota-yhteytta", destination: "/yhteystiedot", permanent: true },
  { source: "/usein-kysytyt-kysymykset", destination: "/ukk", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Allow Directus assets (adjust hostname if using custom domain)
      {
        protocol: "http",
        hostname: "localhost",
        port: "8055",
      },
      {
        protocol: "http",
        hostname: "192.168.1.110",
        port: "8055",
      },
      {
        protocol: "http",
        hostname: "mgmt.muuttokone.fi",
        port: "8055",
      },
      {
        protocol: "https",
        hostname: "mgmt.muuttokone.fi",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
