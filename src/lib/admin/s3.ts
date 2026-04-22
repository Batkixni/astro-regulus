import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/server/env";
import slugify from "slugify";

const s3 = new S3Client({
  region: env.s3Region,
  endpoint: env.s3Endpoint,
  credentials: {
    accessKeyId: env.s3AccessKeyId,
    secretAccessKey: env.s3SecretAccessKey,
  },
});

export const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

const sanitizeFilename = (name: string) =>
  slugify(name.replace(/\.[^/.]+$/, ""), { lower: true, strict: true }) || "asset";

export const createImagePresign = async (input: {
  slug: string;
  filename: string;
  contentType: string;
  size: number;
}) => {
  const ext = input.filename.split(".").pop()?.toLowerCase() || "jpg";
  const safeSlug = slugify(input.slug || "untitled", { lower: true, strict: true });
  const safeFilename = sanitizeFilename(input.filename);
  const key = `work/${safeSlug}/${Date.now()}-${safeFilename}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.size,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

  return {
    key,
    uploadUrl,
    publicUrl: `${env.s3PublicUrl}/${key}`,
  };
};
