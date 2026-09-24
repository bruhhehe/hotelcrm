import { escapeHtml } from "@/lib/email/escape";

/**
 * Staff sign-in email. Plain HTML for now; moves to React Email with the rest of the
 * templates in Phase 10.
 */
export function magicLinkEmail({ url, host }: { url: string; host: string }) {
  const safeUrl = escapeHtml(url);
  const safeHost = escapeHtml(host);
  const subject = "Your Lodgely sign-in link";
  const text = `Sign in to Lodgely\n\n${url}\n\nThis link expires in 24 hours and can only be used once. If you didn't request it, you can ignore this email.`;
  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#F7F7F7;font-family:Figtree,Helvetica,Arial,sans-serif;color:#222222">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #EBEBEB;padding:32px">
          <tr><td style="font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#0B7A55;padding-bottom:16px">lodgely</td></tr>
          <tr><td style="font-size:15px;line-height:22px;padding-bottom:24px">Click the button below to sign in to <strong>${safeHost}</strong>.</td></tr>
          <tr><td style="padding-bottom:24px">
            <a href="${safeUrl}" style="display:inline-block;background:#0B7A55;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:8px">Sign in</a>
          </td></tr>
          <tr><td style="font-size:13px;line-height:20px;color:#6A6A6A">This link expires in 24 hours and can only be used once. If you didn't request it, you can ignore this email.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  return { subject, text, html };
}
