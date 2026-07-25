import "server-only";
import bcrypt from "bcryptjs";

/**
 * The single definition of the password hashing cost.
 *
 * It was previously an inline `12` in registerUser(); it is now needed by
 * registration, password reset, and account settings, and three copies of a
 * security parameter is how they drift apart.
 */
const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
