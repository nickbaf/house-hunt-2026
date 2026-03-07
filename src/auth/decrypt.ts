import credentialsJson from "./credentials.generated.json";

interface EncryptedUser {
  username: string;
  salt: string;
  iv: string;
  data: string;
  tag: string;
}

interface CredentialsFile {
  users: EncryptedUser[];
}

const credentials: CredentialsFile = credentialsJson as CredentialsFile;

function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function getAvailableUsernames(): string[] {
  return credentials.users.map((u) => u.username);
}

export async function decryptToken(
  username: string,
  password: string,
): Promise<string | null> {
  const user = credentials.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );
  if (!user) return null;

  try {
    const salt = base64ToBuffer(user.salt);
    const iv = base64ToBuffer(user.iv);
    const encrypted = base64ToBuffer(user.data);
    const tag = base64ToBuffer(user.tag);

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"],
    );

    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: 100_000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );

    const combined = new Uint8Array(encrypted.length + tag.length);
    combined.set(encrypted);
    combined.set(tag, encrypted.length);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
      key,
      combined.buffer as ArrayBuffer,
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}
