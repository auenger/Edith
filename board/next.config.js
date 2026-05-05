/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy API requests to Fastify backend during development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
      {
        source: "/ws/:path*",
        destination: "http://localhost:3001/ws/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
