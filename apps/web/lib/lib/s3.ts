import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucket = process.env.AWS_S3_BUCKET;

if (!region) {
  console.warn("AWS_REGION is not configured");
}

if (!accessKeyId) {
  console.warn("AWS_ACCESS_KEY_ID is not configured");
}

if (!secretAccessKey) {
  console.warn("AWS_SECRET_ACCESS_KEY is not configured");
}

if (!bucket) {
  console.warn("AWS_S3_BUCKET is not configured");
}

export const s3 = new S3Client({
  region,
  credentials:
    accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
        }
      : undefined,
});

export async function getUploadUrl(key: string, contentType: string) {
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not configured");
  }

  if (!region) {
    throw new Error("AWS_REGION is not configured");
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 300,
  });

  return {
    uploadUrl,
    key,
    fileUrl: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
  };
}

export async function getDownloadUrl(key: string, expiresIn = 300) {
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not configured");
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const downloadUrl = await getSignedUrl(s3, command, {
    expiresIn,
  });

  return {
    downloadUrl,
    key,
  };
}

export async function deleteFile(key: string) {
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not configured");
  }

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3.send(command);

  return {
    success: true,
    key,
  };
}

export function getPublicFileUrl(key: string) {
  if (!bucket || !region) {
    throw new Error("AWS bucket or region is not configured");
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}