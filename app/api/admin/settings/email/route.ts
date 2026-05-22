import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

const SMTP_KEYS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'] as const;

export async function GET() {
  const auth = await verifyAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: [...SMTP_KEYS] } },
    });

    // Build a map, mask the password
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      if (s.key === 'SMTP_PASS') {
        settingsMap[s.key] = s.value ? '••••••••' : '';
      } else {
        settingsMap[s.key] = s.value;
      }
    }

    return NextResponse.json({ success: true, settings: settingsMap });
  } catch (error) {
    console.error('Fetch SMTP settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await verifyAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    // Upsert each setting
    for (const key of SMTP_KEYS) {
      if (body[key] !== undefined && body[key] !== null) {
        // Skip if password field is the masked placeholder
        if (key === 'SMTP_PASS' && body[key] === '••••••••') continue;

        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(body[key]) },
          create: { key, value: String(body[key]) },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'SMTP settings saved successfully' });
  } catch (error) {
    console.error('Save SMTP settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
