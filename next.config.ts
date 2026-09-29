import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Upload do logo (até 1 MB) chega por Server Action; o padrão de 1 MB não deixa folga para o multipart.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
