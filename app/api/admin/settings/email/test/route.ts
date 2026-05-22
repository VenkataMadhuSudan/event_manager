import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { sendFormalConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  const auth = await verifyAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { testEmail } = await req.json();

    if (!testEmail) {
      return NextResponse.json({ error: 'Test email address is required' }, { status: 400 });
    }

    const result = await sendFormalConfirmationEmail({
      toEmail: testEmail,
      studentName: 'Test Participant',
      eventName: 'EventHub SMTP Test',
      eventDate: new Date(),
      venue: 'EventHub Headquarters',
      qrCodeDataUrl: null,
      registrationId: 'TEST-' + Date.now().toString(36).toUpperCase(),
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send test email' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to send test email', details: errorMessage }, { status: 500 });
  }
}
