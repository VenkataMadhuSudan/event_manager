import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Missing credentials' }, { status: 400 });
    }

    // Check if any admins exist. If not, create the default one.
    const adminCount = await (prisma as any).admin.count();
    if (adminCount === 0) {
      await (prisma as any).admin.create({
        data: {
          username: 'Madhu',
          password: 'madhu@2006',
        },
      });
    }

    // Check the database for the provided credentials
    const admin: any = await (prisma as any).admin.findUnique({
      where: { username },
    });

    if (admin && admin.password === password) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key');
      const token = await new SignJWT({ user: admin.username, id: admin.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(secret);

      const response = NextResponse.json({ success: true, user: { username: admin.username } });
      
      // Set cookie using the standard spread options
      response.cookies.set('admin_token', token, {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 2, // 2 hours
        sameSite: 'lax',
      });

      return response;
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Auth Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

