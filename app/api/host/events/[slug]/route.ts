import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('user_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const event = await prisma.event.findUnique({
      where: { slug },
    });

    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    if (event.host_id !== userId) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const registrations = await prisma.student.findMany({
      where: { eventId: event.id },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ success: true, event, registrations });
  } catch (error) {
    console.error('Host Event Details Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
