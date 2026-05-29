import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import QRCode from 'qrcode';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { sendFormalConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { registrationId } = await req.json();

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }

    // Authenticate the user
    const cookieStore = await cookies();
    const token = cookieStore.get('user_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'You must be signed in to cancel a registration' }, { status: 401 });
    }

    let userId: string;
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key');
      const { payload } = await jwtVerify(token, secret);
      userId = payload.id as string;
    } catch {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Execute cancellation inside a Prisma transaction to safely handle waitlist promotion
    const result = await prisma.$transaction(async (tx) => {
      // Fetch the registration with the related event
      const registration = await tx.student.findUnique({
        where: { id: registrationId },
        include: { eventRel: true },
      });

      if (!registration) {
        throw new Error('Registration not found');
      }

      // Verify ownership — the logged-in user must own this registration
      if (registration.user_id !== userId) {
        throw new Error('UNAUTHORIZED');
      }

      if (registration.status === 'CANCELLED') {
        throw new Error('This registration has already been cancelled');
      }

      const event = registration.eventRel;

      // Enforce cancellation deadline
      if (event?.last_date_to_cancel && new Date() > new Date(event.last_date_to_cancel)) {
        throw new Error('Cancellation deadline has passed. You can no longer cancel this registration.');
      }

      // Prevent cancellation after event has started
      if (event?.event_date && new Date() > new Date(event.event_date)) {
        throw new Error('Cannot cancel after the event has started.');
      }

      const wasPreviouslyRegistered = registration.status === 'REGISTERED';

      // Cancel the registration
      await tx.student.update({
        where: { id: registrationId },
        data: {
          status: 'CANCELLED',
          qr_code: null,
        },
      });

      // Waitlist promotion: if a confirmed spot just opened, promote the oldest waitlisted registrant
      let promotedStudent = null;
      if (wasPreviouslyRegistered && event) {
        const nextInLine = await tx.student.findFirst({
          where: {
            eventId: event.id,
            status: 'WAITLISTED',
          },
          orderBy: { created_at: 'asc' },
        });

        if (nextInLine) {
          // Generate QR code for the promoted registrant
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const verificationUrl = `${appUrl}/api/verify?id=${nextInLine.id}`;
          const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: 400,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });

          promotedStudent = await tx.student.update({
            where: { id: nextInLine.id },
            data: {
              status: 'REGISTERED',
              qr_code: qrCodeDataUrl,
            },
          });
        }
      }

      return { event, promotedStudent };
    });

    const { event, promotedStudent } = result;

    // Send confirmation email to the promoted waitlisted user (non-blocking)
    if (promotedStudent && promotedStudent.email) {
      sendFormalConfirmationEmail({
        toEmail: promotedStudent.email,
        studentName: promotedStudent.name,
        eventName: event?.name || promotedStudent.event,
        eventDate: event?.event_date || null,
        venue: event?.venue || null,
        qrCodeDataUrl: promotedStudent.qr_code || '',
        registrationId: promotedStudent.id,
      }).catch((emailError) => {
        console.error('⚠️ Waitlist Promotion Email Failed:', emailError);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Registration cancelled successfully',
      promoted: promotedStudent ? { name: promotedStudent.name, email: promotedStudent.email } : null,
    });

  } catch (error) {
    console.error('Cancellation Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'You are not authorized to cancel this registration' }, { status: 403 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
