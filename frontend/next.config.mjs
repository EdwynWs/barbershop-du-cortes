const backendUrl = (
    process.env.API_PROXY_URL || 'http://localhost:4000'
).replace(/\/+$/, '');

const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${backendUrl}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;