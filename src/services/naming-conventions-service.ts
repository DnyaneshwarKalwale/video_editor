import { createClient } from '@supabase/supabase-js';
import { NamingConfig } from '@/features/editor/variations/components/NamingConfiguration';

// Initialize Supabase client (adjust URL and key as needed)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserNamingConvention {
  id?: string;
  user_id: string;
  video_element_name: string;
  audio_element_name: string;
  text_element_name: string;
  image_element_name: string;
  font_element_name: string;
  speed_element_name: string;
  pattern_type: 'numbers' | 'letters_upper' | 'letters_lower' | 'roman' | 'custom';
  custom_sequence?: string[];
  platform_enabled: boolean;
  platform_custom_name?: string;
  created_at?: string;
  updated_at?: string;
}

export class NamingConventionsService {
  /**
   * Get user's naming convention with defaults
   */
  static async getUserNamingConvention(): Promise<NamingConfig> {
    try {
      const { data, error } = await supabase
        .from('user_naming_conventions_with_defaults')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching naming convention:', error);
        return this.getDefaultNamingConfig();
      }

      if (!data) {
        return this.getDefaultNamingConfig();
      }

      return this.convertToNamingConfig(data);
    } catch (error) {
      console.error('Error in getUserNamingConvention:', error);
      return this.getDefaultNamingConfig();
    }
  }

  /**
   * Save user's naming convention
   */
  static async saveUserNamingConvention(config: NamingConfig): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user');
        return false;
      }

      const conventionData = {
        user_id: user.id,
        video_element_name: config.elementNames.video,
        audio_element_name: config.elementNames.audio,
        text_element_name: config.elementNames.text,
        image_element_name: config.elementNames.image,
        font_element_name: config.elementNames.font,
        speed_element_name: config.elementNames.speed,
        pattern_type: config.pattern.type,
        custom_sequence: config.pattern.customSequence || [],
        platform_enabled: config.platform.enabled,
        platform_custom_name: config.platform.customName || null,
      };

      const { error } = await supabase
        .from('user_naming_conventions')
        .upsert(conventionData, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving naming convention:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveUserNamingConvention:', error);
      return false;
    }
  }

  /**
   * Reset user's naming convention to defaults
   */
  static async resetToDefaults(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user');
        return false;
      }

      const { error } = await supabase
        .from('user_naming_conventions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error resetting naming convention:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in resetToDefaults:', error);
      return false;
    }
  }

  /**
   * Convert database record to NamingConfig
   */
  private static convertToNamingConfig(data: UserNamingConvention): NamingConfig {
    return {
      elementNames: {
        video: data.video_element_name,
        audio: data.audio_element_name,
        text: data.text_element_name,
        image: data.image_element_name,
        font: data.font_element_name,
        speed: data.speed_element_name,
      },
      pattern: {
        type: data.pattern_type,
        customSequence: data.custom_sequence && data.custom_sequence.length > 0 
          ? data.custom_sequence 
          : undefined,
      },
      platform: {
        enabled: data.platform_enabled,
        customName: data.platform_custom_name || undefined,
      },
    };
  }

  /**
   * Get default naming configuration
   */
  private static getDefaultNamingConfig(): NamingConfig {
    return {
      elementNames: {
        video: 'video',
        audio: 'audio',
        text: 'text',
        image: 'image',
        font: 'font',
        speed: 'speed',
      },
      pattern: {
        type: 'letters_upper',
      },
      platform: {
        enabled: true,
        customName: undefined,
      },
    };
  }

  /**
   * Check if user has custom naming convention
   */
  static async hasCustomNamingConvention(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('user_naming_conventions')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking naming convention:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasCustomNamingConvention:', error);
      return false;
    }
  }
}

export default NamingConventionsService;
