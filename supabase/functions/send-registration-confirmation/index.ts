import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { registration_id } = await req.json()
    if (!registration_id) throw new Error('registration_id required')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    // Fetch registration + tournament details
    const { data: reg, error: regErr } = await supabase
      .from('tournament_registrations')
      .select('*, tournaments(*)')
      .eq('id', registration_id)
      .single()

    if (regErr || !reg) throw new Error('Registration not found')

    // Already sent — prevent replay / email spam
    if (reg.confirmation_no) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_sent' }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    // No email address — skip silently
    if (!reg.email) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no_email' }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      })
    }

    // Generate confirmation number: CW26-4821
    const confNo = 'CW' + new Date().getFullYear().toString().slice(2) +
                   '-' + String(Math.floor(1000 + Math.random() * 9000))

    // Save it back to the registration row
    await supabase
      .from('tournament_registrations')
      .update({ confirmation_no: confNo })
      .eq('id', registration_id)

    const t = reg.tournaments
    const d = new Date(t.date + 'T00:00:00')
    const dateStr = d.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    })
    let timeStr = 'Time TBA'
    if (t.time) {
      const [h, m] = t.time.split(':')
      const dt = new Date(); dt.setHours(+h, +m)
      timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }

    const registrantName = reg.team_name
      ? `${reg.team_name} (Captain: ${reg.captain_name})`
      : reg.captain_name

    const typeLabel = t.type === 'team'
      ? `Team (${t.team_size || ''} players)`
      : 'Individual'

    const entryFee = t.entry_fee
      ? `$${parseFloat(t.entry_fee).toFixed(2)}`
      : 'No entry fee'

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f4ede0;font-family:Georgia,serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4ede0;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

        <!-- Header -->
        <tr>
          <td style="background:#004331;border-radius:10px 10px 0 0;padding:32px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(246,241,231,0.55);">Cherrywood Farm &amp; Golf Club</p>
            <h1 style="margin:0;font-size:28px;font-weight:400;color:#F6F1E7;letter-spacing:1px;">You're Registered</h1>
          </td>
        </tr>

        <!-- Confirmation number band -->
        <tr>
          <td style="background:#d7aa2b;padding:14px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#002a1f;opacity:0.7;">Confirmation Number</p>
            <p style="margin:4px 0 0;font-size:24px;font-weight:700;letter-spacing:4px;color:#002a1f;font-family:'Courier New',monospace;">${confNo}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px;">

            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3a2a1a;">
              Hi ${reg.captain_name},<br><br>
              Your registration for <strong>${t.name}</strong> has been confirmed.
              We'll see you out on the course — save your confirmation number above for your records.
            </p>

            <!-- Event details box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ed;border:1px solid #e8dfc8;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9a8060;">Event Details</p>
                  <h2 style="margin:0 0 16px;font-size:20px;font-weight:400;color:#002a1f;">${t.name}</h2>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 16px 4px 0;font-size:13px;color:#8a7060;white-space:nowrap;vertical-align:top;">📅 Date</td>
                      <td style="padding:4px 0;font-size:13px;color:#1a1008;font-weight:600;">${dateStr}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 16px 4px 0;font-size:13px;color:#8a7060;white-space:nowrap;vertical-align:top;">🕐 Time</td>
                      <td style="padding:4px 0;font-size:13px;color:#1a1008;font-weight:600;">${timeStr}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 16px 4px 0;font-size:13px;color:#8a7060;white-space:nowrap;vertical-align:top;">🏌️ Format</td>
                      <td style="padding:4px 0;font-size:13px;color:#1a1008;font-weight:600;">${typeLabel}${t.format ? ' · ' + t.format : ''}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 16px 4px 0;font-size:13px;color:#8a7060;white-space:nowrap;vertical-align:top;">💵 Entry Fee</td>
                      <td style="padding:4px 0;font-size:13px;color:#1a1008;font-weight:600;">${entryFee}</td>
                    </tr>
                    ${t.description ? `
                    <tr>
                      <td colspan="2" style="padding:12px 0 4px;font-size:13px;color:#5a4a3a;line-height:1.6;border-top:1px solid #e8dfc8;">${t.description}</td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <!-- Registration details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ed;border:1px solid #e8dfc8;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 28px;">
                  <p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9a8060;">Your Registration</p>
                  <p style="margin:0;font-size:14px;color:#1a1008;"><strong>${registrantName}</strong></p>
                  <p style="margin:4px 0 0;font-size:13px;color:#8a7060;">${reg.phone}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#5a4a3a;">
              Questions? Contact us at
              <a href="mailto:info@cherrywoodgolf.com" style="color:#004331;">info@cherrywoodgolf.com</a>
              or visit <a href="https://cherrywoodgolf.com" style="color:#004331;">cherrywoodgolf.com</a>.
            </p>
            <p style="margin:0;font-size:13px;color:#8a7060;font-style:italic;">
              Cherrywood Farm &amp; Golf Club — Fredericktown, Missouri
            </p>

          </td>
        </tr>

        <!-- Footer -->
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

    // Send via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Cherrywood Farm & Golf Club <noreply@cherrywoodgolf.com>',
        to: reg.email,
        subject: `You're registered — ${t.name} (${confNo})`,
        html: emailHtml,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      throw new Error('Resend error: ' + err)
    }

    return new Response(JSON.stringify({ ok: true, confirmation_no: confNo }), {
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
