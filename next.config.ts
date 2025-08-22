import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	reactStrictMode: false,
	serverExternalPackages: ['mongoose'],
	// Configure for large file uploads
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
	// Increase the maximum payload size
	serverRuntimeConfig: {
		maxFileSize: '100mb',
	},
};

export default nextConfig;
