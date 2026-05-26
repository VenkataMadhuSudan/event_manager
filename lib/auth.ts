import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key');

export async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { user: string; id: string };
  } catch {
    return null;
  }
}

export async function verifyUserAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('user_token')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { user: string; id: string; role?: string };
  } catch {
    return null;
  }
}
