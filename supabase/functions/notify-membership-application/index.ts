import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NOTIFY_TO = 'events@cherrywoodfgc.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { application_id } = await req.json()
    if (!application_id) throw new Error('application_id required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    const { data: app, error: appErr } = await supabase
      .from('membership_applications')
      .select('*')
      .eq('id', application_id)
      .single()

    if (appErr || !app) throw new Error('Application not found')

    // Already notified — prevent replay / duplicate emails
    if (app.notified_at) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_sent' }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    const submittedStr = new Date(app.created_at).toLocaleString('en-US', {
      dateStyle: 'long', timeStyle: 'short'
    })

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Membership Application</title>
</head>
<body style="margin:0;padding:0;background:#f4ede0;font-family:Georgia,serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4ede0;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

        <tr>
          <td style="background:#004331;border-radius:10px 10px 0 0;padding:32px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(246,241,231,0.55);">Cherrywood Farm &amp; Golf Club</p>
            <h1 style="margin:0;font-size:26px;font-weight:400;color:#F6F1E7;letter-spacing:1px;">New Membership Application</h1>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:36px 40px;">

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ed;border:1px solid #e8dfc8;border-radius:8px;margin-bottom:20px;">
              <tr>
                <td style="padding:24px 28px;">
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding:4px 16px 4px 0;font-size:13px;color:#8a7060;white-space:nowrap;vertical-align:top;">Name</td>
                      <td style="padding:4px 0;font-size:14px;color:#1a1008;font-weight:600;">${app.name}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 16px 4px 0;font-size:13px;color:#8a7060;white-space:nowrap;vertical-align:top;">Phone</td>
                      <td style="padding:4px 0;font-size:14px;color:#1a1008;font-weight:600;"><a href="tel:${app.phone}" style="color:#1a1008;text-decoration:none;">${app.phone}</a></td>
                    </tr>
                    ${app.email ? `
                    <tr>
                      <td style="padding:4px 16px 4px 0;font-size:13px;color:#8a7060;white-space:nowrap;vertical-align:top;">Email</td>
                      <td style="padding:4px 0;font-size:14px;color:#1a1008;font-weight:600;"><a href="mailto:${app.email}" style="color:#1a1008;text-decoration:none;">${app.email}</a></td>
                    </tr>` : ''}
                    ${app.membership_type ? `
                    <tr>
                      <td style="padding:4px 16px 4px 0;font-size:13px;color:#8a7060;white-space:nowrap;vertical-align:top;">Interested In</td>
                      <td style="padding:4px 0;font-size:14px;color:#1a1008;font-weight:600;">${app.membership_type}</td>
                    </tr>` : ''}
                    <tr>
                      <td style="padding:4px 16px 4px 0;font-size:13px;color:#8a7060;white-space:nowrap;vertical-align:top;">Submitted</td>
                      <td style="padding:4px 0;font-size:14px;color:#1a1008;">${submittedStr}</td>
                    </tr>
                    ${app.notes ? `
                    <tr>
                      <td colspan="2" style="padding:12px 0 4px;font-size:13px;color:#5a4a3a;line-height:1.6;border-top:1px solid #e8dfc8;">"${app.notes}"</td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;line-height:1.6;color:#5a4a3a;">
              Reach out within 1–2 business days per the site's stated response time.
            </p>

          </td>
        </tr>

        <tr>
          <td style="background:#002a1f;border-radius:0 0 10px 10px;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:rgba(246,241,231,0.4);letter-spacing:1px;">
              © ${new Date().getFullYear()} Cherrywood Farm &amp; Golf Club &nbsp;·&nbsp; Fredericktown, MO
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Cherrywood Farm & Golf Club <noreply@cherrywoodgolf.com>',
        to: NOTIFY_TO,
        subject: `New membership application — ${app.name}`,
        html: emailHtml,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      throw new Error('Resend error: ' + err)
    }

    await supabase
      .from('membership_applications')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', application_id)

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' }
    })
  }
})
