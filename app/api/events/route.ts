import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + crypto.randomBytes(3).toString('hex');
}

export async function POST(req: Request) {
  try {
    const { 
      name, 
      event_date, 
      end_date,
      last_date_to_register, 
      type, 
      duration, 
      venue, 
      details,
      mode,
      is_paid,
      max_attendees,
      team_size,
      banner_url,
      poster_url,
    } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
    }

    const slug = generateSlug(name);

    const cookieStore = await cookies();
    const token = cookieStore.get('user_token')?.value;
    let host_id = null;
    
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key');
        const { payload } = await jwtVerify(token, secret);
        host_id = payload.id as string;
      } catch (err) {}
    }

    if (!host_id) {
      return NextResponse.json({ error: 'You must be signed in to create an event' }, { status: 401 });
    }

    const event = await prisma.event.create({
      data: {
        name,
        slug,
        host_id,
        event_date: event_date ? new Date(event_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        last_date_to_register: last_date_to_register ? new Date(last_date_to_register) : null,
        type: type || null,
        duration: duration || null,
        venue: venue || null,
        details: details || null,
        mode: mode || "OFFLINE",
        is_paid: is_paid || false,
        max_attendees: max_attendees ? parseInt(max_attendees) : null,
        team_size: team_size ? parseInt(team_size) : 1,
        banner_url: banner_url || null,
        poster_url: poster_url || null,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
