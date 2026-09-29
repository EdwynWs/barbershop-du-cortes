const backendUrl =
    process.env.NODE_ENV === 'production'
        ? 'https://barbershop-du-cortes-api.onrender.com'
        : 'http://localhost:4000';

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