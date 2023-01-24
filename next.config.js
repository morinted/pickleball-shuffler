/** @type {import('next').NextConfig} */
const withPwa = require("next-pwa")({
  dest: "public",
});
const nextConfig = withPwa({
  reactStrictMode: true,
});

module.exports = nextConfig;
