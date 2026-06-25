// Email template system for Selixo
// Templates use simple string interpolation for studio branding

export interface EmailTemplate {
  subject: string
  html: string
}

export function projectSharedEmail(params: {
  studioName: string
  clientName: string
  linkUrl: string
  welcomeMessage?: string
  logoUrl?: string
  primaryColor?: string
}): EmailTemplate {
  const primary = params.primaryColor ?? "#000000"
  const logo = params.logoUrl
    ? `<img src="${params.logoUrl}" alt="${params.studioName}" style="height:48px;width:auto;" />`
    : `<h1 style="margin:0;font-size:24px;color:${primary};">${params.studioName}</h1>`

  return {
    subject: `Your photo gallery from ${params.studioName} is ready!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
          <tr><td style="text-align:center;padding-bottom:32px;">${logo}</td></tr>
          <tr><td style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="margin:0 0 8px;font-size:22px;color:#111;">Your gallery is ready, ${params.clientName}!</h2>
            <p style="margin:0 0 24px;font-size:16px;color:#666;line-height:1.5;">
              ${params.welcomeMessage ?? `${params.studioName} has shared a proofing gallery with you.`}
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:${primary};border-radius:8px;padding:14px 32px;">
                  <a href="${params.linkUrl}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;display:block;">
                    View Your Gallery
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:14px;color:#999;text-align:center;">
              If the button doesn't work, copy this link:<br/>
              <a href="${params.linkUrl}" style="color:${primary};font-size:12px;">${params.linkUrl}</a>
            </p>
          </td></tr>
          <tr><td style="padding-top:24px;text-align:center;font-size:12px;color:#999;">
            Powered by Selixo
          </td></tr>
        </table>
      </body>
      </html>
    `,
  }
}

export function selectionsSubmittedEmail(params: {
  studioName: string
  clientName: string
  selectedCount: number
  dashboardUrl: string
}): EmailTemplate {
  return {
    subject: `${params.clientName} has submitted their selections!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
          <tr><td style="text-align:center;padding-bottom:32px;">
            <h1 style="margin:0;font-size:24px;color:#111;">${params.studioName}</h1>
          </td></tr>
          <tr><td style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="margin:0 0 8px;font-size:22px;color:#111;">Selections Received!</h2>
            <p style="margin:0 0 24px;font-size:16px;color:#666;line-height:1.5;">
              ${params.clientName} has submitted their selections — ${params.selectedCount} photos chosen.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:#111;border-radius:8px;padding:14px 32px;">
                  <a href="${params.dashboardUrl}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;display:block;">
                    View in Dashboard
                  </a>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  }
}
