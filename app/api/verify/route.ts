import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

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

    if (!student) {
      return NextResponse.json({
        status: 'INVALID',
        message: 'Student not found'
      });
    }

    // Authorization verification
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token')?.value;
    const userToken = cookieStore.get('user_token')?.value;

    let authorized = false;
    let userId = '';

    if (adminToken) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key');
        await jwtVerify(adminToken, secret);
        authorized = true;
      } catch {}
    }

    if (!authorized && userToken) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key');
        const { payload } = await jwtVerify(userToken, secret);
        userId = payload.id as string;
      } catch {}
    }

    if (!authorized && userId && student.eventId) {
      // Check if logged-in user is the host of this registration's event
      const event = await prisma.event.findUnique({
        where: { id: student.eventId },
        select: { host_id: true }
      });
      if (event && event.host_id === userId) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json({ status: 'UNAUTHORIZED', message: 'Unauthorized access to verify this ticket' }, { status: 401 });
    }

    // Check if registration is cancelled
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
        checked_in: true,
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
