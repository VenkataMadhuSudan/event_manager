import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const hostedEvents = await prisma.event.findMany({
      where: { host_id: userId },
      orderBy: { created_at: 'desc' },
    });

    const registeredEvents = await prisma.student.findMany({
      where: { user_id: userId },
      include: { eventRel: true },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ success: true, hosted: hostedEvents, registered: registeredEvents });
  } catch (error) {
    console.error('User Events Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
