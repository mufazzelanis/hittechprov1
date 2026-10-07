import { siteUrl, absUrl } from "./seo";

// Shared branded wrapper for every transactional email (welcome, order confirmation, password reset,
// delivery, Payoneer pay link, test email...) so they all look like one professional, designed system
// instead of ad-hoc divs. Table-based layout with inline styles throughout - the only markup that
// renders consistently across Gmail, Outlook, Apple Mail and mobile mail apps.
export const BRAND = "#E8352B";
export const BRAND_DARK = "#B8241C";
export const BRAND_LIGHT = "#FF5B4F";
export const INK = "#1c1c28";
export const MIST = "#6b7280";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// A bulletproof CTA button (table-cell background, not a styled <a>) - renders correctly in Outlook too.
export function emailButton(label, href, { color = BRAND } = {}) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0;">
      <tr><td style="border-radius:10px;background-color:${color};">
        <a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${esc(label)}</a>
      </td></tr>
    </table>`;
}

// A small key/value summary table (used for order details) - keeps columns aligned across clients.
export function emailSummary(rows) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;border-collapse:collapse;">
      ${rows
        .map(
          ([label, value], i) => `
        <tr>
          <td style="padding:10px 0;border-top:${i === 0 ? "none" : "1px solid #ececf2"};color:${MIST};font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${esc(label)}</td>
          <td style="padding:10px 0;border-top:${i === 0 ? "none" : "1px solid #ececf2"};color:${INK};font-size:13px;font-weight:700;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${esc(value)}</td>
        </tr>`
        )
        .join("")}
    </table>`;
}

// `bodyHtml` is the pre-built inner content (heading + paragraphs + optional emailButton/emailSummary).
// `preheader` is the short hidden preview text shown next to the subject in an inbox list.
export function emailLayout({ s, preheader = "", bodyHtml, eyebrow = "" }) {
  const siteName = s?.siteName || "Website";
  const logo = absUrl(s, (s?.logo || "/logo-mark.png").trim() || "/logo-mark.png");
  const url = siteUrl(s);
  const address = s?.address ? esc(s.address) : "";
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(siteName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#f4f4f7;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f7;">
    <tr><td align="center" style="padding:36px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #ececf2;">
        <tr><td style="background-color:${BRAND};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:30px 32px 6px;text-align:center;">
          <a href="${esc(url)}" style="text-decoration:none;">
            <img src="${esc(logo)}" alt="${esc(siteName)}" height="34" style="height:34px;width:auto;display:inline-block;border:0;outline:none;" />
          </a>
          ${eyebrow ? `<p style="margin:14px 0 0;color:${MIST};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-family:${font};">${esc(eyebrow)}</p>` : ""}
        </td></tr>
        <tr><td style="padding:20px 32px 34px;color:${INK};font-size:15px;line-height:1.65;font-family:${font};">
          ${bodyHtml}
        </td></tr>
        <tr><td style="background-color:#f8f8fb;padding:22px 32px;text-align:center;border-top:1px solid #ececf2;">
          <p style="margin:0;color:${MIST};font-size:12px;line-height:1.7;font-family:${font};">
            <a href="${esc(url)}" style="color:${MIST};text-decoration:none;font-weight:700;">${esc(siteName)}</a>${address ? ` · ${address}` : ""}<br>
            This is an automated message - please don't reply directly to this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export { esc };
