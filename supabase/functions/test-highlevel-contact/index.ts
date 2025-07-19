import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subaccountId, apiKey } = await req.json();

    if (!subaccountId || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing subaccountId or apiKey' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Test contact data
    const testContact = {
      firstName: 'Test',
      lastName: 'Contact',
      email: 'test@example.com',
      phone: '+1234567890',
      tags: ['adult', 'member']
    };

    console.log('Creating test contact in HighLevel:', { subaccountId, contact: testContact });

    // Create contact in HighLevel
    const hlResponse = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify({
        firstName: testContact.firstName,
        lastName: testContact.lastName,
        email: testContact.email,
        phone: testContact.phone,
        tags: testContact.tags,
        locationId: subaccountId
      })
    });

    if (!hlResponse.ok) {
      const errorText = await hlResponse.text();
      console.error('HighLevel API Error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create contact in HighLevel',
          details: errorText,
          status: hlResponse.status 
        }),
        { 
          status: hlResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const hlResult = await hlResponse.json();
    console.log('HighLevel contact created successfully:', hlResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        contact: hlResult,
        message: 'Test contact created successfully with tags: adult, member'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error creating test contact:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});