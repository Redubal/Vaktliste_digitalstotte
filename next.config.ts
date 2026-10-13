import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sikkerhetshoder på alle sider. X-Frame-Options hindrer at Admin bygges inn i en annen side og
  // klikkes på uten at brukeren ser det.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
