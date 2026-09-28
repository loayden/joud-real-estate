import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { HttpError } from "@/lib/api-response";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
};

function isPlaceholder(value: string | undefined) {
  if (!value) return true;
  const trimmed = value.trim();
  return !trimmed || trimmed === "xxx" || trimmed.includes("replace-with");
}

function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = (
    process.env.R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_R2_CDN_URL ||
    ""
  ).trim();

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !publicUrl ||
    isPlaceholder(accountId) ||
    isPlaceholder(accessKeyId) ||
    isPlaceholder(secretAccessKey) ||
    isPlaceholder(bucketName) ||
    isPlaceholder(publicUrl)
  ) {
    throw new HttpError(
      "Object storage is not configured",
      503,
      "R2_NOT_CONFIGURED",
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl: publicUrl.replace(/\/$/, ""),
  };
}

function getR2Client(config: R2Config) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
) {
  const config = getR2Config();
  const client = getR2Client(config);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return `${config.publicUrl}/${key}`;
}

export async function deleteFromR2(key: string | null | undefined) {
  if (!key) return;

  const config = getR2Config();
  const client = getR2Client(config);

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );
}
