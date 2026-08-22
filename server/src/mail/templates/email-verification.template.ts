export interface EmailVerificationContent {
  subject: string;
  html: string;
  text: string;
}

const EXPIRY_LABEL = '24 hours';

export function buildEmailVerificationEmail(
  verifyUrl: string,
): EmailVerificationContent {
  const subject = 'Verify your Community Newsletter email';

  const text = [
    'Hello,',
    '',
    'Please confirm your email address for your Community Newsletter account.',
    'Open the link below to verify your email:',
    '',
    verifyUrl,
    '',
    `This link expires in ${EXPIRY_LABEL}.`,
    '',
    'If you did not expect this email, you can safely ignore it.',
  ].join('\n');

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background-color:#ffffff;border-radius:8px;padding:32px;">
      <tr>
        <td>
          <h1 style="font-size:20px;margin:0 0 16px;">Verify your email</h1>
          <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">Hello,</p>
          <p style="font-size:14px;line-height:1.6;margin:0 0 24px;">
            Please confirm your email address for your Community Newsletter account.
            Click the button below to verify your email.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${verifyUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 20px;border-radius:6px;">
              Verify email
            </a>
          </p>
          <p style="font-size:13px;line-height:1.6;color:#52525b;margin:0 0 8px;">
            Or paste this link into your browser:
          </p>
          <p style="font-size:13px;line-height:1.6;margin:0 0 24px;word-break:break-all;">
            <a href="${verifyUrl}" style="color:#2563eb;">${verifyUrl}</a>
          </p>
          <p style="font-size:13px;line-height:1.6;color:#52525b;margin:0 0 8px;">
            This link expires in ${EXPIRY_LABEL}.
          </p>
          <p style="font-size:13px;line-height:1.6;color:#52525b;margin:0;">
            If you did not expect this email, you can safely ignore it.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
