import type { NextConfig } from "next";
const path = require("path");

const nextConfig: NextConfig = {
    /* config options here */
    devIndicators: false,
    outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
