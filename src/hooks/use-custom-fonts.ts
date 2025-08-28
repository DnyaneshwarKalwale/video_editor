import { useState, useEffect } from 'react';
import { IFont } from '@/features/editor/interfaces/editor';
import { loadFonts } from '@/features/editor/utils/fonts';

export function useCustomFonts() {
  const [customFonts, setCustomFonts] = useState<IFont[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomFonts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/fonts/upload');
      const result = await response.json();

      if (response.ok) {
        setCustomFonts(result.fonts || []);
        
        // Load custom fonts into the browser
        if (result.fonts && result.fonts.length > 0) {
          const fontsToLoad = result.fonts.map((font: IFont) => ({
            name: font.postScriptName,
            url: font.url,
          }));
          
          try {
            await loadFonts(fontsToLoad);
          } catch (loadError) {
            console.warn('Failed to load some custom fonts:', loadError);
          }
        }
      } else {
        setError(result.error || 'Failed to fetch custom fonts');
      }
    } catch (err) {
      console.error('Error fetching custom fonts:', err);
      setError('Failed to fetch custom fonts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomFonts();
  }, []);

  const refreshFonts = () => {
    fetchCustomFonts();
  };

  return {
    customFonts,
    isLoading,
    error,
    refreshFonts,
  };
}
