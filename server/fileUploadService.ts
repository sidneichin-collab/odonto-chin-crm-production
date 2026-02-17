/**
 * File Upload Service
 * 
 * Serviço para upload de arquivos para S3
 */

import { storagePut } from "./storage";

interface UploadFileParams {
  fileName: string;
  fileBuffer: Buffer;
  contentType: string;
  userId: string;
}

interface UploadFileResponse {
  success: boolean;
  url?: string;
  fileKey?: string;
  error?: string;
}

/**
 * Faz upload de arquivo para S3
 */
export async function uploadFileToS3(params: UploadFileParams): Promise<UploadFileResponse> {
  const { fileName, fileBuffer, contentType, userId } = params;

  try {
    // Gerar nome único para o arquivo (evitar sobrescrita)
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExtension = fileName.split('.').pop();
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50); // Limitar tamanho do nome
    
    const fileKey = `reminders/${userId}/${timestamp}-${randomSuffix}-${sanitizedFileName}`;

    console.log(`[FileUpload] Uploading file: ${fileName} (${contentType}) to S3 as ${fileKey}`);

    // Upload para S3
    const result = await storagePut(fileKey, fileBuffer, contentType);

    if (!result || !result.url) {
      console.error(`[FileUpload] Failed to upload file: No URL returned`);
      return {
        success: false,
        error: "Erro ao fazer upload do arquivo para S3"
      };
    }

    console.log(`[FileUpload] File uploaded successfully: ${result.url}`);

    return {
      success: true,
      url: result.url,
      fileKey: result.key
    };
  } catch (error: any) {
    console.error(`[FileUpload] Error uploading file:`, error);
    return {
      success: false,
      error: error.message || "Erro desconhecido ao fazer upload"
    };
  }
}

/**
 * Determina o tipo de mídia baseado no contentType
 */
export function getMediaType(contentType: string): "image" | "document" | "video" | "audio" {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  return "document"; // PDF e outros
}
