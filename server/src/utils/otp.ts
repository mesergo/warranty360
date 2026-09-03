import { randomInt } from 'node:crypto';

export function generateOtpCode(): string {
  return String(randomInt(100000, 1000000));
}
