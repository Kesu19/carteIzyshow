/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'user-assets.sharetribe.com',
        port: '',
        pathname: '/images/**', // Adjust the pathname pattern as per your needs
      },
    ],
  },
}

module.exports = nextConfig