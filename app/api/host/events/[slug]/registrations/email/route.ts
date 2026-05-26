import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { sendFormalConfirmationEmail } from '@/lib/email';

export async function POST(
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

    const body = await req.json();
    const { participantIds } = body;

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Participant IDs are required and must be an array'
      }, { status: 400 });
    }

    // Fetch the students to email
    const students = await prisma.student.findMany({
      where: {
        id: { in: participantIds },
        eventId: event.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        qr_code: true
      }
    });

    // Send emails in parallel
    const emailPromises = students.map(async (student) => {
      if (!student.email) {
        return { success: false, error: 'No email address', studentId: student.id };
      }

      const formattedDate = event.event_date ?
        new Date(event.event_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        }) : 'To Be Announced';

      const formalVenue = event.venue || 'To Be Announced';

      return sendFormalConfirmationEmail({
        toEmail: student.email,
        studentName: student.name,
        eventName: event.name,
        eventDate: event.event_date,
        venue: event.venue,
        qrCodeDataUrl: student.qr_code,
        registrationId: student.id
      });
    });

    const results = await Promise.allSettled(emailPromises);

    let successCount = 0;
    const failures: { studentId: string; error?: string }[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const emailResult = result.value;
        if (emailResult.success) {
          successCount++;
        } else {
          failures.push({
            studentId: students[index].id,
            error: emailResult.error
          });
        }
      } else {
        failures.push({
          studentId: students[index].id,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Email sending completed. ${successCount} sent successfully, ${failures.length} failed.`,
      data: {
        sent: successCount,
        failed: failures.length,
        failures
      }
    });

  } catch (error) {
    console.error('Host Email Sending Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}