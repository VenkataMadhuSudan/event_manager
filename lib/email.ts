import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';
import { formatFormalDate } from '@/lib/utils';

interface EmailParams {
  toEmail: string;
  studentName: string;
  eventName: string;
  eventDate: Date | string | null;
  venue: string | null;
  qrCodeDataUrl: string | null;
  registrationId: string;
}

/**
 * Loads SMTP configuration from the database first, then falls back to environment variables.
 */
async function getSmtpConfig() {
  const dbSettings: Record<string, string> = {};

  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'] } },
    });
    for (const s of settings) {
      dbSettings[s.key] = s.value;
    }
  } catch (error) {
    console.warn('⚠️ Could not load SMTP settings from database, falling back to .env:', error);
  }

  return {
    host: dbSettings['SMTP_HOST'] || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(dbSettings['SMTP_PORT'] || process.env.SMTP_PORT || '465'),
    user: dbSettings['SMTP_USER'] || process.env.SMTP_USER || '',
    pass: dbSettings['SMTP_PASS'] || process.env.SMTP_PASS || '',
    from: dbSettings['SMTP_FROM'] || process.env.SMTP_FROM || 'manager.eventhub@gmail.com',
  };
}

/**
 * Sends a formal academic confirmation email to the student participant.
 */
export async function sendFormalConfirmationEmail({
  toEmail,
  studentName,
  eventName,
  eventDate,
  venue,
  qrCodeDataUrl,
  registrationId
}: EmailParams) {
  try {
    // 1. Load SMTP config dynamically from DB → .env fallback
    const smtp = await getSmtpConfig();

    // If SMTP details are not configured, log it but don't crash the server.
    if (!smtp.user || !smtp.pass) {
      console.warn(
        '⚠️ SMTP email credentials (SMTP_USER, SMTP_PASS) are not set. Email was not sent, but registration is saved in database.'
      );
      return { success: false, error: 'Email configuration missing' };
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465, // True for 465, false for 587/25
      auth: {
        user: smtp.user,
        pass: smtp.pass
      }
    });

    // 2. Prepare inline attachments (e.g. for the dynamic QR Code image)
    const attachments = [];
    let qrHtmlTag = '';

    if (qrCodeDataUrl && qrCodeDataUrl.startsWith('data:image/png;base64,')) {
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      attachments.push({
        filename: 'entry-qr.png',
        content: Buffer.from(base64Data, 'base64'),
        cid: 'qrcode' // Matches the 'cid:qrcode' in the HTML img source
      });
      qrHtmlTag = `
      
        <div style="text-align: center; margin: 30px 0; padding: 20px; border: 1px dashed #cbd5e1; background-color: #f8fafc; border-radius: 8px;">
          <p style="margin: 0 0 10px 0; font-family: 'Georgia', serif; font-size: 13px; color: #475569; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Official Entry QR Pass</p>
          <img src="cid:qrcode" alt="Entry QR Pass" style="width: 180px; height: 180px; display: block; margin: 0 auto; border: 4px solid #1e3a8a; border-radius: 4px;" />
          <p style="margin: 10px 0 0 0; font-family: monospace; font-size: 11px; color: #64748b;">PASS-ID: ${registrationId}</p>
        </div>
      `;
    }

    const formattedDate = formatFormalDate(eventDate);
    const formalVenue = venue || 'To Be Announced';

    // 3. Define extremely formal HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Official Registration Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-text-size-adjust: none; text-size-adjust: none;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 40px 10px;">
          <tr>
            <td align="center">
              <!-- Academic Email Container -->
              <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 6px solid #0ea5e9; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 30px 40px 20px 40px; border-bottom: 1px solid #f1f5f9; text-align: center;">
                    <h2 style="margin: 0; font-family: 'Arial', Helvetica, sans-serif; font-size: 22px; font-weight: bold; color: #0ea5e9; letter-spacing: 1px;">EVENTHUB</h2>
                    <p style="margin: 5px 0 0 0; font-family: 'Arial', sans-serif; font-size: 10px; color: #64748b; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">Official Registration Confirmation</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 40px 40px 30px 40px;">
                    <p style="margin: 0 0 20px 0; font-family: 'Georgia', serif; font-size: 15px; line-height: 1.6; color: #1e293b;">
                      Dear <strong>${studentName}</strong>,
                    </p>
                    <p style="margin: 0 0 25px 0; font-family: 'Georgia', serif; font-size: 15px; line-height: 1.6; color: #334155; text-align: justify;">
                      We are pleased to inform you that your registration for the upcoming event, 
                      <strong>&ldquo;${eventName}&rdquo;</strong>, has been successfully received and officially confirmed. We appreciate your interest in participating and contributing to our vibrant community.
                    </p>

                    <!-- Official Credentials Table -->
                    <table border="0" cellpadding="12" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 25px;">
                      <tr>
                        <td width="30%" style="font-family: 'Arial', sans-serif; font-size: 12px; font-weight: bold; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Participant Name</td>
                        <td style="font-family: 'Arial', sans-serif; font-size: 13px; color: #1e293b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${studentName}</td>
                      </tr>
                      <tr>
                        <td style="font-family: 'Arial', sans-serif; font-size: 12px; font-weight: bold; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Registration ID</td>
                        <td style="font-family: 'Arial', sans-serif; font-size: 13px; color: #1e293b; font-weight: 600; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${registrationId}</td>
                      </tr>
                      <tr>
                        <td style="font-family: 'Arial', sans-serif; font-size: 12px; font-weight: bold; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Date & Time</td>
                        <td style="font-family: 'Arial', sans-serif; font-size: 13px; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="font-family: 'Arial', sans-serif; font-size: 12px; font-weight: bold; color: #475569; text-transform: uppercase;">Event Venue</td>
                        <td style="font-family: 'Arial', sans-serif; font-size: 13px; color: #1e293b;">${formalVenue}</td>
                      </tr>
                    </table>

                    <!-- Entry QR Pass Placement -->
                    ${qrHtmlTag}

                    <!-- Formal Rules & Guidelines -->
                    <div style="margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                      <h4 style="margin: 0 0 10px 0; font-family: 'Arial', sans-serif; font-size: 12px; font-weight: bold; color: #0ea5e9; text-transform: uppercase; letter-spacing: 0.5px;">Important Instructions for Attendees:</h4>
                      <ul style="margin: 0; padding-left: 20px; font-family: 'Georgia', serif; font-size: 13px; line-height: 1.6; color: #475569;">
                        <li style="margin-bottom: 8px;">Please preserve this official confirmation pass on your mobile device. The QR code must be scanned at the venue gate for mandatory check-in.</li>
                        <li style="margin-bottom: 8px;">All attendees are requested to report at the designated venue at least <strong>15 minutes</strong> prior to the scheduled start time.</li>
                        <li style="margin-bottom: 8px;">Kindly maintain decorum and adhere strictly to the rules and guidelines during the course of the event.</li>
                      </ul>
                    </div>

                    <p style="margin: 30px 0 0 0; font-family: 'Georgia', serif; font-size: 14px; line-height: 1.6; color: #334155;">
                      If you require any clarification or further support, please do not hesitate to reach out to the event coordinators.
                    </p>
                    <p style="margin: 20px 0 0 0; font-family: 'Georgia', serif; font-size: 14px; line-height: 1.6; color: #334155;">
                      We look forward to your active participation.
                    </p>
                  </td>
                </tr>

                <!-- Signature & Footer -->
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                      <tr>
                        <td>
                          <p style="margin: 0; font-family: 'Georgia', serif; font-size: 14px; color: #475569; font-style: italic;">With warm regards,</p>
                          <p style="margin: 10px 0 0 0; font-family: 'Arial', sans-serif; font-size: 13px; font-weight: bold; color: #0ea5e9; text-transform: uppercase;">EventHub Organizing Team</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Disclaimer Footer -->
                <tr>
                  <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0; font-family: 'Arial', sans-serif; font-size: 10px; color: #94a3b8; line-height: 1.4;">
                      This is an automatically generated confirmation. Please do not reply directly to this email address. 
                      <br />&copy; ${new Date().getFullYear()} EventHub. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 4. Define plain text fallback (for old mail clients)
    const textContent = `
OFFICIAL REGISTRATION CONFIRMATION 
=========================================

Dear ${studentName},

We are pleased to inform you that your registration for the upcoming event "${eventName}" has been successfully received and officially confirmed.

EVENT DETAILS:
--------------
* Participant Name: ${studentName}
* Registration ID: ${registrationId}
* Event Date & Time: ${formattedDate}
* Venue: ${formalVenue}

IMPORTANT ATTENDEE INSTRUCTIONS:
--------------------------------
1. Please carry a digital or printed copy of your registration ticket. The QR code must be scanned at the gate for check-in.
2. Please arrive at least 15 minutes before the event begins.
3. Adhere to decorum and guidelines during the event.

For any queries, please reach out to the event coordinators.

With warm regards,
EventHub Organizing Team
`;

    // 5. Send the mail!
    const mailOptions = {
      from: `"EventHub" <${smtp.from}>`,
      to: toEmail,
      subject: `Registration Confirmed: ${eventName} – EventHub`,
      text: textContent,
      html: htmlContent,
      attachments: attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', toEmail, 'MessageId:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Failed to send confirmation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
