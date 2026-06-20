import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderNumber, customerEmail, totalPrice, customerName } = await req.json()

    // 1. იმეილი მაღაზიის ადმინისტრატორისთვის (თქვენთვის)
    const adminEmailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Achuqe Shop <onboarding@resend.dev>', // აქ მოგვიანებით თქვენს დომენს მიაბამთ
        to: 'mrkosash@gmail.com', // თქვენი იმეილი, სადაც შეკვეთებს მიიღებთ
        subject: `ახალი შეკვეთა! #${orderNumber}`,
        html: `
          <h1>მიღებულია ახალი შეკვეთა!</h1>
          <p><strong>მყიდველი:</strong> ${customerName}</p>
          <p><strong>ელ-ფოსტა:</strong> ${customerEmail}</p>
          <p><strong>შეკვეთის ნომერი:</strong> #${orderNumber}</p>
          <p><strong>ჯამური თანხა:</strong> ${totalPrice} GEL</p>
        `,
      }),
    })

    // 2. საპასუხო იმეილი მომხმარებლისთვის (დასტური)
    if (customerEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Achuqe Shop <onboarding@resend.dev>',
          to: customerEmail,
          subject: `შეკვეთა მიღებულია! #${orderNumber}`,
          html: `
            <h2>გამარჯობა ${customerName}, მადლობა შენაძენისთვის!</h2>
            <p>თქვენი შეკვეთა #${orderNumber} წარმატებით დარეგისტრირდა.</p>
            <p><strong>ჯამური ღირებულება:</strong> ${totalPrice} GEL</p>
            <p>ჩვენი კურიერი მალე დაგიკავშირდებათ.</p>
          `,
        }),
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})