import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error('Fetch Students Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
