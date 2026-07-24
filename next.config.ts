import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ada package-lock.json lain di home directory, jadi Turbopack sempat salah
  // nebak root workspace-nya. Dikunci ke folder project ini.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
