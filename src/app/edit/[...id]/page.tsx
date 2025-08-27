'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Editor from "@/features/editor";

export default function EditPage({
	params,
}: { params: Promise<{ id: string[] }> }) {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [projectId, setProjectId] = useState<string | null>(null);
	const [isAuthorized, setIsAuthorized] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const getProjectId = async () => {
			const { id } = await params;
			const [sceneId] = id;
			setProjectId(sceneId);
		};
		getProjectId();
	}, [params]);

	useEffect(() => {
		if (status === 'loading' || !projectId) return;

		// If not authenticated, redirect to login
		if (!session) {
			router.push('/login');
			return;
		}

		// Check if user has access to this project
		const checkProjectAccess = async () => {
			try {
				console.log('🔍 Checking access for project:', projectId);
				const response = await fetch(`/api/scene/${projectId}`);
				console.log('📡 Response status:', response.status);
				
				if (!response.ok) {
					console.log('❌ Project access denied - redirecting to projects');
					// Project doesn't exist or user doesn't have access
					router.push('/projects');
					return;
				}

				const data = await response.json();
				console.log('📦 Response data:', data);
				
				if (data.success && data.project) {
					console.log('✅ Project access granted - showing editor');
					// Check if the project belongs to the current user
					// Since the API already filters by userId, if we get here, the user owns the project
					setIsAuthorized(true);
				} else {
					console.log('❌ Project not found - redirecting to projects');
					// Project not found
					router.push('/projects');
					return;
				}
			} catch (error) {
				console.error('❌ Error checking project access:', error);
				router.push('/projects');
				return;
			} finally {
				setLoading(false);
			}
		};

		checkProjectAccess();
	}, [session, status, projectId, router]);

	// Show loading while checking authentication and authorization
	if (status === 'loading' || loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading project...</p>
				</div>
			</div>
		);
	}

	// If not authenticated, this will redirect to login
	if (!session) {
		return null;
	}

	// If not authorized, this will redirect to projects
	if (!isAuthorized) {
		return null;
	}

	// User is authenticated and authorized, show the editor
	return <Editor id={projectId!} />;
}
