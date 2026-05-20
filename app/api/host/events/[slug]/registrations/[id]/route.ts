import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string, id: string }> }
) {
  try {
    const { slug, id } = await params;
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

    if (!event || event.host_id !== userId) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Verify registration belongs to the event
    const registration = await prisma.student.findUnique({
      where: { id },
    });

    if (!registration || registration.eventId !== event.id) {
      return NextResponse.json({ success: false, message: 'Registration not found' }, { status: 404 });
    }

    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Registration Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
