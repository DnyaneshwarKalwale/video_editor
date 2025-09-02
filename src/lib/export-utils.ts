import { supabase, TABLES, BUCKETS } from '@/lib/supabase';
import fs from 'fs';

export async function saveExportToDatabase(
  userId: string,
  projectId: string,
  variationId: string | null,
  outputPath: string,
  videoData: any
) {
  try {
    // Get file stats
    const stats = fs.statSync(outputPath);
    
    // Generate unique filename
    const fileName = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp4`;
    const filePath = `${userId}/exports/${fileName}`;

    // Upload the rendered video to Supabase Storage
    const fileBuffer = fs.readFileSync(outputPath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKETS.EXPORTS)
      .upload(filePath, fileBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(`Failed to upload to Supabase Storage: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKETS.EXPORTS)
      .getPublicUrl(filePath);

    // Save to database
    const { data: exportRecord, error: dbError } = await supabase
      .from(TABLES.EXPORTS)
      .insert({
        user_id: userId,
        project_id: projectId,
        variation_id: variationId,
        status: 'completed',
        supabase_url: urlData.publicUrl,
        supabase_path: filePath,
        settings: {
          width: videoData.platformConfig.width,
          height: videoData.platformConfig.height,
          fps: 24,
          duration: videoData.duration,
          format: 'mp4',
        },
        metadata: {
          fileSize: stats.size,
          renderTime: Date.now(),
          error: null,
        },
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Failed to save to database: ${dbError.message}`);
    }

    return {
      success: true,
      exportId: exportRecord.id,
      supabaseUrl: urlData.publicUrl,
      fileSize: stats.size,
    };
  } catch (error) {
    console.error('Error saving export to database:', error);
    throw error;
  }
}

export async function updateExportStatus(
  exportId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
  error?: string
) {
  try {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (error) {
      updateData.metadata = { error };
    }

    const { data: exportRecord, error: updateError } = await supabase
      .from(TABLES.EXPORTS)
      .update(updateData)
      .eq('id', exportId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update export status: ${updateError.message}`);
    }

    return {
      success: true,
      exportId: exportRecord.id,
      status: exportRecord.status,
    };
  } catch (error) {
    console.error('Error updating export status:', error);
    throw error;
  }
}
