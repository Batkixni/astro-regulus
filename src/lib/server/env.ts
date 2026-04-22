const read = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  authSecret: read('BETTER_AUTH_SECRET', process.env.JWT_SECRET),
  authUrl: process.env.BETTER_AUTH_URL || process.env.SITE_URL || 'http://localhost:4321',
  githubClientId: read('GITHUB_CLIENT_ID'),
  githubClientSecret: read('GITHUB_CLIENT_SECRET'),
  githubOwner: read('GITHUB_OWNER'),
  githubRepo: read('GITHUB_REPO'),
  githubToken: read('GITHUB_TOKEN'),
  githubDefaultBranch: process.env.GITHUB_BRANCH || 'main',
  adminAllowlist: (process.env.ADMIN_GITHUB_ALLOWLIST || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
  s3Region: read('S3_REGION'),
  s3Endpoint: read('S3_ENDPOINT'),
  s3AccessKeyId: read('S3_ACCESS_KEY'),
  s3SecretAccessKey: read('S3_SECRET_KEY'),
  s3Bucket: read('S3_BUCKET'),
  s3PublicUrl: read('S3_PUBLIC_URL').replace(/\/$/, ''),
};
