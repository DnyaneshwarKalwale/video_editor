import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Eye, Copy, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  TEMPLATE_PLACEHOLDERS, 
  DEFAULT_TEMPLATES, 
  validateTemplate, 
  previewTemplate,
  NamingTemplate,
  TemplatePlaceholder 
} from '@/utils/template-naming';

interface TemplateBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateChange?: (template: NamingTemplate) => void;
  currentTemplate?: NamingTemplate;
}

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
  isOpen,
  onClose,
  onTemplateChange,
  currentTemplate
}) => {
  const [template, setTemplate] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState('');
  const [validation, setValidation] = useState({ isValid: true, errors: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Initialize with current template or default
  useEffect(() => {
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
        body: JSON.stringify(newTemplate),
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

  const filteredPlaceholders = selectedCategory === 'all' 
    ? TEMPLATE_PLACEHOLDERS 
    : TEMPLATE_PLACEHOLDERS.filter(p => p.category === selectedCategory);

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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Template Builder
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

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
            {/* Left Column - Template Builder */}
            <div className="space-y-4">
              {/* Template Info */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter template description"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Template Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Template
                  </label>
                  <Button
                    onClick={handleCopyTemplate}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="Enter your template with placeholders like {ProjectName}-{Headline}-{VideoSpeed}"
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 font-mono text-sm"
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

              {/* Placeholders */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Placeholders</h4>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {filteredPlaceholders.map((placeholder) => (
                    <div
                      key={placeholder.id}
                      className="p-2 border border-gray-200 rounded cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      onClick={() => handleInsertPlaceholder(placeholder)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-sm font-medium">
                            {`{${placeholder.id}}`}
                          </div>
                          <div className="text-xs text-gray-600">
                            {placeholder.description}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {placeholder.example}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Preview & Presets */}
            <div className="space-y-4">
              {/* Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <h4 className="font-medium text-gray-900">Preview</h4>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Generated filename:</div>
                  <div className="font-mono text-sm bg-white p-2 rounded border break-all">
                    {preview}
                  </div>
                </div>
                
                {validation.isValid && (
                  <div className="mt-3 text-xs text-green-600">
                    ✓ Template is valid
                  </div>
                )}
              </div>

              {/* Preset Templates */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Preset Templates</h4>
                <div className="space-y-2">
                  {DEFAULT_TEMPLATES.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-3 border border-gray-200 rounded cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      onClick={() => handleLoadTemplate(preset)}
                    >
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-gray-600 mb-1">
                        {preset.description}
                      </div>
                      <div className="font-mono text-xs text-gray-500 break-all">
                        {preset.template}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
                Save Template
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;

