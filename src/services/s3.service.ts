import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// =============================================================================
// S3 Client Configuration
// =============================================================================
// When running on EC2 with IAM role, credentials are automatically fetched
// When running locally, use environment variables or AWS credentials file
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-2",
  // Uncomment below if running locally without IAM role
  // credentials: {
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  // },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

// Supported image types
const SUPPORTED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

// =============================================================================
// Interface Definitions
// =============================================================================
export interface UploadResult {
  public_id: string;
  url: string;
  key: string;
}

export interface UploadOptions {
  folder?: string;
  contentType?: string;
  customFileName?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get file extension from content type
 */
const getExtensionFromContentType = (contentType: string): string => {
  return SUPPORTED_IMAGE_TYPES[contentType] || ".jpg";
};

/**
 * Detect content type from base64 data URL
 */
const detectContentType = (dataUrl: string): string => {
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match ? match[1] : "image/jpeg";
};

/**
 * Extract base64 data from data URL
 */
const extractBase64Data = (dataUrl: string): string => {
  return dataUrl.replace(/^data:[^;]+;base64,/, "");
};

/**
 * Generate S3 object key
 */
const generateKey = (folder: string | undefined, extension: string, customFileName?: string): string => {
  const fileName = customFileName || `${uuidv4()}${extension}`;
  return folder ? `${folder}/${fileName}` : fileName;
};

/**
 * Get public URL for S3 object
 */
const getPublicUrl = (key: string): string => {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-southeast-2"}.amazonaws.com/${key}`;
};

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Upload a file to S3 from base64 data URL
 * @param file - Base64 encoded data URL (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
 * @param options - Upload options including folder path
 * @returns Promise<UploadResult>
 */
export const uploadFile = async (
  file: string,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    const { folder, customFileName } = options;

    // Detect content type from data URL
    const contentType = options.contentType || detectContentType(file);
    const extension = getExtensionFromContentType(contentType);

    // Extract base64 data and convert to buffer
    const base64Data = extractBase64Data(file);
    const buffer = Buffer.from(base64Data, "base64");

    // Generate unique key
    const key = generateKey(folder, extension, customFileName);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // CacheControl: "max-age=31536000", // Cache for 1 year
    });

    await s3Client.send(command);

    const url = getPublicUrl(key);

    console.log(`[S3] Upload success: ${key}`);

    return {
      public_id: key,
      url,
      key,
    };
  } catch (error) {
    console.error("[S3] Upload error:", error);
    throw error;
  }
};

/**
 * Upload a file buffer to S3
 * @param buffer - File buffer
 * @param options - Upload options
 * @returns Promise<UploadResult>
 */
export const uploadBuffer = async (
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    const { folder, contentType = "image/jpeg", customFileName } = options;
    const extension = getExtensionFromContentType(contentType);
    const key = generateKey(folder, extension, customFileName);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const url = getPublicUrl(key);

    console.log(`[S3] Buffer upload success: ${key}`);

    return {
      public_id: key,
      url,
      key,
    };
  } catch (error) {
    console.error("[S3] Buffer upload error:", error);
    throw error;
  }
};

/**
 * Upload a file from multer (Express file upload)
 * @param file - Multer file object
 * @param folder - Optional folder path in S3
 * @returns Promise<UploadResult>
 */
export const uploadMulterFile = async (
  file: Express.Multer.File,
  folder?: string
): Promise<UploadResult> => {
  try {
    const extension = path.extname(file.originalname) || getExtensionFromContentType(file.mimetype);
    const key = generateKey(folder, extension);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    const url = getPublicUrl(key);

    console.log(`[S3] Multer upload success: ${key}`);

    return {
      public_id: key,
      url,
      key,
    };
  } catch (error) {
    console.error("[S3] Multer upload error:", error);
    throw error;
  }
};

/**
 * Delete a file from S3
 * @param fileKey - The S3 object key to delete
 * @returns Promise<boolean>
 */
export const deleteFile = async (fileKey: string): Promise<boolean> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);

    console.log(`[S3] Delete success: ${fileKey}`);
    return true;
  } catch (error) {
    console.error("[S3] Delete error:", error);
    return false;
  }
};

/**
 * Delete multiple files from S3
 * @param fileKeys - Array of S3 object keys to delete
 * @returns Promise<boolean[]>
 */
export const deleteFiles = async (fileKeys: string[]): Promise<boolean[]> => {
  const results = await Promise.all(fileKeys.map((key) => deleteFile(key)));
  return results;
};

/**
 * Generate a pre-signed URL for direct upload from client
 * @param fileName - Original file name
 * @param contentType - MIME type of the file
 * @param folder - Optional folder path
 * @param expiresIn - URL expiration time in seconds (default: 5 minutes)
 * @returns Promise<{ uploadUrl: string; key: string; publicUrl: string }>
 */
export const getPresignedUploadUrl = async (
  fileName: string,
  contentType: string,
  folder?: string,
  expiresIn: number = 300
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> => {
  try {
    const extension = path.extname(fileName) || getExtensionFromContentType(contentType);
    const key = generateKey(folder, extension);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    const publicUrl = getPublicUrl(key);

    console.log(`[S3] Pre-signed URL generated for: ${key}`);

    return {
      uploadUrl,
      key,
      publicUrl,
    };
  } catch (error) {
    console.error("[S3] Pre-signed URL error:", error);
    throw error;
  }
};

/**
 * Get a pre-signed URL for downloading a private object
 * @param key - S3 object key
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Promise<string>
 */
export const getPresignedDownloadUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return url;
  } catch (error) {
    console.error("[S3] Pre-signed download URL error:", error);
    throw error;
  }
};

// =============================================================================
// Specific Upload Functions for LaptopShop
// =============================================================================

/**
 * Upload product image
 */
export const uploadProductImage = async (file: string | Express.Multer.File): Promise<UploadResult> => {
  if (typeof file === "string") {
    return uploadFile(file, { folder: "products" });
  }
  return uploadMulterFile(file, "products");
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (file: string | Express.Multer.File): Promise<UploadResult> => {
  if (typeof file === "string") {
    return uploadFile(file, { folder: "avatars" });
  }
  return uploadMulterFile(file, "avatars");
};

/**
 * Delete product image
 */
export const deleteProductImage = async (key: string): Promise<boolean> => {
  return deleteFile(key);
};

/**
 * Delete user avatar
 */
export const deleteAvatar = async (key: string): Promise<boolean> => {
  return deleteFile(key);
};

// =============================================================================
// Default Export
// =============================================================================
export default {
  uploadFile,
  uploadBuffer,
  uploadMulterFile,
  deleteFile,
  deleteFiles,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  uploadProductImage,
  uploadAvatar,
  deleteProductImage,
  deleteAvatar,
};
