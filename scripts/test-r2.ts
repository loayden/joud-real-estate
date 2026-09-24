import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

function requireRealEnv(name: string) {
  const value = process.env[name];

  if (!value || value.includes("xxx") || value.includes("replace-with")) {
    throw new Error(`${name} is not configured with a real value.`);
  }

  return value;
}

async function main() {
  const accountId = requireRealEnv("R2_ACCOUNT_ID");
  const accessKeyId = requireRealEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireRealEnv("R2_SECRET_ACCESS_KEY");
  const bucketName = requireRealEnv("R2_BUCKET_NAME");
  const key = `healthchecks/r2-test-${Date.now()}.txt`;

  const client = new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    region: "auto",
  });

  await client.send(
    new PutObjectCommand({
      Body: Buffer.from("Joud R2 connectivity test\n"),
      Bucket: bucketName,
      ContentType: "text/plain; charset=utf-8",
      Key: key,
    }),
  );

  await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));

  console.log(`R2 upload/delete test succeeded for ${key}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
