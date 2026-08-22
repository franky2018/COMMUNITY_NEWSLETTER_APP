export interface PasswordResetEmailContent {
  subject: string;
  html: string;
  text: string;
}

const EXPIRY_LABEL = '15 minutes';

export function buildPasswordResetEmail(
  resetUrl: string,
): PasswordResetEmailContent {
  const subject = 'Reset your Community Newsletter password';

  const text = [
    'Hello,',
    '',
    'We received a request to reset the password for your Community Newsletter account.',
    'Open the link below to choose a new password:',
    '',
    resetUrl,
    '',
    `This link expires in ${EXPIRY_LABEL}.`,
    '',
    'If you did not request a password reset, you can safely ignore this email — your password will not change.',
  ].join('\n');

    const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background-color:#ffffff;border-radius:8px;padding:32px;">
      <tr>
        <td>
          <h1 style="font-size:20px;margin:0 0 16px;">Reset your password</h1>
          <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">Hello,</p>
          <p style="font-size:14px;line-height:1.6;margin:0 0 24px;">
            We received a request to reset the password for your Community Newsletter account.
            Click the button below to choose a new password.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${resetUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 20px;border-radius:6px;">
              Reset password
            </a>
          </p>
          <p style="font-size:13px;line-height:1.6;color:#52525b;margin:0 0 8px;">
            Or paste this link into your browser:
          </p>
          <p style="font-size:13px;line-height:1.6;margin:0 0 24px;word-break:break-all;">
            <a href="${resetUrl}" style="color:#2563eb;">${resetUrl}</a>
          </p>
          <p style="font-size:13px;line-height:1.6;color:#52525b;margin:0 0 8px;">
            This link expires in ${EXPIRY_LABEL}.
          </p>
          <p style="font-size:13px;line-height:1.6;color:#52525b;margin:0;">
            If you did not request a password reset, you can safely ignore this email — your password will not change.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
