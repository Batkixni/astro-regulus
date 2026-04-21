import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: import.meta.env.S3_REGION || "auto",
  endpoint: import.meta.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.S3_ACCESS_KEY,
    secretAccessKey: import.meta.env.S3_SECRET_KEY,
  },
});

export async function uploadToS3(file: File, folder = "uploads"): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "png";
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const contentType = file.type || "application/octet-stream";

  await client.send(
    new PutObjectCommand({
      Bucket: import.meta.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    })
  );

  const publicUrl = import.meta.env.S3_PUBLIC_URL;
  return `${publicUrl}/${key}`;
}
