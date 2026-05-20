import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  const auth = await verifyAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const admins = await (prisma as any).admin.findMany({
      select: {
        id: true,
        username: true,
      },
    });
    return NextResponse.json(admins);
  } catch (error) {
    console.error('List Admins Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await verifyAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const newAdmin = await (prisma as any).admin.create({
      data: {
        username,
        password,
      },
      select: {
        id: true,
        username: true,
      },
    });


    return NextResponse.json(newAdmin);

  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    console.error('Add Admin Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
