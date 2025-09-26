import React, { useState, useEffect } from 'react';
import { X, Eye, Copy, Save, Loader2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  TEMPLATE_PLACEHOLDERS, 
  DEFAULT_TEMPLATES, 
  validateTemplate, 
  previewTemplate,
  NamingTemplate,
  TemplatePlaceholder,
  generateTemplateFilename,
  extractTemplateValues
} from '@/utils/template-naming';

interface TemplateBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateChange?: (template: NamingTemplate) => void;
  currentTemplate?: NamingTemplate;
  variations?: any[]; // Current variations to show real examples
  projectData?: any; // Project data for context
}

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
  isOpen,
  onClose,
  onTemplateChange,
  currentTemplate,
  variations = [],
  projectData
}) => {
  const [template, setTemplate] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState('');
  const [validation, setValidation] = useState({ isValid: true, errors: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editableValues, setEditableValues] = useState<Record<string, string>>({});
  const [realExamples, setRealExamples] = useState<string[]>([]);
  const [userTemplates, setUserTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Load user templates
  const loadUserTemplates = async () => {
    try {
      const response = await fetch('/api/user/naming-templates', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading user templates:', error);
    }
  };

  // Save custom template
  const saveCustomTemplate = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/user/naming-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: templateName,
          description: description,
          template: template,
          customValues: editableValues
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Template saved successfully:', data);
        // Reload templates
        await loadUserTemplates();
        // Show success message
        alert('Template saved successfully!');
      } else {
        const error = await response.json();
        alert(`Error saving template: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with current template or default
  useEffect(() => {
    loadUserTemplates();
    
    if (currentTemplate) {
      setTemplate(currentTemplate.template);
      setTemplateName(currentTemplate.name);
      setDescription(currentTemplate.description);
    } else {
      setTemplate(DEFAULT_TEMPLATES[0].template);
      setTemplateName('Custom Template');
      setDescription('User-defined naming template');
    }
  }, [currentTemplate, isOpen]);

  // Generate real examples from variations
  useEffect(() => {
    if (template && variations.length > 0 && projectData) {
      const examples: string[] = [];
      const allValues: Record<string, Set<string>> = {}; // Track unique values for each placeholder
      const variationExamples: Array<{name: string, values: Record<string, string>}> = [];
      
      // Generate examples for all variations
      variations.forEach((variation, index) => {
        try {
          const context = {
            projectName: (() => {
              // Try to get project ID from URL
              try {
                const projectId = window.location.pathname.split('/')[2];
                return projectId || 'UntitledProject';
              } catch {
                return 'UntitledProject';
              }
            })(),
            textOverlays: variation.allTextOverlays || [],
            videoTrackItems: projectData.videoTrackItems || [],
            audioTrackItems: projectData.audioTrackItems || [],
            imageTrackItems: projectData.imageTrackItems || [],
            progressBarSettings: {
              position: 'Bottom',
              isVisible: true
            },
            metadata: variation.metadata
          };
          
          const extractedValues = extractTemplateValues(context);
          const filename = generateTemplateFilename(template, context);
          const cleanName = filename.replace('.mp4', '');
          
          examples.push(cleanName);
          variationExamples.push({ name: cleanName, values: extractedValues });
          
          // Track unique values for each placeholder
          Object.entries(extractedValues).forEach(([key, value]) => {
            if (!allValues[key]) {
              allValues[key] = new Set();
            }
            allValues[key].add(value);
          });
        } catch (error) {
          console.error('Error generating example:', error);
        }
      });
      
      // Convert sets to arrays and create editable values
      const editableValues: Record<string, string> = {};
      Object.entries(allValues).forEach(([key, valueSet]) => {
        const values = Array.from(valueSet);
        // Use the most common value as default, or first if all unique
        editableValues[key] = values[0];
      });
      
      setRealExamples(examples);
      setEditableValues(editableValues);
    }
  }, [template, variations, projectData]);

  // Update preview when template changes
  useEffect(() => {
    if (template) {
      const validationResult = validateTemplate(template);
      setValidation(validationResult);
      
      if (validationResult.isValid) {
        try {
          const previewResult = previewTemplate(template);
          setPreview(previewResult);
        } catch (error) {
          setPreview('Error generating preview');
        }
      } else {
        setPreview('Invalid template');
      }
    }
  }, [template]);

  const handleInsertPlaceholder = (placeholder: TemplatePlaceholder) => {
    const newTemplate = template + `{${placeholder.id}}`;
    setTemplate(newTemplate);
  };

  const handleLoadTemplate = (template: NamingTemplate) => {
    setTemplate(template.template);
    setTemplateName(template.name);
    setDescription(template.description);
  };

  const handleSaveTemplate = async () => {
    if (!validation.isValid) return;
    
    setIsLoading(true);
    try {
      const newTemplate: NamingTemplate = {
        id: currentTemplate?.id || `custom-${Date.now()}`,
        name: templateName,
        template: template,
        description: description
      };
      
      // Save to database (implement API call)
      const projectId = window.location.pathname.split('/')[2];
      const response = await fetch(`/api/projects/${projectId}/naming-template`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          template: newTemplate,
          customValues: editableValues // Include custom values
        }),
      });

      if (response.ok) {
        onTemplateChange?.(newTemplate);
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Failed to save template: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Network error while saving template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(template);
  };

  const handleValueChange = (key: string, value: string) => {
    setEditableValues(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Regenerate examples with new value - update ALL variations
    if (variations.length > 0 && projectData) {
      const examples: string[] = [];
      
      variations.forEach((variation) => {
        try {
          const context = {
            projectName: (() => {
              // Try to get project ID from URL
              try {
                const projectId = window.location.pathname.split('/')[2];
                return projectId || 'UntitledProject';
              } catch {
                return 'UntitledProject';
              }
            })(),
            textOverlays: variation.allTextOverlays || [],
            videoTrackItems: projectData.videoTrackItems || [],
            audioTrackItems: projectData.audioTrackItems || [],
            imageTrackItems: projectData.imageTrackItems || [],
            progressBarSettings: {
              position: 'Bottom',
              isVisible: true
            },
            metadata: variation.metadata
          };
          
          const extractedValues = extractTemplateValues(context);
          // Override with edited value
          extractedValues[key] = value;
          
          // Create custom context with edited values
          const customContext = { ...context, customValues: extractedValues };
          const filename = generateTemplateFilename(template, customContext);
          examples.push(filename.replace('.mp4', ''));
        } catch (error) {
          console.error('Error generating example:', error);
        }
      });
      
      setRealExamples(examples);
    }
  };

  const getAvailablePlaceholders = () => {
    if (!variations.length || !projectData) return TEMPLATE_PLACEHOLDERS;
    
    const available: TemplatePlaceholder[] = [];
    
    // Check what's actually available in the variations
    const hasText = variations.some(v => v.allTextOverlays?.length > 0);
    const hasVideo = projectData.videoTrackItems?.length > 0;
    const hasAudio = projectData.audioTrackItems?.length > 0;
    const hasImage = projectData.imageTrackItems?.length > 0;
    const hasProgressBar = projectData.progressBarSettings?.isVisible;
    
    // Always include these basic placeholders
    const alwaysInclude = ['ProjectName', 'VariationIndex', 'Timestamp'];
    
    TEMPLATE_PLACEHOLDERS.forEach(placeholder => {
      let shouldInclude = false;
      
      // Always include basic placeholders
      if (alwaysInclude.includes(placeholder.id)) {
        shouldInclude = true;
      } else {
        switch (placeholder.id) {
          case 'Headline':
          case 'FullText':
          case 'TextCount':
          case 'FontName':
          case 'FontSize':
          case 'FontWeight':
          case 'TextColor':
            shouldInclude = hasText;
            break;
          case 'VideoName':
          case 'VideoSpeed':
            shouldInclude = hasVideo;
            break;
          case 'AudioName':
          case 'AudioSpeed':
            shouldInclude = hasAudio;
            break;
          case 'ImageName':
            shouldInclude = hasImage;
            break;
          case 'ProgressBar':
            shouldInclude = hasProgressBar;
            break;
          case 'Duration':
          case 'AspectRatio':
          case 'Resolution':
            shouldInclude = true; // These are always available
            break;
        }
      }
      
      if (shouldInclude) {
        available.push(placeholder);
      }
    });
    
    return available;
  };

  const availablePlaceholders = getAvailablePlaceholders();
  const filteredPlaceholders = selectedCategory === 'all' 
    ? availablePlaceholders 
    : availablePlaceholders.filter(p => p.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'project', name: 'Project' },
    { id: 'content', name: 'Content' },
    { id: 'style', name: 'Style' },
    { id: 'media', name: 'Media' },
    { id: 'system', name: 'System' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Variation Names
          </h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Template Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Naming Template
            </label>
            <div className="space-y-2">
              {/* User's Custom Templates (shown first) */}
              {userTemplates.filter(t => !t.is_default).map((userTemplate) => (
                <div
                  key={userTemplate.id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    template === userTemplate.template 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-green-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                  onClick={() => {
                    setTemplate(userTemplate.template);
                    setTemplateName(userTemplate.name);
                    setDescription(userTemplate.description);
                    setEditableValues(userTemplate.custom_values || {});
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm text-green-700">{userTemplate.name}</div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Custom</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    {userTemplate.description}
                  </div>
                  <div className="font-mono text-xs text-gray-500 break-all">
                    {userTemplate.template}
                  </div>
                </div>
              ))}
              
              {/* Default Templates */}
              {userTemplates.filter(t => t.is_default).map((defaultTemplate) => (
                <div
                  key={defaultTemplate.id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    template === defaultTemplate.template 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                  onClick={() => {
                    setTemplate(defaultTemplate.template);
                    setTemplateName(defaultTemplate.name);
                    setDescription(defaultTemplate.description);
                    setEditableValues(defaultTemplate.custom_values || {});
                  }}
                >
                  <div className="font-medium text-sm">{defaultTemplate.name}</div>
                  <div className="text-xs text-gray-600 mb-1">
                    {defaultTemplate.description}
                  </div>
                  <div className="font-mono text-xs text-gray-500 break-all">
                    {defaultTemplate.template}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generated Names with Editable Values */}
          {realExamples.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Generated Names</h4>
              
              {/* Editable Values */}
              {Object.keys(editableValues).length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-sm text-gray-700 mb-3">Edit Values</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(editableValues).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-600 mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </label>
                        <Input
                          value={value}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                          className="w-full text-sm"
                          placeholder={`Enter ${key.toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Examples */}
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Generated names for all {realExamples.length} variations:
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {realExamples.map((example, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded border text-xs">
                      <span className="text-gray-600 w-6 text-right">
                        {index + 1}.
                      </span>
                      <span className="font-mono flex-1 break-all">
                        {example}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Custom Template Editor */}
          <div className="mt-6">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Advanced: Custom Template
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template
                  </label>
                  <textarea
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    placeholder="Enter your template with placeholders like {ProjectName}-{Headline}-{VideoSpeed}"
                    className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 font-mono text-sm"
                  />
                  
                  {/* Validation Errors */}
                  {!validation.isValid && (
                    <div className="mt-2 text-sm text-red-600">
                      {validation.errors.map((error, index) => (
                        <div key={index}>• {error}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Placeholders */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Available Placeholders</h5>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {filteredPlaceholders.map((placeholder) => (
                      <div
                        key={placeholder.id}
                        className="p-2 border border-gray-200 rounded cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        onClick={() => handleInsertPlaceholder(placeholder)}
                      >
                        <div className="font-mono text-xs font-medium">
                          {`{${placeholder.id}}`}
                        </div>
                        <div className="text-xs text-gray-600">
                          {placeholder.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={saveCustomTemplate}
            variant="outline"
            className="flex-1"
            disabled={!validation.isValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save as Custom'
            )}
          </Button>
          <Button
            onClick={handleSaveTemplate}
            className="flex-1"
            disabled={!validation.isValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Apply to Project
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;

