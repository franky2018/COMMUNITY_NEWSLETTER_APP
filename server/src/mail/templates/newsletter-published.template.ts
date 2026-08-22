export interface NewsletterPublishedEmailData {
  title: string;
  excerpt: string | null;
  categoryName: string | null;
  publishedAt: Date | null;
  readUrl: string;
}

export interface NewsletterPublishedEmailContent {
  subject: string;
  html: string;
  text: string;
}

function formatPublishedDate(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildNewsletterPublishedEmail(
  data: NewsletterPublishedEmailData,
): NewsletterPublishedEmailContent {
  const publishedDate = formatPublishedDate(data.publishedAt);
  const subject = `New Community Newsletter: ${data.title}`;

  const textLines = [`A new newsletter has been published: ${data.title}`, ''];
  if (data.categoryName) {
    textLines.push(`Category: ${data.categoryName}`);
  }
  if (publishedDate) {
    textLines.push(`Published: ${publishedDate}`);
  }
  if (data.categoryName || publishedDate) {
    textLines.push('');
  }
  if (data.excerpt) {
    textLines.push(data.excerpt, '');
  }
  textLines.push('Read the newsletter:', data.readUrl);
  const text = textLines.join('\n');

  const metaParts: string[] = [];
  if (data.categoryName) {
    metaParts.push(escapeHtml(data.categoryName));
  }
  if (publishedDate) {
    metaParts.push(publishedDate);
  }
  const metaHtml = metaParts.length
    ? `<p style="font-size:13px;line-height:1.6;color:#52525b;margin:0 0 16px;">${metaParts.join(' &middot; ')}</p>`
    : '';

  const excerptHtml = data.excerpt
    ? `<p style="font-size:15px;line-height:1.7;margin:0 0 24px;">${escapeHtml(data.excerpt)}</p>`
    : '';

    const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:8px;padding:32px;">
      <tr>
        <td>
          <p style="font-size:12px;line-height:1.4;color:#52525b;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.06em;">New newsletter</p>
          <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px;">${escapeHtml(data.title)}</h1>
          ${metaHtml}
          ${excerptHtml}
          <p style="margin:24px 0;">
            <a href="${data.readUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 20px;border-radius:6px;">
              Read Newsletter
            </a>
          </p>
          <p style="font-size:13px;line-height:1.6;color:#52525b;margin:0 0 8px;">
            Or open this link directly:
          </p>
          <p style="font-size:13px;line-height:1.6;margin:0;word-break:break-all;">
            <a href="${data.readUrl}" style="color:#2563eb;">${escapeHtml(data.readUrl)}</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
