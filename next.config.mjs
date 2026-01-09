/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.10.248", // your LAN origin host
  ],
};

export default nextConfig;
