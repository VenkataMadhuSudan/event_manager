import nodemailer from 'nodemailer';

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
 * Utility to format Date into an extremely elegant formal string.
 */
function formatFormalDate(date: Date | string | null): string {
  if (!date) return 'To Be Announced';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'To Be Announced';

  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
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
    // 1. Configure the SMTP Transporter
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.SMTP_FROM || smtpUser || 'no-reply@jntuh.ac.in';

    // If SMTP details are not configured, log it but don't crash the server.
    if (!smtpUser || !smtpPass) {
      console.warn(
        '⚠️ SMTP email credentials (SMTP_USER, SMTP_PASS) are not set in the .env file. Email was not sent, but registration is saved in database.'
      );
      return { success: false, error: 'Email configuration missing' };
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // True for 465, false for 587/25
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    // 2. Prepare inline attachments (e.g. for the dynamic QR Code image)
    const attachments = [];
    let qrHtmlTag = '';

    if (qrCodeDataUrl && qrCodeDataUrl.startsWith('data:image/png;base64,')) {
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      attachments.push({
        filename: 'jntuh-entry-qr.png',
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
    const formalVenue = venue || 'JNTU-H Main Campus';

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
              <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 6px solid #1e3a8a; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
                
                <!-- University Header -->
                <tr>
                  <td style="padding: 30px 40px 20px 40px; border-bottom: 1px solid #f1f5f9; text-align: center;">
                    <h2 style="margin: 0; font-family: 'Times New Roman', Times, serif; font-size: 20px; font-weight: bold; color: #1e3a8a; letter-spacing: 1px;">JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY HYDERABAD</h2>
                    <p style="margin: 5px 0 0 0; font-family: 'Arial', sans-serif; font-size: 10px; color: #64748b; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">Official Confirmation Letter</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 40px 40px 30px 40px;">
                    <p style="margin: 0 0 20px 0; font-family: 'Georgia', serif; font-size: 15px; line-height: 1.6; color: #1e293b;">
                      Dear <strong>${studentName}</strong>,
                    </p>
                    <p style="margin: 0 0 25px 0; font-family: 'Georgia', serif; font-size: 15px; line-height: 1.6; color: #334155; text-align: justify;">
                      We are pleased to inform you that your registration for the upcoming university event, 
                      <strong>&ldquo;${eventName}&rdquo;</strong>, has been successfully received and officially confirmed. We appreciate your interest in participating and contributing to our vibrant campus environment.
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
                      <h4 style="margin: 0 0 10px 0; font-family: 'Arial', sans-serif; font-size: 12px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px;">Crucial Instructions for Attendees:</h4>
                      <ul style="margin: 0; padding-left: 20px; font-family: 'Georgia', serif; font-size: 13px; line-height: 1.6; color: #475569;">
                        <li style="margin-bottom: 8px;">Please preserve this official confirmation pass on your mobile device. The QR code must be scanned at the venue gate for mandatory check-in.</li>
                        <li style="margin-bottom: 8px;">All attendees are requested to report at the designated venue at least <strong>15 minutes</strong> prior to the scheduled start time.</li>
                        <li style="margin-bottom: 8px;">Kindly maintain academic decorum and adhere strictly to the rules and guidelines of JNTU-H during the course of the event.</li>
                      </ul>
                    </div>

                    <p style="margin: 30px 0 0 0; font-family: 'Georgia', serif; font-size: 14px; line-height: 1.6; color: #334155;">
                      If you require any clarification or further support, please do not hesitate to reach out to the event coordinators or contact the JNTU-H University office.
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
                          <p style="margin: 10px 0 0 0; font-family: 'Arial', sans-serif; font-size: 13px; font-weight: bold; color: #1e3a8a; text-transform: uppercase;">Organizing Secretariat</p>
                          <p style="margin: 2px 0 0 0; font-family: 'Arial', sans-serif; font-size: 12px; color: #64748b;">Jawaharlal Nehru Technological University Hyderabad (JNTU-H)</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Disclaimer Footer -->
                <tr>
                  <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0; font-family: 'Arial', sans-serif; font-size: 10px; color: #94a3b8; line-height: 1.4;">
                      This is an officially generated university transaction notification. Please do not reply directly to this email address. 
                      <br />&copy; ${new Date().getFullYear()} JNTU-H. All academic rights reserved.
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

We are pleased to inform you that your registration for the upcoming event "${eventName}" has been successfully received and officially confirmed by the organizing committee at Jawaharlal Nehru Technological University Hyderabad (JNTU-H).

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
3. Adhere to academic decorum and university guidelines during the event.

For any queries, please reach out to the JNTU-H event coordinators.

With warm regards,
Organizing Secretariat
Jawaharlal Nehru Technological University Hyderabad (JNTU-H)
`;

    // 5. Send the mail!
    const mailOptions = {
      from: `"JNTU-H Organizing Committee" <${fromEmail}>`,
      to: toEmail,
      subject: `Official Registration Confirmation: ${eventName} – JNTU-H`,
      text: textContent,
      html: htmlContent,
      attachments: attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Formal Email sent successfully to:', toEmail, 'MessageId:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Failed to send formal confirmation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
