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

    // Check if event is cancelled or full
    let eventRecord = null;
    if (body.eventId) {
      eventRecord = await prisma.event.findUnique({
        where: { id: body.eventId }
      });
    } else if (event) {
      eventRecord = await prisma.event.findFirst({
        where: { name: event }
      });
    }

    if (eventRecord) {
      if (eventRecord.status === 'CANCELLED') {
        return NextResponse.json({ error: 'This event has been cancelled and is no longer accepting registrations.' }, { status: 400 });
      }

      // Check max attendees capacity
      if (eventRecord.max_attendees && eventRecord.max_attendees > 0) {
        const currentRegistrationsCount = await prisma.student.aggregate({
          where: {
            eventId: eventRecord.id,
            status: { not: 'CANCELLED' }
          },
          _sum: {
            participants: true
          }
        });

        const currentCount = currentRegistrationsCount._sum.participants || 0;

        if (currentCount >= eventRecord.max_attendees) {
          return NextResponse.json({ error: 'Registration failed. This event is already full!' }, { status: 400 });
        }

        if (currentCount + requestedParticipants > eventRecord.max_attendees) {
          const remainingSpots = eventRecord.max_attendees - currentCount;
          return NextResponse.json({ 
            error: `Registration failed. Only ${remainingSpots} spot${remainingSpots > 1 ? 's' : ''} left, but you requested to register for ${requestedParticipants} participant${requestedParticipants > 1 ? 's' : ''}.`
          }, { status: 400 });
        }
      }
    }

    // Generate a unique ID (Prisma uuid() will create it, but we can generate ahead of time for QR)
    const id = crypto.randomUUID();

    // Generate verification URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/api/verify?id=${id}`;

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

    // Generate QR code base64
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    // Create student in DB
    const newStudent = await prisma.student.create({
      data: {
        id,
        name,
        email,
        phone,
        event,
        eventId: eventRecord?.id || body.eventId || null,
        participants: requestedParticipants,
        qr_code: qrCodeDataUrl,
        user_id,
      },
    });

    // Send formal confirmation email asynchronously (does not block registration response from throwing error, but waits for email to finish sending)
    if (newStudent.email) {
      await sendFormalConfirmationEmail({
        toEmail: newStudent.email,
        studentName: newStudent.name,
        eventName: eventRecord?.name || newStudent.event,
        eventDate: eventRecord?.event_date || null,
        venue: eventRecord?.venue || null,
        qrCodeDataUrl: qrCodeDataUrl,
        registrationId: newStudent.id
      });
    }
    
    return NextResponse.json({
      success: true,
      student: newStudent
    });

  } catch (error) {
    console.error('Registration Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
