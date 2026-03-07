/**
 * Build-time script: encrypts the GitHub PAT per user using AES-256-GCM.
 *
 * Env vars (from .env.local or GitHub Actions secrets):
 *   GH_PAT          - Fine-grained GitHub Personal Access Token
 *   AUTH_USERS       - Comma-separated "username:password" pairs
 *                      e.g. "Nick:mypass123,Alex:theirpass456"
 *
 * Output: src/auth/credentials.generated.json
 */

import { randomBytes, pbkdf2Sync, createCipheriv } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUTPUT = resolve(ROOT, "src/auth/credentials.generated.json");

function loadEnvFile() {
  const envPath = resolve(ROOT, ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function encrypt(plaintext, password) {
  const salt = randomBytes(16);
  const key = pbkdf2Sync(password, salt, 100_000, 32, "sha256");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(plaintext, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    data: encrypted.toString("base64"),
    tag: authTag.toString("base64"),
  };
}

loadEnvFile();

const pat = process.env.GH_PAT;
const usersRaw = process.env.AUTH_USERS;

if (!pat || !usersRaw) {
  console.warn(
    "⚠️  GH_PAT or AUTH_USERS not set. Generating empty credentials file.\n" +
      "   Create a .env.local with GH_PAT and AUTH_USERS for local dev.",
  );
  writeFileSync(OUTPUT, JSON.stringify({ users: [] }, null, 2));
  process.exit(0);
}

const users = usersRaw.split(",").map((pair) => {
  const colonIdx = pair.indexOf(":");
  if (colonIdx === -1) {
    console.error(`Invalid user format: "${pair}". Expected "username:password".`);
    process.exit(1);
  }
  return {
    username: pair.slice(0, colonIdx).trim(),
    password: pair.slice(colonIdx + 1).trim(),
  };
});

const credentials = users.map(({ username, password }) => ({
  username,
  ...encrypt(pat, password),
}));

writeFileSync(OUTPUT, JSON.stringify({ users: credentials }, null, 2));
console.log(`✅ Generated encrypted credentials for ${users.length} user(s)`);
