import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

export function hashPassword(plainPassword: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(plainPassword, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(plainPassword: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":")

  if (!salt || !hash) {
    return false
  }

  const computed = scryptSync(plainPassword, salt, 64).toString("hex")

  const hashBuffer = Buffer.from(hash, "hex")
  const computedBuffer = Buffer.from(computed, "hex")

  if (hashBuffer.length !== computedBuffer.length) {
    return false
  }

  return timingSafeEqual(hashBuffer, computedBuffer)
}
