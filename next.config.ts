import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	reactStrictMode: false,
	experimental: {
		serverComponentsExternalPackages: ['mongoose'],
	},
	async headers() {
		return [
			{
				source: '/api/upload',
				headers: [
					{
						key: 'Content-Type',
						value: 'multipart/form-data',
					},
				],
			},
		];
	},
};

export default nextConfig;
