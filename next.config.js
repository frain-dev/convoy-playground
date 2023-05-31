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
    env: {
        PROJECT_TOKEN: process.env.PROJECT_TOKEN,
        API_URL: process.env.API_URL
    },
};

module.exports = nextConfig;
