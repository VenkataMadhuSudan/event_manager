import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: idOrSlug } = await params;
    
    if (!idOrSlug) {
      return NextResponse.json({ error: 'ID or Slug is required' }, { status: 400 });
    }

    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const event = await prisma.event.findUnique({
      where: isId ? { id: idOrSlug } : { slug: idOrSlug },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const currentRegistrationsCount = await prisma.student.aggregate({
      where: {
        eventId: event.id,
        status: { not: 'CANCELLED' }
      },
      _sum: {
        participants: true
      }
    });

    const currentCount = currentRegistrationsCount._sum.participants || 0;

    return NextResponse.json({ 
      success: true, 
      event: {
        ...event,
        current_attendees: currentCount
      } 
    });
  } catch (error) {
    console.error('Error fetching event by slug:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: idOrSlug } = await params;
    const body = await req.json();

    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const where = isId ? { id: idOrSlug } : { slug: idOrSlug };

    // Fetch the event first to verify ownership/permission
    const event = await prisma.event.findUnique({
      where,
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Auth validation
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

    if (!authorized) {
      if (userId && event.host_id === userId) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Filter out only valid fields for update
    const updateData: Record<string, string | number | boolean | Date | null | undefined> = {};
    const allowedFields = [
      'name', 'event_date', 'end_date', 'last_date_to_register', 
      'type', 'duration', 'venue', 'details', 'mode', 
      'is_paid', 'max_attendees', 'team_size', 'banner_url', 
      'poster_url', 'theme_color', 'status'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (['event_date', 'end_date', 'last_date_to_register'].includes(field) && body[field]) {
          updateData[field] = new Date(body[field]);
        } else if (['max_attendees', 'team_size'].includes(field) && body[field]) {
          updateData[field] = parseInt(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    });

    const updatedEvent = await prisma.event.update({
      where,
      data: updateData,
    });

    // If the event is cancelled, cancel all registrations too
    if (body.status === 'CANCELLED') {
      await prisma.student.updateMany({
        where: { eventId: updatedEvent.id },
        data: { status: 'CANCELLED' },
      });
    }

    return NextResponse.json({ success: true, message: 'Event updated successfully', event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: idOrSlug } = await params;

    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const where = isId ? { id: idOrSlug } : { slug: idOrSlug };

    // Fetch the event first to verify ownership/permission
    const event = await prisma.event.findUnique({
      where,
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Auth validation
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

    if (!authorized) {
      if (userId && event.host_id === userId) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletedEvent = await prisma.event.delete({
      where: { id: event.id },
    });

    return NextResponse.json({ success: true, message: 'Event deleted successfully and all registrations removed', event: deletedEvent });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}

