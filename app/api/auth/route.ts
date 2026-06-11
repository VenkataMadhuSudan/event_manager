import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Missing credentials' }, { status: 400 });
    }

    // Check if any admins exist. If not, create the default one.
    const adminCount = await prisma.admin.count();
    if (adminCount === 0) {
      const defaultHashedPassword = await bcrypt.hash('madhu@2006', 10);
      await prisma.admin.create({
        data: {
          username: 'Madhu',
          password: defaultHashedPassword,
        },
      });
    }

    // Check the database for the provided credentials
    const admin = await prisma.admin.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
    });

    let isPasswordCorrect = false;
    let legacyPlainTextPassword = false;

    if (admin) {
      const storedPassword = admin.password ?? '';
      const isBcryptHash = typeof storedPassword === 'string' && /^\$2[aby]\$/.test(storedPassword);

      if (isBcryptHash) {
        isPasswordCorrect = await bcrypt.compare(password, storedPassword);
      } else {
        legacyPlainTextPassword = true;
        isPasswordCorrect = storedPassword === password;
      }
    }

    if (admin && isPasswordCorrect) {
      if (legacyPlainTextPassword) {
        await prisma.admin.update({
          where: { id: admin.id },
          data: { password: await bcrypt.hash(password, 10) },
        });
      }
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

