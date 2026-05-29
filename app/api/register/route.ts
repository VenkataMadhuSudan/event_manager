import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { sendFormalConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, event, participants } = body;

    if (!name || !email || !phone || !event) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get requested participant size (default to 1)
    const requestedParticipants = participants ? parseInt(participants, 10) : 1;

    // Generate a unique ID
    const id = crypto.randomUUID();

    // Get user_id if logged in
    const cookieStore = await cookies();
    const token = cookieStore.get('user_token')?.value;
    let user_id = null;
    
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key');
        const { payload } = await jwtVerify(token, secret);
        user_id = payload.id as string;
      } catch {}
    }

    // Execute validations and record creation inside a secure Prisma Transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Resolve the event record
      let eventRecord = null;
      if (body.eventId) {
        eventRecord = await tx.event.findUnique({
          where: { id: body.eventId }
        });
      } else if (event) {
        eventRecord = await tx.event.findFirst({
          where: { name: event }
        });
      }

      if (eventRecord) {
        if (eventRecord.status === 'CANCELLED') {
          throw new Error('This event has been cancelled and is no longer accepting registrations.');
        }

        // Enforce registration deadline
        if (eventRecord.last_date_to_register && new Date() > new Date(eventRecord.last_date_to_register)) {
          throw new Error('Registration deadline has passed. This event is no longer accepting registrations.');
        }
      }

      // Determine registration status: REGISTERED or WAITLISTED
      let registrationStatus = 'REGISTERED';
      let qrCodeDataUrl: string | null = null;

      if (eventRecord && eventRecord.max_attendees && eventRecord.max_attendees > 0) {
        const currentRegistrationsCount = await tx.student.aggregate({
          where: {
            eventId: eventRecord.id,
            status: 'REGISTERED'
          },
          _sum: {
            participants: true
          }
        });

        const currentCount = currentRegistrationsCount._sum.participants || 0;

        if (currentCount >= eventRecord.max_attendees) {
          // Event is full — waitlist the registrant
          registrationStatus = 'WAITLISTED';
        } else if (currentCount + requestedParticipants > eventRecord.max_attendees) {
          const remainingSpots = eventRecord.max_attendees - currentCount;
          throw new Error(`Registration failed. Only ${remainingSpots} spot${remainingSpots > 1 ? 's' : ''} left, but you requested ${requestedParticipants} participant${requestedParticipants > 1 ? 's' : ''}.`);
        }
      }

      // Generate QR code only for confirmed registrations (not waitlisted)
      if (registrationStatus === 'REGISTERED') {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const verificationUrl = `${appUrl}/api/verify?id=${id}`;
        qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
          width: 400,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
      }

      // Create student registration record
      const newStudent = await tx.student.create({
        data: {
          id,
          name,
          email,
          phone,
          event,
          eventId: eventRecord?.id || body.eventId || null,
          participants: requestedParticipants,
          qr_code: qrCodeDataUrl,
          status: registrationStatus,
          user_id,
        },
      });

      return { newStudent, eventRecord, registrationStatus };
    });

    const { newStudent, eventRecord, registrationStatus } = result;

    // Send confirmation email only for confirmed registrations (not waitlisted)
    if (registrationStatus === 'REGISTERED' && newStudent.email) {
      sendFormalConfirmationEmail({
        toEmail: newStudent.email,
        studentName: newStudent.name,
        eventName: eventRecord?.name || newStudent.event,
        eventDate: eventRecord?.event_date || null,
        venue: eventRecord?.venue || null,
        qrCodeDataUrl: newStudent.qr_code || '',
        registrationId: newStudent.id
      }).catch((emailError) => {
        console.error('⚠️ Background Confirmation Email Dispatch Failed:', emailError);
      });
    }
    
    return NextResponse.json({
      success: true,
      student: newStudent,
      waitlisted: registrationStatus === 'WAITLISTED',
    });

  } catch (error) {
    console.error('Registration Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

