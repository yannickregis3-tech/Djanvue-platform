import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
function required(name: string): string { const value = process.env[name]; if (!value) throw new Error(`Missing server configuration: ${name}`); return value; }
/** Server-only Cloudflare R2 client. Never import from a Client Component. */
export function createR2Client() { const accountId = required("R2_ACCOUNT_ID"); return new S3Client({ region: "auto", endpoint: process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId: required("R2_ACCESS_KEY_ID"), secretAccessKey: required("R2_SECRET_ACCESS_KEY") } }); }
export function getR2BucketName(): string { return required("R2_BUCKET_NAME"); }
