import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { id, url } = await req.json();

    let studentId = id;

    // Handle case where QR scanner sends the full URL instead of just the ID
    if (!id && url) {
      try {
        const urlObj = new URL(url);
        studentId = urlObj.searchParams.get('id');
      } catch {
        studentId = url; // fallback
      }
    }

    if (!studentId) {
      return NextResponse.json({ status: 'INVALID', message: 'No ID provided' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (student) {
      // Check if registration is cancelled
      // @ts-ignore - status field added in schema
      if (student.status === 'CANCELLED') {
        return NextResponse.json({
          status: 'CANCELLED',
          message: 'Registration Cancelled',
          student: {
            name: student.name,
            event: student.event,
          }
        });
      }

      // @ts-ignore - checked_in field added in schema
      if (student.checked_in) {
        return NextResponse.json({
          status: 'ALREADY_CHECKED_IN',
          message: 'Already Checked In',
          student: {
            name: student.name,
            event: student.event,
            participants: student.participants,
          }
        });
      }

      // Mark as checked in
      await prisma.student.update({
        where: { id: studentId },
        data: {
          // @ts-ignore
          checked_in: true,
          // @ts-ignore
          checked_in_at: new Date()
        }
      });

      return NextResponse.json({
        status: 'VALID',
        student: {
          name: student.name,
          event: student.event,
          participants: student.participants,
        }
      });
    } else {
      return NextResponse.json({
        status: 'INVALID',
        message: 'Student not found'
      });
    }

  } catch (error) {
    console.error('Verification Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Optional GET to allow direct visiting the URL
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ status: 'INVALID', message: 'No ID provided' }, { status: 400 });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id }
    });

    if (student) {
      return new NextResponse(`
        <html><body>
          <h1 style="color: green;">VALID</h1>
          <p>Name: ${student.name}</p>
          <p>Event: ${student.event}</p>
          <p>Participants: ${student.participants}</p>
        </body></html>
      `, { headers: { 'content-type': 'text/html' }});
    } else {
      return new NextResponse(`
        <html><body>
          <h1 style="color: red;">INVALID</h1>
          <p>Participant not found.</p>
        </body></html>
      `, { headers: { 'content-type': 'text/html' }});
    }
  } catch (error) {
    console.error('Verification GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
