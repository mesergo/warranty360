import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = CLIENT_ID ? new OAuth2Client(CLIENT_ID) : null;

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
}

export class GoogleAuthError extends Error {}

/** מאמת ID token שהתקבל מ-Google Identity Services מול ה-Client ID של האפליקציה. */
export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile> {
  if (!client) {
    throw new GoogleAuthError('התחברות עם Google אינה מוגדרת בשרת (חסר GOOGLE_CLIENT_ID)');
  }
  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken: credential, audience: CLIENT_ID });
  } catch {
    throw new GoogleAuthError('אימות Google נכשל, נסו שוב');
  }
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw new GoogleAuthError('חשבון Google לא אומת');
  }
  return { googleId: payload.sub, email: payload.email, name: payload.name ?? payload.email };
}
