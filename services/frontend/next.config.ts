/** @type {import('next').NextConfig} */
const nextConfig = {
	turbopack: {},  // Fix Next.js 16 warning

	async rewrites() {
		if (typeof window === 'undefined') {
			const backendUrl = process.env.BACKEND_URL || 'http://backend:3000';
			return [
				{
					source: '/api/:path*',
					destination: `${backendUrl}/api/:path*`,
				},
			];
		}
		return [];
	},
};

module.exports = nextConfig;
