import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow hot-reloading connections from your mobile device and pinggy
  allowedDevOrigins: ['172.20.10.3', 'vogid-102-89-82-213.run.pinggy-free.link'],
};

export default nextConfig;
