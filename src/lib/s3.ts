import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let _client: S3Client | null = null;

function getClient() {
  if (!_client) {
    const endpoint = import.meta.env.S3_ENDPOINT;
    _client = new S3Client({
      region: import.meta.env.S3_REGION ?? 'auto',
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      credentials: {
        accessKeyId: import.meta.env.S3_ACCESS_KEY,
        secretAccessKey: import.meta.env.S3_SECRET_KEY,
      },
    });
  }
  return _client;
}

export async function getPresignedUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: import.meta.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(getClient(), command, { expiresIn: 300 });
  const publicUrl = `${import.meta.env.S3_PUBLIC_URL}/${key}`;
  return { uploadUrl, publicUrl };
}
