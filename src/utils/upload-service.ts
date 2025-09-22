import axios from "axios";

export type UploadProgressCallback = (uploadId: string, progress: number) => void;

export type UploadStatusCallback = (uploadId: string, status: 'uploaded' | 'failed', error?: string) => void;

export interface UploadCallbacks {
  onProgress: UploadProgressCallback;
  onStatus: UploadStatusCallback;
}

export async function processFileUpload(
  uploadId: string,
  file: File,
  callbacks: UploadCallbacks
): Promise<any> {
  try {
    // Upload file directly to Supabase
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', 'PJ1nkaufw0hZPyhN7bWCP'); // This should be dynamic
    
    const response = await axios.post('/api/upload', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        callbacks.onProgress(uploadId, percent);
      },
    });

    const uploadResult = response.data;
    const uploadInfo = uploadResult.asset;

    // Construct upload data from uploadInfo
    const uploadData = {
      fileName: uploadInfo.fileName,
      filePath: uploadInfo.supabasePath,
      fileSize: uploadInfo.fileSize,
      contentType: uploadInfo.fileType,
      metadata: { uploadedUrl: uploadInfo.supabaseUrl },
      folder: null,
      type: uploadInfo.fileType.split("/")[0],
      method: "direct",
      origin: "user",
      status: "uploaded",
      isPreview: false,
    };

    callbacks.onStatus(uploadId, 'uploaded');
    return uploadData;
  } catch (error) {
    callbacks.onStatus(uploadId, 'failed', (error as Error).message);
    throw error;
  }
}

export async function processUrlUpload(
  uploadId: string,
  url: string,
  callbacks: UploadCallbacks
): Promise<any[]> {
  try {
    // Start with 10% progress
    callbacks.onProgress(uploadId, 10);

    // For URL uploads, we'll create a placeholder asset
    // This is a simplified approach - you might want to download the URL content
    const uploadDataArray = [{
      fileName: url.split('/').pop() || 'url-upload',
      filePath: `urls/${Date.now()}-${Math.random().toString(36).substring(2)}`,
      fileSize: 0,
      contentType: 'application/octet-stream',
      metadata: { originalUrl: url },
      folder: null,
      type: 'url',
      method: "url",
      origin: "user",
      status: "uploaded",
      isPreview: false,
    }];

    // Update to 50% progress
    callbacks.onProgress(uploadId, 50);

    // Complete
    callbacks.onProgress(uploadId, 100);
    callbacks.onStatus(uploadId, 'uploaded');
    return uploadDataArray;
  } catch (error) {
    callbacks.onStatus(uploadId, 'failed', (error as Error).message);
    throw error;
  }
}

export async function processUpload(
  uploadId: string,
  upload: { file?: File; url?: string },
  callbacks: UploadCallbacks
): Promise<any> {
  if (upload.file) {
    return await processFileUpload(uploadId, upload.file, callbacks);
  }
  if (upload.url) {
    return await processUrlUpload(uploadId, upload.url, callbacks);
  }
  callbacks.onStatus(uploadId, 'failed', 'No file or URL provided');
  throw new Error('No file or URL provided');
} // h