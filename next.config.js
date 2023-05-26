/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
    sassOptions: {
        includePaths: [path.join(__dirname, "styles")],
    },
    experimental: {
        appDir: true,
    },
    compiler: {
        styledComponents: true,
    },
};

module.exports = nextConfig;
