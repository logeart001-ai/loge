import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
  type: 'submission_status' | 'welcome' | 'submission_confirmation'
  metadata?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { to, subject, html, text, type, metadata }: EmailRequest = await req.json()

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send email using Resend (you can replace with your preferred service)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Loge Arts <noreply@logeart.com>',
          to: [to],
          subject: subject,
          html: html,
          text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
        })
      })

      const emailResult = await emailResponse.json()

      if (!emailResponse.ok) {
        throw new Error(`Email sending failed: ${emailResult.message}`)
      }

      // Log successful email to notifications table
      await supabaseClient
        .from('notifications')
        .insert({
          recipient_email: to,
          subject: subject,
          content: html,
          type: 'email',
          status: 'sent',
          metadata: metadata,
          sent_at: new Date().toISOString()
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sent successfully',
          emailId: emailResult.id 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      // Fallback: Just log to notifications table (for development)
      await supabaseClient
        .from('notifications')
        .insert({
          recipient_email: to,
          subject: subject,
          content: html,
          type: 'email',
          status: 'logged', // Different status for development
          metadata: metadata,
          sent_at: new Date().toISOString()
        })

      console.log('Email would be sent (development mode):', { to, subject })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email logged successfully (development mode)' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Email function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* To deploy this function:
1. Install Supabase CLI: npm install -g supabase
2. Login: supabase login
3. Link project: supabase link --project-ref your-project-ref
4. Deploy: supabase functions deploy send-email
5. Set secrets:
   supabase secrets set RESEND_API_KEY=your_resend_api_key
*/