'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ScalezLoader from '@/components/ui/scalez-loader';
import { 
  Plus, 
  Search, 
  Video, 
  Calendar,
  MoreVertical,
  Play,
  Edit,
  Trash,
  Copy,
  Settings,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Project {
  id: string;
  projectId: string;
  name: string;
  platform: string;
  aspectRatio: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  duration?: number;
  status: string;
}

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram-reel');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [renameProjectName, setRenameProjectName] = useState('');
  const [openingProjectId, setOpeningProjectId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Load projects from database
  useEffect(() => {
    if (session?.user?.id) {
      loadProjects();
    }
  }, [session]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 seconds
      
      const response = await fetch('/api/projects', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        console.error('Failed to load projects:', response.status);
        // Show user-friendly error message
        setProjects([]);
      }
    } catch (error: any) {
      console.error('Error loading projects:', error);
      if (error.name === 'AbortError') {
        console.error('Request timed out - database might be slow');
        // Show user-friendly error message
        setProjects([]);
      } else {
        // Show user-friendly error message
        setProjects([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName,
          platform: selectedPlatform,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects([data.project, ...projects]);
        setShowCreateModal(false);
        setNewProjectName('');
        // Navigate to editor with new project
        router.push(`/edit/${data.project.id}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectId));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const duplicateProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setProjects([data.project, ...projects]);
      }
    } catch (error) {
      console.error('Error duplicating project:', error);
    }
  };

  const renameProject = async () => {
    if (!selectedProject || !renameProjectName.trim()) return;

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: renameProjectName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(projects.map(p => 
          p.id === selectedProject.id 
            ? { ...p, name: data.project.name, updatedAt: data.project.updatedAt }
            : p
        ));
        setShowRenameModal(false);
        setSelectedProject(null);
        setRenameProjectName('');
      }
    } catch (error) {
      console.error('Error renaming project:', error);
    }
  };

  const handleRenameClick = (project: Project) => {
    setSelectedProject(project);
    setRenameProjectName(project.name);
    setShowRenameModal(true);
  };

  const handleOpenProject = (projectId: string) => {
    setOpeningProjectId(projectId);
    router.push(`/edit/${projectId}`);
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const platformConfigs = [
    { id: 'instagram-reel', name: 'Instagram Reel', aspectRatio: '9:16' },
    { id: 'instagram-post', name: 'Instagram Post', aspectRatio: '1:1' },
    { id: 'youtube-landscape', name: 'YouTube', aspectRatio: '16:9' },
    { id: 'facebook-feed', name: 'Facebook Feed', aspectRatio: '1.91:1' },
    { id: 'tiktok', name: 'TikTok', aspectRatio: '9:16' },
  ];

  if (status === 'loading') {
    return null; // Don't show loading screen for authentication
  }

  if (!session) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-black">Your Projects</h1>
            <p className="text-gray-600">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="bg-white border-gray-300 text-black hover:bg-gray-50">
              Select Projects
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New project
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-300 text-black placeholder-gray-500"
          />
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <ScalezLoader />
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-black">No projects yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start creating your first video project. Import media, edit, and export professional videos.
            </p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-black truncate">{project.name}</CardTitle>
                      <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-700">
                        {project.aspectRatio}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white border-gray-200 shadow-lg">
                        <DropdownMenuItem 
                          onClick={() => handleOpenProject(project.id)}
                          className="text-black hover:bg-blue-50"
                          disabled={openingProjectId === project.id}
                        >
                          {openingProjectId === project.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Edit className="w-4 h-4 mr-2" />
                          )}
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleRenameClick(project)}
                          className="text-black hover:bg-blue-50"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => duplicateProject(project.id)}
                          className="text-black hover:bg-blue-50"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteProject(project.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    {project.thumbnail ? (
                      <img 
                        src={project.thumbnail} 
                        alt={project.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Video className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                    <Button 
                      onClick={() => handleOpenProject(project.id)}
                      size="sm"
                      className="bg-black text-white hover:bg-gray-800"
                      disabled={openingProjectId === project.id}
                    >
                      {openingProjectId === project.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-1" />
                      )}
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4 text-black">Create New Project</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-black">Project Name</label>
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="bg-white border-gray-300 text-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-black">Platform</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-black"
                >
                  {platformConfigs.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name} ({platform.aspectRatio})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="outline"
                className="flex-1 bg-white border-gray-300 text-black"
              >
                Cancel
              </Button>
              <Button
                onClick={createProject}
                className="flex-1"
                disabled={!newProjectName.trim()}
              >
                Create Project
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Project Modal */}
      {showRenameModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4 text-black">Rename Project</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-black">Project Name</label>
                <Input
                  value={renameProjectName}
                  onChange={(e) => setRenameProjectName(e.target.value)}
                  placeholder="Enter new project name"
                  className="bg-white border-gray-300 text-black"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowRenameModal(false);
                  setSelectedProject(null);
                  setRenameProjectName('');
                }}
                variant="outline"
                className="flex-1 bg-white border-gray-300 text-black"
              >
                Cancel
              </Button>
              <Button
                onClick={renameProject}
                className="flex-1"
                disabled={!renameProjectName.trim()}
              >
                Rename
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen loading overlay when opening project */}
      {openingProjectId && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <ScalezLoader />
            <div className="text-black text-lg font-medium">Opening project...</div>
            <div className="text-gray-600 text-sm">Please wait while the editor loads</div>
          </div>
        </div>
      )}
    </div>
  );
}
