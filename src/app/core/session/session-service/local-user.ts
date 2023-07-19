import CryptoES from "crypto-es";
import { AuthUser } from "./auth-user";

/**
 * User object as prepared and used by the local session.
 */
export interface LocalUser extends AuthUser {
  encryptedPassword: EncryptedPassword;
}

export interface EncryptedPassword {
  hash: string;
  salt: string;
  iterations: number;
  keySize: number;
}

export function encryptPassword(
  password: string,
  iterations = 128,
  keySize = 256 / 32,
  salt = CryptoES.lib.WordArray.random(128 / 8).toString()
): EncryptedPassword {
  const hash = CryptoES.PBKDF2(password, salt, {
    keySize: keySize,
    iterations: iterations,
  }).toString();
  return {
    hash: hash,
    iterations: iterations,
    keySize: keySize,
    salt: salt,
  };
}

export function passwordEqualsEncrypted(
  password: string,
  encryptedPassword: EncryptedPassword
): boolean {
  const hash = CryptoES.PBKDF2(password, encryptedPassword?.salt, {
    iterations: encryptedPassword?.iterations,
    keySize: encryptedPassword?.keySize,
  }).toString();
  return hash === encryptedPassword.hash;
}
