import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { username, password } = await req.json();

  try {
    const updatedAdmin = await (prisma as any).admin.update({
      where: { id },
      data: {
        ...(username && { username }),
        ...(password && { password }),
      },
    });

    return NextResponse.json({ success: true, user: { username: updatedAdmin.username } });
  } catch (error) {
    console.error('Update Admin Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Cannot delete self or the last admin
  const adminsCount = await (prisma as any).admin.count();
  if (adminsCount <= 1) {
    return NextResponse.json({ error: 'Cannot delete the only admin' }, { status: 400 });
  }

  try {
    await (prisma as any).admin.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Admin Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

