"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ScalezLoader from "@/components/ui/scalez-loader";

export default function HomePage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === 'loading') return;
		
		if (session) {
			// User is authenticated
			if (session.user.isAdmin) {
				// Admin user - redirect to admin dashboard
				router.push('/admin');
			} else {
				// Regular user - redirect to projects page
				router.push('/projects');
			}
		} else {
			// User is not authenticated, redirect to login page
			router.push('/login');
		}
	}, [session, status, router]);

	// Show loading while checking authentication
	return (
		<div className="min-h-screen bg-white flex items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<ScalezLoader />
			</div>
		</div>
	);
}
