/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      // We add cheerio and undici here to prevent the parsing error
      serverComponentsExternalPackages: ["jsdom", "cheerio", "undici"],
    },
    // This helps avoid common webpack errors with node-specific modules
    webpack: (config) => {
        config.externals = [...(config.externals || []), "canvas", "jsdom"];
        return config;
    },
}

module.exports = nextConfig
